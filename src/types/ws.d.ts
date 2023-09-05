import type WS from 'ws'

declare global {
  namespace LX {
    interface Socket extends WS.WebSocket {
      isAlive?: boolean
      isReady: boolean
      keyInfo: LX.Sync.KeyInfo
      userInfo: LX.UserConfig
      feature: LX.Sync.EnabledFeatures
      moduleReadys: {
        list: boolean
        dislike: boolean
      }

      onClose: (handler: (err: Error) => (void | Promise<void>)) => () => void
      broadcast: (handler: (client: LX.Socket) => void) => void

      remote: LX.Sync.ClientSyncActions
      remoteQueueList: LX.Sync.ClientSyncListActions
      remoteQueueDislike: LX.Sync.ClientSyncDislikeActions
    }
    type SocketServer = WS.Server<Socket>
  }
}

