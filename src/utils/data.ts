import {throttle} from '@/utils/common'
import fs from 'node:fs'
import path from 'node:path'
import {randomBytes} from 'node:crypto'
import {syncLog} from './log4js'
import {isItInTheArray} from "@/index";

interface DevicesInfo {
  serverId: string
  userNames: Record<string, { clients: Record<string, LX.Sync.KeyInfo> }>
}

const dataPath = global.lx.dataPath
const devicesFilePath = path.join(dataPath, 'devices.json')

const saveDevicesInfoThrottle = throttle(() => {
  fs.writeFile(devicesFilePath, JSON.stringify(devicesInfo), 'utf8', (err) => {
    if (err) console.error(err)
  })
})

const getDevicesInfos = () => {
  let devicesInfo: DevicesInfo = {serverId: '', userNames: {}}
  const userNames = Object.keys(global.lx.users)
  for (const userName of Object.keys(global.lx.users)) {
    devicesInfo.userNames[userName] = {clients: {}}
  }
  if (fs.existsSync(devicesFilePath)) {
    const localDevicesInfo = JSON.parse(fs.readFileSync(devicesFilePath).toString())
    devicesInfo.serverId = localDevicesInfo.serverId
    for (const userName of Object.keys(localDevicesInfo.userNames)) {
      if (isItInTheArray(userName, userNames) || !global.lx.clearDeleteUserData) {
        console.log('加载本地【', userName, '】信息')
        devicesInfo.userNames[userName] = localDevicesInfo.userNames[userName]
      }
    }
  }
  return devicesInfo
}
const devicesInfo: DevicesInfo = getDevicesInfos()

saveDevicesInfoThrottle()

export const getDeviceKeys = (userName: string) => {
  return Object.values(devicesInfo.userNames[userName].clients).map(device => device.snapshotKey).filter(k => k)
}

export const saveClientKeyInfo = (userName: string, keyInfo: LX.Sync.KeyInfo) => {
  const clients = devicesInfo.userNames[userName].clients
  if (clients[keyInfo.clientId] == null && Object.keys(clients).length > 101) throw new Error('max keys')
  clients[keyInfo.clientId] = keyInfo
  saveDevicesInfoThrottle()
}

export const getUserName = (clientId?: string): string | null => {
  if (!clientId) return null
  for (const userName of Object.keys(devicesInfo.userNames)) {
    if (isItInTheArray(clientId, Object.keys(devicesInfo.userNames[userName].clients))) {
      return userName.toString()
    }
  }
  return null
}

export const getClientKeyInfo = (userName: string, clientId?: string): LX.Sync.KeyInfo | null => {
  if (!clientId) return null
  return devicesInfo.userNames[userName].clients[clientId]
}

export const getServerId = (): string => {
  if (!devicesInfo.serverId) devicesInfo.serverId = randomBytes(4 * 4).toString('base64')
  saveDevicesInfoThrottle()
  return devicesInfo.serverId
}

export const isIncluedsDevice = (userName: string, name: string) => {
  const deviceKeys = getDeviceKeys(userName)
  if (deviceKeys) return deviceKeys.includes(name)
}

export const clearOldSnapshot = (userName: string) => {
  const snapshotInfo = snapshotInfos[userName]
  if (!snapshotInfo) return
  const snapshotList = snapshotInfo.list.filter(name => !isIncluedsDevice(userName, name))
  // console.log(snapshotList.length, lx.config.maxSsnapshotNum)
  let requiredSave = snapshotList.length > global.lx.users[userName].maxSsnapshotNum
  while (snapshotList.length > global.lx.users[userName].maxSsnapshotNum) {
    const name = snapshotList.pop()
    if (name) {
      removeSnapshot(userName, name)
      snapshotInfo.list.splice(snapshotInfo.list.indexOf(name), 1)
    } else break
  }
  if (requiredSave) saveSnapshotInfo(userName, snapshotInfo)
}

export const updateDeviceSnapshotKey = (userName: string, keyInfo: LX.Sync.KeyInfo, key: string) => {
  // console.log('updateDeviceSnapshotKey', key)
  const deviceKeys = getDeviceKeys(userName)
  if (deviceKeys) {
    if (keyInfo.snapshotKey) deviceKeys.splice(deviceKeys.indexOf(keyInfo.snapshotKey), 1)
    keyInfo.snapshotKey = key
    keyInfo.lastSyncDate = Date.now()
    saveClientKeyInfo(userName, keyInfo)
    deviceKeys.push(key)
    saveDevicesInfoThrottle()
    clearOldSnapshot(userName)
  }
}

interface SnapshotInfo {
  latest: string | null
  time: number
  list: string[]
}

const snapshotInfos: Record<string, SnapshotInfo> = {}

for (const userName of Object.keys(global.lx.users)) {
  const snapshotInfoFilePath = path.join(lx.dataPath, userName, 'snapshotInfo.json')
  snapshotInfos[userName] = fs.existsSync(snapshotInfoFilePath) ? JSON.parse(fs.readFileSync(snapshotInfoFilePath).toString())
    : {latest: null, time: 0, list: []}
}

const saveSnapshotInfoThrottle = throttle((userName: string) => {
  fs.writeFile(path.join(dataPath, userName, 'snapshotInfo.json'), JSON.stringify(snapshotInfos[userName]), 'utf8', (err) => {
    if (err) console.error(err)
  })
})

export const getSnapshotInfo = (userName: string): SnapshotInfo => {
  return snapshotInfos[userName]
}

export const saveSnapshotInfo = (userName: string, info: SnapshotInfo) => {
  snapshotInfos[userName] = info
  saveSnapshotInfoThrottle(userName)
}

export const getSnapshot = (userName: string, name: string) => {
  const filePath = path.join(lx.dataPath, userName, 'snapshot', `snapshot_${name}`)
  let listData: LX.Sync.ListData
  try {
    listData = JSON.parse(fs.readFileSync(filePath).toString('utf-8'))
  } catch (err) {
    syncLog.warn(err)
    return null
  }
  return listData
}

export const saveSnapshot = (userName: string, name: string, data: string) => {
  syncLog.info('saveSnapshot', name)
  const filePath = path.join(lx.dataPath, userName, 'snapshot', `snapshot_${name}`)
  try {
    fs.writeFileSync(filePath, data)
  } catch (err) {
    syncLog.error(err)
    throw err
  }
}

export const removeSnapshot = (userName: string, name: string) => {
  syncLog.info('removeSnapshot', name)
  const filePath = path.join(lx.dataPath, userName, 'snapshot', `snapshot_${name}`)
  try {
    fs.unlinkSync(filePath)
  } catch (err) {
    syncLog.error(err)
  }
}
