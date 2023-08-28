// import { updateDeviceSnapshotKey } from '@main/modules/sync/data'
// import { registerListActionEvent } from '../../../utils'
// import { getCurrentListInfoKey } from '../../utils'

// let socket: LX.Sync.Server.Socket | null
let unregisterLocalListAction: (() => void) | null


// const sendListAction = async(wss: LX.SocketServer, action: LX.Sync.List.ActionList) => {
//   // console.log('sendListAction', action.action)
//   const key = await getCurrentListInfoKey()
//   for (const client of wss.clients) {
//     if (!client.moduleReadys?.list) continue
//     void client.remoteQueueList.onListSyncAction(action).then(() => {
//       updateDeviceSnapshotKey(client.keyInfo, key)
//     })
//   }
// }

export const registerEvent = (wss: LX.SocketServer) => {
  // socket = _socket
  // socket.onClose(() => {
  //   unregisterLocalListAction?.()
  //   unregisterLocalListAction = null
  // })
  // unregisterEvent()
  // unregisterLocalListAction = registerListActionEvent((action) => {
  //   void sendListAction(wss, action)
  // })
}

export const unregisterEvent = () => {
  unregisterLocalListAction?.()
  unregisterLocalListAction = null
}
