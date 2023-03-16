import type WS from 'ws'

declare global {
  namespace LX {
    interface Socket extends WS.WebSocket {
      isAlive?: boolean
      isReady: boolean
      keyInfo: LX.Sync.KeyInfo
      userInfo: LX.UserConfig
      onRemoteEvent: <T extends keyof LX.Sync.ActionSyncType>(
        eventName: T,
        handler: (data: LX.Sync.ActionSyncType[T]) => void
      ) => () => void
      onClose: (handler: (err: Error) => (void | Promise<void>)) => () => void
      sendData: <T extends keyof LX.Sync.ActionSyncSendType>(
        eventName: T,
        data?: LX.Sync.ActionSyncSendType[T],
        callback?: (err?: Error) => void
      ) => void
    }
    type SocketServer = WS.Server<Socket>
  }
}

