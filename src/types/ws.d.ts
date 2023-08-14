import type WS from 'ws'

declare global {
  namespace LX {
    interface Socket extends WS.WebSocket {
      isAlive?: boolean
      isReady: boolean
      keyInfo: LX.Sync.KeyInfo
      userInfo: LX.UserConfig

      onClose: (handler: (err: Error) => (void | Promise<void>)) => () => void

      broadcast: (handler: (client: LX.Socket) => void) => void

      remote: LX.Sync.ClientActions
      remoteSyncList: LX.Sync.ClientActions
    }
    type SocketServer = WS.Server<Socket>
  }
}

