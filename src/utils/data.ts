import { throttle } from '@/utils/common'
import fs from 'node:fs'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { syncLog } from './log4js'
import { checkAndCreateDirSync, filterFileName, toMD5 } from './index'

const Files = {
  serverInfo: 'serverInfo.json',
  devices: 'devices.json',
} as const

interface ServerInfo {
  serverId?: string
}
const serverInfoFilePath = path.join(global.lx.dataPath, Files.serverInfo)
const serverInfo: ServerInfo = fs.existsSync(serverInfoFilePath) ? JSON.parse(fs.readFileSync(serverInfoFilePath).toString()) : { }
const saveServerInfoThrottle = throttle(() => {
  fs.writeFile(serverInfoFilePath, JSON.stringify(serverInfo), 'utf8', (err) => {
    if (err) console.error(err)
  })
})
export const getServerId = (): string => {
  if (!serverInfo.serverId) {
    serverInfo.serverId = randomBytes(4 * 4).toString('base64')
    saveServerInfoThrottle()
  }
  return serverInfo.serverId
}

export const getUserDirname = (userName: string) => `${filterFileName(userName)}_${toMD5(userName).substring(0, 6)}`

export const getUserConfig = (userName: string): Required<LX.User> => {
  const user = global.lx.config.users.find(u => u.name == userName)
  if (!user) throw new Error('user not found: ' + userName)
  return {
    maxSnapshotNum: global.lx.config.maxSnapshotNum,
    'list.addMusicLocationType': global.lx.config['list.addMusicLocationType'],
    ...user,
  }
}


// 读取所有用户目录下的devicesInfo信息，建立clientId与用户的对应关系，用于非首次连接
const deviceUserMap = new Map<string, string>()
for (const deviceInfo of fs.readdirSync(global.lx.userPath).map(dirname => {
  const devicesFilePath = path.join(global.lx.userPath, dirname, Files.devices)
  if (fs.existsSync(devicesFilePath)) {
    const devicesInfo = JSON.parse(fs.readFileSync(devicesFilePath).toString()) as DevicesInfo
    if (getUserDirname(devicesInfo.userName) == dirname) return { userName: devicesInfo.userName, devices: devicesInfo.clients }
  }
  return { userName: '', devices: {} }
})) {
  for (const device of Object.values(deviceInfo.devices)) {
    if (deviceInfo.userName) deviceUserMap.set(device.clientId, deviceInfo.userName)
  }
}
export const getUserName = (clientId: string): string | null => {
  if (!clientId) return null
  return deviceUserMap.get(clientId) ?? null
}
export const setUserName = (clientId: string, dir: string) => {
  deviceUserMap.set(clientId, dir)
}
export const deleteUserName = (clientId: string) => {
  deviceUserMap.delete(clientId)
}


interface DevicesInfo {
  userName: string
  clients: Record<string, LX.Sync.KeyInfo>
}
interface SnapshotInfo {
  latest: string | null
  time: number
  list: string[]
}
export class UserDataManage {
  userName: string
  userDir: string
  snapshotDir: string
  devicesFilePath: string
  snapshotInfoFilePath: string
  devicesInfo: DevicesInfo
  snapshotInfo: SnapshotInfo
  deviceKeys: string[]
  private readonly saveDevicesInfoThrottle: () => void
  private readonly saveSnapshotInfoThrottle: () => void

  saveClientKeyInfo = (keyInfo: LX.Sync.KeyInfo) => {
    if (this.devicesInfo.clients[keyInfo.clientId] == null && Object.keys(this.devicesInfo.clients).length > 101) throw new Error('max keys')
    this.devicesInfo.clients[keyInfo.clientId] = keyInfo
    this.saveDevicesInfoThrottle()
  }

  getClientKeyInfo = (clientId?: string): LX.Sync.KeyInfo | null => {
    if (!clientId) return null
    return this.devicesInfo.clients[clientId] ?? null
  }

  isIncluedsDevice = (name: string) => {
    return this.deviceKeys.includes(name)
  }

  clearOldSnapshot = () => {
    if (!this.snapshotInfo) return
    const snapshotList = this.snapshotInfo.list.filter(name => !this.isIncluedsDevice(name))
    // console.log(snapshotList.length, lx.config.maxSnapshotNum)
    const userMaxSnapshotNum = getUserConfig(this.userName).maxSnapshotNum
    let requiredSave = snapshotList.length > userMaxSnapshotNum
    while (snapshotList.length > userMaxSnapshotNum) {
      const name = snapshotList.pop()
      if (name) {
        this.removeSnapshot(name)
        this.snapshotInfo.list.splice(this.snapshotInfo.list.indexOf(name), 1)
      } else break
    }
    if (requiredSave) this.saveSnapshotInfo(this.snapshotInfo)
  }

  updateDeviceSnapshotKey = (keyInfo: LX.Sync.KeyInfo, key: string) => {
    // console.log('updateDeviceSnapshotKey', key)
    if (keyInfo.snapshotKey) this.deviceKeys.splice(this.deviceKeys.indexOf(keyInfo.snapshotKey), 1)
    keyInfo.snapshotKey = key
    keyInfo.lastSyncDate = Date.now()
    this.saveClientKeyInfo(keyInfo)
    this.deviceKeys.push(key)
    this.saveDevicesInfoThrottle()
    this.clearOldSnapshot()
  }

  getSnapshotInfo = (): SnapshotInfo => {
    return this.snapshotInfo
  }

  saveSnapshotInfo = (info: SnapshotInfo) => {
    this.snapshotInfo = info
    this.saveSnapshotInfoThrottle()
  }

  getSnapshot = (name: string) => {
    const filePath = path.join(this.snapshotDir, `snapshot_${name}`)
    let listData: LX.Sync.ListData
    try {
      listData = JSON.parse(fs.readFileSync(filePath).toString('utf-8'))
    } catch (err) {
      syncLog.warn(err)
      return null
    }
    return listData
  }

  saveSnapshot = (name: string, data: string) => {
    syncLog.info('saveSnapshot', this.userName, name)
    const filePath = path.join(this.snapshotDir, `snapshot_${name}`)
    try {
      fs.writeFileSync(filePath, data)
    } catch (err) {
      syncLog.error(err)
      throw err
    }
  }

  removeSnapshot = (name: string) => {
    syncLog.info('removeSnapshot', this.userName, name)
    const filePath = path.join(this.snapshotDir, `snapshot_${name}`)
    try {
      fs.unlinkSync(filePath)
    } catch (err) {
      syncLog.error(err)
    }
  }


  constructor(userName: string) {
    this.userName = userName
    this.userDir = path.join(global.lx.userPath, getUserDirname(userName))
    this.devicesFilePath = path.join(this.userDir, Files.devices)
    this.devicesInfo = fs.existsSync(this.devicesFilePath) ? JSON.parse(fs.readFileSync(this.devicesFilePath).toString()) : { userName, clients: {} }

    this.saveDevicesInfoThrottle = throttle(() => {
      fs.writeFile(this.devicesFilePath, JSON.stringify(this.devicesInfo), 'utf8', (err) => {
        if (err) console.error(err)
      })
    })
    this.deviceKeys = Object.values(this.devicesInfo.clients).map(device => device.snapshotKey).filter(k => k)

    this.snapshotInfoFilePath = path.join(this.userDir, 'snapshotInfo.json')
    this.snapshotInfo = fs.existsSync(this.snapshotInfoFilePath)
      ? JSON.parse(fs.readFileSync(this.snapshotInfoFilePath).toString())
      : { latest: null, time: 0, list: [] }

    this.snapshotDir = path.join(this.userDir, 'snapshot')
    checkAndCreateDirSync(this.snapshotDir)

    this.saveSnapshotInfoThrottle = throttle(() => {
      fs.writeFile(this.snapshotInfoFilePath, JSON.stringify(this.snapshotInfo), 'utf8', (err) => {
        if (err) console.error(err)
      })
    })
  }
}
// type UserDataManages = Map<string, UserDataManage>

// export const createUserDataManage = (user: LX.UserConfig) => {
//   const manage = Object.create(userDataManage) as typeof userDataManage
//   manage.userDir = user.dataPath
// }
