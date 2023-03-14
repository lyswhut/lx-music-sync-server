import {throttle} from '@/utils/common'
import fs from 'node:fs'
import path from 'node:path'
import {randomBytes} from 'node:crypto'
import {syncLog} from './log4js'

interface DevicesInfo {
  serverId: string
  userNames: Record<string, { clients: Record<string, LX.Sync.KeyInfo> }>
}

const dataPath = global.lx.dataPath
const devicesFilePath = path.join(dataPath, 'devices.json')
const getDevicesInfos = () => {
  let devicesInfo: DevicesInfo
  if (fs.existsSync(devicesFilePath)) {
    devicesInfo = JSON.parse(fs.readFileSync(devicesFilePath).toString())
  } else {
    devicesInfo = {serverId: '', userNames: {}}
    for (const userName of Object.keys(global.lx.configs)) {
      devicesInfo.userNames[userName] = {clients: {}}
    }
  }
  return devicesInfo
}
const devicesInfo: DevicesInfo = getDevicesInfos()

const saveDevicesInfoThrottle = throttle(() => {
  fs.writeFile(devicesFilePath, JSON.stringify(devicesInfo), 'utf8', (err) => {
    if (err) console.error(err)
  })
})

export const getDeviceKeys = (userName: string) => {
  return Object.values(devicesInfo.userNames[userName].clients).map(device => device.snapshotKey).filter(k => k)
}

export const saveClientKeyInfo = (userName: string, keyInfo: LX.Sync.KeyInfo) => {
  const clients = devicesInfo.userNames[userName].clients
  if (clients[keyInfo.clientId] == null && Object.keys(clients).length > 101) throw new Error('max keys')
  clients[keyInfo.clientId] = keyInfo
  saveDevicesInfoThrottle()
}
export const getUserName = (clientId?: string) => {
  if (!clientId) return null
  for (const userName of Object.keys(devicesInfo.userNames)) {
    if (Object.keys(devicesInfo.userNames[userName].clients).indexOf(clientId) > -1) {
      return userName
    }
  }
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
  const snapshotInfo = snapshotInfos.get(userName)
  if (!snapshotInfo) return
  const snapshotList = snapshotInfo.list.filter(name => !isIncluedsDevice(userName, name))
  // console.log(snapshotList.length, lx.config.maxSsnapshotNum)
  let requiredSave = snapshotList.length > lx.configs[userName].maxSsnapshotNum
  while (snapshotList.length > lx.configs[userName].maxSsnapshotNum) {
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

let snapshotInfos = new Map<string, SnapshotInfo>()

for (const userName of Object.keys(global.lx.configs)) {
  const snapshotInfoFilePath = path.join(lx.dataPath, userName, 'snapshotInfo.json')
  snapshotInfos.set(userName, fs.existsSync(snapshotInfoFilePath)
    ? JSON.parse(fs.readFileSync(snapshotInfoFilePath).toString())
    : {latest: null, time: 0, list: []})
}

const saveSnapshotInfoThrottle = throttle((userName: string) => {
  fs.writeFile(path.join(dataPath, userName, 'snapshotInfo.json'), JSON.stringify(snapshotInfos.get(userName)), 'utf8', (err) => {
    if (err) console.error(err)
  })
})

export const getSnapshotInfo = (userName: string): SnapshotInfo => {
  // @ts-ignore
  return snapshotInfos.get(userName)
}

export const saveSnapshotInfo = (userName: string, info: SnapshotInfo) => {
  snapshotInfos.set(userName, info)
  saveSnapshotInfoThrottle(userName)
}

export const getSnapshot = (userName: string, name: string) => {
  const filePath = path.join(lx.dataPath, userName, `snapshot_${name}`)
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
  const filePath = path.join(lx.dataPath, userName, `snapshot_${name}`)
  try {
    fs.writeFileSync(filePath, data)
  } catch (err) {
    syncLog.error(err)
    throw err
  }
}
export const removeSnapshot = (userName: string, name: string) => {
  syncLog.info('removeSnapshot', name)
  const filePath = path.join(lx.dataPath, userName, `snapshot_${name}`)
  try {
    fs.unlinkSync(filePath)
  } catch (err) {
    syncLog.error(err)
  }
}
