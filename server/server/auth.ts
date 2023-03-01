import type http from 'http'
import { SYNC_CODE } from '@/constants'
import {
  aesEncrypt,
  aesDecrypt,
  createClientKeyInfo,
  getClientKeyInfo,
  saveClientKeyInfo,
  rsaEncrypt,
  getIP,
} from '@/utils/tools'
import querystring from 'node:querystring'
import store from '@/utils/cache'


export const authCode = async(req: http.IncomingMessage, res: http.ServerResponse, password: string) => {
  let code = 401
  let msg: string = SYNC_CODE.msgAuthFailed

  let ip = getIP(req)
  // console.log(req.headers)
  if (typeof req.headers.m == 'string') {
    if (ip && (store.get<number>(ip) ?? 0) < 10) {
      if (req.headers.m) {
        label:
        if (req.headers.i) { // key验证
          if (typeof req.headers.i != 'string') break label
          const keyInfo = getClientKeyInfo(req.headers.i)
          if (!keyInfo) break label
          let text
          try {
            text = aesDecrypt(req.headers.m, keyInfo.key)
          } catch (err) {
            break label
          }
          // console.log(text)
          if (text.startsWith(SYNC_CODE.authMsg)) {
            code = 200
            const deviceName = text.replace(SYNC_CODE.authMsg, '') || 'Unknown'
            if (deviceName != keyInfo.deviceName) {
              keyInfo.deviceName = deviceName
              saveClientKeyInfo(keyInfo)
            }
            msg = aesEncrypt(SYNC_CODE.helloMsg, keyInfo.key)
          }
        } else { // 连接码验证
          let key = ''.padStart(16, Buffer.from(password).toString('hex'))
          // const iv = Buffer.from(key.split('').reverse().join('')).toString('base64')
          key = Buffer.from(key).toString('base64')
          // console.log(req.headers.m, authCode, key)
          let text
          try {
            text = aesDecrypt(req.headers.m, key)
          } catch (err) {
            break label
          }
          // console.log(text)
          if (text.startsWith(SYNC_CODE.authMsg)) {
            code = 200
            const data = text.split('\n')
            const publicKey = `-----BEGIN PUBLIC KEY-----\n${data[1]}\n-----END PUBLIC KEY-----`
            const deviceName = data[2] || 'Unknown'
            const isMobile = data[3] == 'lx_music_mobile'
            const keyInfo = createClientKeyInfo(deviceName, isMobile)
            msg = rsaEncrypt(Buffer.from(JSON.stringify({
              clientId: keyInfo.clientId,
              key: keyInfo.key,
              serverName: global.lx.config.serverName,
            })), publicKey)
          }
        }
      }
    } else {
      code = 403
      msg = SYNC_CODE.msgBlockedIp
    }
  }
  res.writeHead(code)
  res.end(msg)

  if (ip && code != 200) {
    const num = store.get<number>(ip) ?? 0
    if (num > 20) return
    store.set(ip, num + 1)
  }
}

export const authConnect = async(req: http.IncomingMessage) => {
  const query = querystring.parse((req.url as string).split('?')[1])
  const i = query.i
  const t = query.t
  label:
  if (typeof i == 'string' && typeof t == 'string') {
    const keyInfo = getClientKeyInfo(i)
    if (!keyInfo) break label
    let text
    try {
      text = aesDecrypt(t, keyInfo.key)
    } catch (err) {
      break label
    }
    // console.log(text)
    if (text == SYNC_CODE.msgConnect) return
  }
  throw new Error('failed')
}

