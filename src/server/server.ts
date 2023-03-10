import http, { type IncomingMessage } from 'node:http'
import url from 'node:url'
import { WebSocketServer } from 'ws'
import * as modules from './modules'
import { authCode, authConnect } from './auth'
import { getAddress, getServerId, getClientKeyInfo, saveClientKeyInfo, sendStatus, decryptMsg, encryptMsg } from '@/utils/tools'
import syncList from './syncList'
import { accessLog, startupLog, syncLog } from '@/utils/log4js'
import { SYNC_CLOSE_CODE, SYNC_CODE } from '@/constants'


let status: LX.Sync.Status = {
  status: false,
  message: '',
  address: [],
  // code: '',
  devices: [],
}

// const codeTools: {
//   timeout: NodeJS.Timer | null
//   start: () => void
//   stop: () => void
// } = {
//   timeout: null,
//   start() {
//     this.stop()
//     this.timeout = setInterval(() => {
//       void generateCode()
//     }, 60 * 3 * 1000)
//   },
//   stop() {
//     if (!this.timeout) return
//     clearInterval(this.timeout)
//     this.timeout = null
//   },
// }

const handleConnection = async(socket: LX.Socket, request: IncomingMessage) => {
  const queryData = url.parse(request.url as string, true).query as Record<string, string>

  socket.onClose(() => {
    // console.log('disconnect', reason)
    status.devices.splice(status.devices.findIndex(k => k.clientId == keyInfo?.clientId), 1)
    sendStatus(status)
  })


  //   // if (typeof socket.handshake.query.i != 'string') return socket.disconnect(true)
  const keyInfo = getClientKeyInfo(queryData.i)
  if (!keyInfo) {
    socket.close(SYNC_CLOSE_CODE.failed)
    return
  }
  keyInfo.lastSyncDate = Date.now()
  saveClientKeyInfo(keyInfo)
  //   // socket.lx_keyInfo = keyInfo
  socket.keyInfo = keyInfo
  try {
    await syncList(wss as LX.SocketServer, socket)
  } catch (err) {
    // console.log(err)
    syncLog.warn(err)
    return
  }
  status.devices.push(keyInfo)
  // handleConnection(io, socket)
  sendStatus(status)

  // console.log('connection', keyInfo.deviceName)
  accessLog.info('connection', keyInfo.deviceName)
  // console.log(socket.handshake.query)
  for (const module of Object.values(modules)) {
    module.registerListHandler(wss as LX.SocketServer, socket)
  }

  socket.isReady = true
}

const handleUnconnection = () => {
  // console.log('unconnection')
  // console.log(socket.handshake.query)
  for (const module of Object.values(modules)) {
    module.unregisterListHandler()
  }
}

const authConnection = (req: http.IncomingMessage, callback: (err: string | null | undefined, success: boolean) => void) => {
  // console.log(req.headers)
  // // console.log(req.auth)
  // console.log(req._query.authCode)
  authConnect(req).then(() => {
    callback(null, true)
  }).catch(err => {
    callback(err, false)
  })
}

let wss: LX.SocketServer | null

function noop() {}
function onSocketError(err: Error) {
  console.error(err)
}

const handleStartServer = async(port = 9527, ip = '127.0.0.1') => await new Promise((resolve, reject) => {
  const httpServer = http.createServer((req, res) => {
    // console.log(req.url)
    const endUrl = `/${req.url?.split('/').at(-1) ?? ''}`
    let code
    let msg
    switch (endUrl) {
      case '/hello':
        code = 200
        msg = SYNC_CODE.helloMsg
        break
      case '/id':
        code = 200
        msg = SYNC_CODE.idPrefix + getServerId()
        break
      case '/ah':
        void authCode(req, res, global.lx.config.connectPasword)
        break
      default:
        code = 401
        msg = 'Forbidden'
        break
    }
    if (!code) return
    res.writeHead(code)
    res.end(msg)
  })

  wss = new WebSocketServer({
    noServer: true,
  })

  wss.on('connection', function(socket, request) {
    socket.isReady = false
    socket.on('pong', () => {
      socket.isAlive = true
    })

    // const events = new Map<keyof ActionsType, Array<(err: Error | null, data: LX.Sync.ActionSyncType[keyof LX.Sync.ActionSyncType]) => void>>()
    // const events = new Map<keyof LX.Sync.ActionSyncType, Array<(err: Error | null, data: LX.Sync.ActionSyncType[keyof LX.Sync.ActionSyncType]) => void>>()
    let events: Partial<{ [K in keyof LX.Sync.ActionSyncType]: Array<(data: LX.Sync.ActionSyncType[K]) => void> }> = {}
    let closeEvents: Array<(err: Error) => (void | Promise<void>)> = []
    socket.addEventListener('message', ({ data }) => {
      if (typeof data === 'string') {
        let syncData: LX.Sync.ActionSync
        try {
          syncData = JSON.parse(decryptMsg(socket.keyInfo, data))
        } catch (err) {
          syncLog.error('parse message error:', err)
          socket.close(SYNC_CLOSE_CODE.failed)
          return
        }
        const handlers = events[syncData.action]
        if (handlers) {
          // @ts-expect-error
          for (const handler of handlers) handler(syncData.data)
        }
      }
    })
    socket.addEventListener('close', () => {
      accessLog.info('deconnection', socket.keyInfo.deviceName)
      const err = new Error('closed')
      for (const handler of closeEvents) void handler(err)
      events = {}
      closeEvents = []
      if (!status.devices.length) handleUnconnection()
    })
    socket.onRemoteEvent = function(eventName, handler) {
      let eventArr = events[eventName]
      if (!eventArr) events[eventName] = eventArr = []
      // let eventArr = events.get(eventName)
      // if (!eventArr) events.set(eventName, eventArr = [])
      eventArr.push(handler)

      return () => {
        eventArr!.splice(eventArr!.indexOf(handler), 1)
      }
    }
    socket.onClose = function(handler: typeof closeEvents[number]) {
      closeEvents.push(handler)
      return () => {
        closeEvents.splice(closeEvents.indexOf(handler), 1)
      }
    }
    socket.sendData = function(eventName, data, callback) {
      socket.send(encryptMsg(socket.keyInfo, JSON.stringify({ action: eventName, data })), callback)
    }

    void handleConnection(socket, request)
  })

  httpServer.on('upgrade', function upgrade(request, socket, head) {
    socket.addListener('error', onSocketError)
    // This function is not defined on purpose. Implement it with your own logic.
    authConnection(request, err => {
      if (err) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
        socket.destroy()
        return
      }
      socket.removeListener('error', onSocketError)

      wss?.handleUpgrade(request, socket, head, function done(ws) {
        wss?.emit('connection', ws, request)
      })
    })
  })

  const interval = setInterval(() => {
    wss?.clients.forEach(ws => {
      if (ws.isAlive == false) {
        ws.terminate()
        return
      }

      ws.isAlive = false
      ws.ping(noop)
      if (ws.keyInfo.isMobile) ws.send('ping', noop)
    })
  }, 30000)

  wss.on('close', function close() {
    clearInterval(interval)
  })

  httpServer.on('error', error => {
    console.log(error)
    reject(error)
  })

  httpServer.on('listening', () => {
    const addr = httpServer.address()
    // console.log(addr)
    if (!addr) {
      reject(new Error('address is null'))
      return
    }
    const bind = typeof addr == 'string' ? `pipe ${addr}` : `port ${addr.port}`
    startupLog.info(`Listening on ${ip} ${bind}`)
    resolve(null)
  })

  httpServer.listen(port, ip)
})

// const handleStopServer = async() => {
//   if (!wss) return
//   wss.close()
//   wss = null
// }

// export const stopServer = async() => {
//   codeTools.stop()
//   if (!status.status) {
//     status.status = false
//     status.message = ''
//     status.address = []
//     status.code = ''
//     sendStatus(status)
//     return
//   }
//   console.log('stoping sync server...')
//   await handleStopServer().then(() => {
//     console.log('sync server stoped')
//     status.status = false
//     status.message = ''
//     status.address = []
//     status.code = ''
//   }).catch(err => {
//     console.log(err)
//     status.message = err.message
//   }).finally(() => {
//     sendStatus(status)
//   })
// }

export const startServer = async(port: number, ip: string) => {
  // if (status.status) await handleStopServer()

  startupLog.info(`starting sync server in ${process.env.NODE_ENV == 'production' ? 'production' : 'development'}`)
  await handleStartServer(port, ip).then(() => {
    // console.log('sync server started')
    status.status = true
    status.message = ''
    status.address = ip == '0.0.0.0' ? getAddress() : [ip]

    // void generateCode()
    // codeTools.start()
  }).catch(err => {
    console.log(err)
    status.status = false
    status.message = err.message
    status.address = []
    // status.code = ''
  })
  // .finally(() => {
  //   sendStatus(status)
  // })
}

export const getStatus = (): LX.Sync.Status => status

// export const generateCode = async() => {
//   status.code = handleGenerateCode()
//   sendStatus(status)
//   return status.code
// }
