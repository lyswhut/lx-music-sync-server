import fs from 'node:fs'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { throttle } from '@/utils/common'
import { filterFileName, toMD5 } from '@/utils'
import { File } from '@/constants'


interface ServerInfo {
  serverId: string
  version: number
}
interface DevicesInfo {
  userName: string
  clients: Record<string, LX.Sync.KeyInfo>
}
const serverInfoFilePath = path.join(global.lx.dataPath, File.serverInfoJSON)
const saveServerInfoThrottle = throttle(() => {
  fs.writeFile(serverInfoFilePath, JSON.stringify(serverInfo), 'utf8', (err) => {
    if (err) console.error(err)
  })
})
let serverInfo: ServerInfo
if (fs.existsSync(serverInfoFilePath)) {
  serverInfo = JSON.parse(fs.readFileSync(serverInfoFilePath).toString())
} else {
  serverInfo = {
    serverId: randomBytes(4 * 4).toString('base64'),
    version: 2,
  }
  saveServerInfoThrottle()
}
export const getServerId = (): string => {
  return serverInfo.serverId
}
export const getVersion = () => {
  return serverInfo.version ?? 1
}
export const setVersion = (version: number) => {
  serverInfo.version = version
  saveServerInfoThrottle()
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
  const devicesFilePath = path.join(global.lx.userPath, dirname, File.userDevicesJSON)
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
export const getUserName = (clientId: string | null): string | null => {
  if (!clientId) return null
  return deviceUserMap.get(clientId) ?? null
}
export const setUserName = (clientId: string, dir: string) => {
  deviceUserMap.set(clientId, dir)
}
export const deleteUserName = (clientId: string) => {
  deviceUserMap.delete(clientId)
}

export const createClientKeyInfo = (deviceName: string, isMobile: boolean): LX.Sync.KeyInfo => {
  const keyInfo: LX.Sync.KeyInfo = {
    clientId: randomBytes(4 * 4).toString('base64'),
    key: randomBytes(16).toString('base64'),
    deviceName,
    isMobile,
    lastConnectDate: 0,
  }
  return keyInfo
}

export class UserDataManage {
  userName: string
  userDir: string
  devicesFilePath: string
  devicesInfo: DevicesInfo
  private readonly saveDevicesInfoThrottle: () => void

  getAllClientKeyInfo = () => {
    return Object.values(this.devicesInfo.clients).sort((a, b) => (b.lastConnectDate ?? 0) - (a.lastConnectDate ?? 0))
  }

  saveClientKeyInfo = (keyInfo: LX.Sync.KeyInfo) => {
    if (this.devicesInfo.clients[keyInfo.clientId] == null && Object.keys(this.devicesInfo.clients).length > 101) throw new Error('max keys')
    this.devicesInfo.clients[keyInfo.clientId] = keyInfo
    this.saveDevicesInfoThrottle()
  }

  getClientKeyInfo = (clientId: string | null): LX.Sync.KeyInfo | null => {
    if (!clientId) return null
    return this.devicesInfo.clients[clientId] ?? null
  }

  removeClientKeyInfo = async(clientId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete this.devicesInfo.clients[clientId]
    this.saveDevicesInfoThrottle()
  }

  isIncluedsClient = (clientId: string) => {
    return Object.values(this.devicesInfo.clients).some(client => client.clientId == clientId)
  }

  constructor(userName: string) {
    this.userName = userName
    this.userDir = path.join(global.lx.userPath, getUserDirname(userName))
    this.devicesFilePath = path.join(this.userDir, File.userDevicesJSON)
    this.devicesInfo = fs.existsSync(this.devicesFilePath) ? JSON.parse(fs.readFileSync(this.devicesFilePath).toString()) : { userName, clients: {} }

    this.saveDevicesInfoThrottle = throttle(() => {
      fs.writeFile(this.devicesFilePath, JSON.stringify(this.devicesInfo), 'utf8', (err) => {
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
