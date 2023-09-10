import { File } from '@/constants'
import { getVersion, setVersion } from '@/user'
import fs from 'node:fs'
import path from 'node:path'
import { checkAndCreateDirSync } from '..'

interface ServerKeyInfo {
  clientId: string
  key: string
  deviceName: string
  lastSyncDate?: number
  snapshotKey?: string
  lastConnectDate?: number
  isMobile: boolean
}

export default (dataPath: string, userPath: string) => {
  const version = getVersion()
  if (version != 1) return
  console.log('数据迁移：v1 -> v2')
  for (const dir of fs.readdirSync(userPath)) {
    const userDir = path.join(userPath, dir)
    const listDir = path.join(userDir, File.listDir)
    checkAndCreateDirSync(listDir)
    const oldSnapshotDir = path.join(userDir, File.listSnapshotDir)
    if (fs.existsSync(oldSnapshotDir)) fs.renameSync(oldSnapshotDir, path.join(listDir, File.listSnapshotDir))

    const oldSnapshotInfoPath = path.join(userDir, File.listSnapshotInfoJSON)
    if (!fs.existsSync(oldSnapshotInfoPath)) continue
    const devicesInfoPath = path.join(userDir, File.userDevicesJSON)
    const snapshotInfo = JSON.parse(fs.readFileSync(oldSnapshotInfoPath).toString())
    const devicesInfo = JSON.parse(fs.readFileSync(devicesInfoPath).toString())
    snapshotInfo.clients = {}
    for (const device of (Object.values<ServerKeyInfo>(devicesInfo.clients))) {
      snapshotInfo.clients[device.clientId] = {
        snapshotKey: device.snapshotKey,
        lastSyncDate: device.lastSyncDate,
      }
      device.lastConnectDate = device.lastSyncDate
      delete device.lastSyncDate
      delete device.snapshotKey
    }
    fs.writeFileSync(path.join(listDir, File.listSnapshotInfoJSON), JSON.stringify(snapshotInfo))
    fs.writeFileSync(devicesInfoPath, JSON.stringify(devicesInfo))
    fs.unlinkSync(oldSnapshotInfoPath)
  }
  setVersion(2)
}

