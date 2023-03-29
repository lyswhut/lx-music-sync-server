import { networkInterfaces } from 'node:os'
import { randomBytes, createCipheriv, createDecipheriv, publicEncrypt, privateDecrypt, constants } from 'node:crypto'
// import { join } from 'node:path'
import type http from 'node:http'
// import getStore from '@/utils/store'
import { syncLog } from './log4js'
import { getUserName } from './data'
// import { saveClientKeyInfo } from './data'

export const getAddress = (): string[] => {
  const nets = networkInterfaces()
  const results: string[] = []
  // console.log(nets)

  for (const interfaceInfos of Object.values(nets)) {
    if (!interfaceInfos) continue
    // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
    for (const interfaceInfo of interfaceInfos) {
      if (interfaceInfo.family === 'IPv4' && !interfaceInfo.internal) {
        results.push(interfaceInfo.address)
      }
    }
  }
  return results
}

export const generateCode = (): string => {
  return Math.random().toString().substring(2, 8)
}

export const getIP = (request: http.IncomingMessage) => {
  let ip: string | undefined
  if (global.lx.config['proxy.enabled']) {
    const proxyIp = request.headers[global.lx.config['proxy.header']]
    if (typeof proxyIp == 'string') ip = proxyIp
  }
  ip ||= request.socket.remoteAddress

  return ip
}


export const aesEncrypt = (buffer: string | Buffer, key: string): string => {
  const cipher = createCipheriv('aes-128-ecb', Buffer.from(key, 'base64'), '')
  return Buffer.concat([cipher.update(buffer), cipher.final()]).toString('base64')
}

export const aesDecrypt = (text: string, key: string): string => {
  const decipher = createDecipheriv('aes-128-ecb', Buffer.from(key, 'base64'), '')
  return Buffer.concat([decipher.update(Buffer.from(text, 'base64')), decipher.final()]).toString()
}

export const rsaEncrypt = (buffer: Buffer, key: string): string => {
  return publicEncrypt({ key, padding: constants.RSA_PKCS1_OAEP_PADDING }, buffer).toString('base64')
}
export const rsaDecrypt = (buffer: Buffer, key: string): Buffer => {
  return privateDecrypt({ key, padding: constants.RSA_PKCS1_OAEP_PADDING }, buffer)
}

export const encryptMsg = (keyInfo: LX.Sync.KeyInfo, msg: string): string => {
  return msg
  // if (!keyInfo) return ''
  // return aesEncrypt(msg, keyInfo.key, keyInfo.iv)
}

export const decryptMsg = (keyInfo: LX.Sync.KeyInfo, enMsg: string): string => {
  return enMsg
  // if (!keyInfo) return ''
  // let msg = ''
  // try {
  //   msg = aesDecrypt(enMsg, keyInfo.key, keyInfo.iv)
  // } catch (err) {
  //   console.log(err)
  // }
  // return msg
}

// export const getSnapshotFilePath = (keyInfo: LX.Sync.KeyInfo): string => {
//   return join(global.lx.snapshotPath, `snapshot_${keyInfo.snapshotKey}.json`)
// }

export const sendStatus = (status: LX.Sync.Status) => {
  syncLog.info('status', status.devices.map(d => `${getUserName(d.clientId) ?? ''} ${d.deviceName}`))
}

export const createClientKeyInfo = (deviceName: string, isMobile: boolean): LX.Sync.KeyInfo => {
  const keyInfo: LX.Sync.KeyInfo = {
    clientId: randomBytes(4 * 4).toString('base64'),
    key: randomBytes(16).toString('base64'),
    deviceName,
    isMobile,
    snapshotKey: '',
    lastSyncDate: 0,
  }
  return keyInfo
}


export {
  getServerId,
  getUserConfig,
} from './data'
