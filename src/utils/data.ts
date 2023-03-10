import { throttle } from '@/utils/common'
import fs from 'node:fs'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { syncLog } from './log4js'

interface DevicesInfo {
  serverId?: string
  clients: Record<string, LX.Sync.KeyInfo>
}
const devicesFilePath = path.join(global.lx.dataPath, 'devices.json')
const devicesInfo: DevicesInfo = fs.existsSync(devicesFilePath) ? JSON.parse(fs.readFileSync(devicesFilePath).toString()) : { clients: {} }
const saveDevicesInfoThrottle = throttle(() => {
  fs.writeFile(devicesFilePath, JSON.stringify(devicesInfo), 'utf8', (err) => {
    if (err) console.error(err)
  })
})
const deviceKeys = Object.values(devicesInfo.clients).map(device => device.snapshotKey).filter(k => k)

export const saveClientKeyInfo = (keyInfo: LX.Sync.KeyInfo) => {
  if (devicesInfo.clients[keyInfo.clientId] == null && Object.keys(devicesInfo.clients).length > 101) throw new Error('max keys')
  devicesInfo.clients[keyInfo.clientId] = keyInfo
  saveDevicesInfoThrottle()
}
export const getClientKeyInfo = (clientId?: string): LX.Sync.KeyInfo | null => {
  if (!clientId) return null
  return devicesInfo.clients[clientId] ?? null
}
export const getServerId = (): string => {
  if (!devicesInfo.serverId) {
    devicesInfo.serverId = randomBytes(4 * 4).toString('base64')
    saveDevicesInfoThrottle()
  }
  return devicesInfo.serverId
}
export const isIncluedsDevice = (name: string) => {
  return deviceKeys.includes(name)
}
export const clearOldSnapshot = () => {
  if (!snapshotInfo) return
  const snapshotList = snapshotInfo.list.filter(name => !isIncluedsDevice(name))
  // console.log(snapshotList.length, lx.config.maxSsnapshotNum)
  let requiredSave = snapshotList.length > lx.config.maxSsnapshotNum
  while (snapshotList.length > lx.config.maxSsnapshotNum) {
    const name = snapshotList.pop()
    if (name) {
      removeSnapshot(name)
      snapshotInfo.list.splice(snapshotInfo.list.indexOf(name), 1)
    } else break
  }
  if (requiredSave) saveSnapshotInfo(snapshotInfo)
}
export const updateDeviceSnapshotKey = (keyInfo: LX.Sync.KeyInfo, key: string) => {
  // console.log('updateDeviceSnapshotKey', key)
  if (keyInfo.snapshotKey) deviceKeys.splice(deviceKeys.indexOf(keyInfo.snapshotKey), 1)
  keyInfo.snapshotKey = key
  keyInfo.lastSyncDate = Date.now()
  saveClientKeyInfo(keyInfo)
  deviceKeys.push(key)
  saveDevicesInfoThrottle()
  clearOldSnapshot()
}


interface SnapshotInfo {
  latest: string | null
  time: number
  list: string[]
}
const snapshotInfoFilePath = path.join(lx.dataPath, 'snapshotInfo.json')
let snapshotInfo: SnapshotInfo = fs.existsSync(snapshotInfoFilePath)
  ? JSON.parse(fs.readFileSync(snapshotInfoFilePath).toString())
  : { latest: null, time: 0, list: [] }
const saveSnapshotInfoThrottle = throttle(() => {
  fs.writeFile(snapshotInfoFilePath, JSON.stringify(snapshotInfo), 'utf8', (err) => {
    if (err) console.error(err)
  })
})
export const getSnapshotInfo = (): SnapshotInfo => {
  return snapshotInfo
}
export const saveSnapshotInfo = (info: SnapshotInfo) => {
  snapshotInfo = info
  saveSnapshotInfoThrottle()
}

export const getSnapshot = (name: string) => {
  const filePath = path.join(lx.snapshotPath, `snapshot_${name}`)
  let listData: LX.Sync.ListData
  try {
    listData = JSON.parse(fs.readFileSync(filePath).toString('utf-8'))
  } catch (err) {
    syncLog.warn(err)
    return null
  }
  return listData
}
export const saveSnapshot = (name: string, data: string) => {
  syncLog.info('saveSnapshot', name)
  const filePath = path.join(lx.snapshotPath, `snapshot_${name}`)
  try {
    fs.writeFileSync(filePath, data)
  } catch (err) {
    syncLog.error(err)
    throw err
  }
}
export const removeSnapshot = (name: string) => {
  syncLog.info('removeSnapshot', name)
  const filePath = path.join(lx.snapshotPath, `snapshot_${name}`)
  try {
    fs.unlinkSync(filePath)
  } catch (err) {
    syncLog.error(err)
  }
}
