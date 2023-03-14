// import { throttle } from '@common/utils/common'
// import { sendSyncActionList } from '@main/modules/winMain'
import { SYNC_CLOSE_CODE } from '@/constants'
import { createSnapshot } from '@/listManage/action'
import { updateDeviceSnapshotKey } from '@/utils/data'
import { encryptMsg } from '@/utils/tools'

let wss: LX.SocketServer | null
let removeListener: (() => void) | null

// type listAction = 'list:action'

const handleListAction = async(userName: string, { action, data }: LX.Sync.ActionList) => {
  console.log('handleListAction', action)
  switch (action) {
    case 'list_data_overwrite':
      await global.event_list.list_data_overwrite(data, true)
      break
    case 'list_create':
      await global.event_list.list_create(data.position, data.listInfos, true)
      break
    case 'list_remove':
      await global.event_list.list_remove(data, true)
      break
    case 'list_update':
      await global.event_list.list_update(data, true)
      break
    case 'list_update_position':
      await global.event_list.list_update_position(data.position, data.ids, true)
      break
    case 'list_music_add':
      await global.event_list.list_music_add(data.id, data.musicInfos, data.addMusicLocationType, true)
      break
    case 'list_music_move':
      await global.event_list.list_music_move(data.fromId, data.toId, data.musicInfos, data.addMusicLocationType, true)
      break
    case 'list_music_remove':
      await global.event_list.list_music_remove(data.listId, data.ids, true)
      break
    case 'list_music_update':
      await global.event_list.list_music_update(data, true)
      break
    case 'list_music_update_position':
      await global.event_list.list_music_update_position(data.listId, data.position, data.ids, true)
      break
    case 'list_music_overwrite':
      await global.event_list.list_music_overwrite(data.listId, data.musicInfos, true)
      break
    case 'list_music_clear':
      await global.event_list.list_music_clear(data, true)
      break
    default:
      return null
  }
  let key = createSnapshot(userName)
  return key
}

// const registerListActionEvent = () => {
//   const list_data_overwrite = async(listData: MakeOptional<LX.List.ListDataFull, 'tempList'>, isRemote: boolean = false) => {
//     if (isRemote) return
//     await sendListAction({ action: 'list_data_overwrite', data: listData })
//   }
//   const list_create = async(position: number, listInfos: LX.List.UserListInfo[], isRemote: boolean = false) => {
//     if (isRemote) return
//     await sendListAction({ action: 'list_create', data: { position, listInfos } })
//   }
//   const list_remove = async(ids: string[], isRemote: boolean = false) => {
//     if (isRemote) return
//     await sendListAction({ action: 'list_remove', data: ids })
//   }
//   const list_update = async(lists: LX.List.UserListInfo[], isRemote: boolean = false) => {
//     if (isRemote) return
//     await sendListAction({ action: 'list_update', data: lists })
//   }
//   const list_update_position = async(position: number, ids: string[], isRemote: boolean = false) => {
//     if (isRemote) return
//     await sendListAction({ action: 'list_update_position', data: { position, ids } })
//   }
//   const list_music_overwrite = async(listId: string, musicInfos: LX.Music.MusicInfo[], isRemote: boolean = false) => {
//     if (isRemote) return
//     await sendListAction({ action: 'list_music_overwrite', data: { listId, musicInfos } })
//   }
//   const list_music_add = async(id: string, musicInfos: LX.Music.MusicInfo[], addMusicLocationType: LX.AddMusicLocationType, isRemote: boolean = false) => {
//     if (isRemote) return
//     await sendListAction({ action: 'list_music_add', data: { id, musicInfos, addMusicLocationType } })
//   }
//   const list_music_move = async(fromId: string, toId: string, musicInfos: LX.Music.MusicInfo[], addMusicLocationType: LX.AddMusicLocationType, isRemote: boolean = false) => {
//     if (isRemote) return
//     await sendListAction({ action: 'list_music_move', data: { fromId, toId, musicInfos, addMusicLocationType } })
//   }
//   const list_music_remove = async(listId: string, ids: string[], isRemote: boolean = false) => {
//     if (isRemote) return
//     await sendListAction({ action: 'list_music_remove', data: { listId, ids } })
//   }
//   const list_music_update = async(musicInfos: LX.List.ListActionMusicUpdate, isRemote: boolean = false) => {
//     if (isRemote) return
//     await sendListAction({ action: 'list_music_update', data: musicInfos })
//   }
//   const list_music_clear = async(ids: string[], isRemote: boolean = false) => {
//     if (isRemote) return
//     await sendListAction({ action: 'list_music_clear', data: ids })
//   }
//   const list_music_update_position = async(listId: string, position: number, ids: string[], isRemote: boolean = false) => {
//     if (isRemote) return
//     await sendListAction({ action: 'list_music_update_position', data: { listId, position, ids } })
//   }
//   global.event_list.on('list_data_overwrite', list_data_overwrite)
//   global.event_list.on('list_create', list_create)
//   global.event_list.on('list_remove', list_remove)
//   global.event_list.on('list_update', list_update)
//   global.event_list.on('list_update_position', list_update_position)
//   global.event_list.on('list_music_overwrite', list_music_overwrite)
//   global.event_list.on('list_music_add', list_music_add)
//   global.event_list.on('list_music_move', list_music_move)
//   global.event_list.on('list_music_remove', list_music_remove)
//   global.event_list.on('list_music_update', list_music_update)
//   global.event_list.on('list_music_clear', list_music_clear)
//   global.event_list.on('list_music_update_position', list_music_update_position)
//   return () => {
//     global.event_list.off('list_data_overwrite', list_data_overwrite)
//     global.event_list.off('list_create', list_create)
//     global.event_list.off('list_remove', list_remove)
//     global.event_list.off('list_update', list_update)
//     global.event_list.off('list_update_position', list_update_position)
//     global.event_list.off('list_music_overwrite', list_music_overwrite)
//     global.event_list.off('list_music_add', list_music_add)
//     global.event_list.off('list_music_move', list_music_move)
//     global.event_list.off('list_music_remove', list_music_remove)
//     global.event_list.off('list_music_update', list_music_update)
//     global.event_list.off('list_music_clear', list_music_clear)
//     global.event_list.off('list_music_update_position', list_music_update_position)
//   }
// }

// const addMusic = (orderId, callback) => {
//   // ...
// }

const broadcast = async(userName: string, key: string, data: any, excludeIds: string[] = []) => {
  if (!wss) return
  const dataStr = JSON.stringify({ action: 'list:sync:action', data })
  for (const socket of wss.clients) {
    if (excludeIds.includes(socket.keyInfo.clientId) || !socket.isReady) continue
    socket.send(encryptMsg(socket.keyInfo, dataStr), (err) => {
      if (err) {
        socket.close(SYNC_CLOSE_CODE.failed)
        return
      }
      updateDeviceSnapshotKey(userName,socket.keyInfo, key)
    })
  }
}

// export const sendListAction = async(action: LX.Sync.ActionList) => {
//   console.log('sendListAction', action.action)
//   // io.sockets
//   await broadcast('list:sync:action', action)
// }

export const registerListHandler = (userName: string, _wss: LX.SocketServer, socket: LX.Socket) => {
  if (!wss) {
    wss = _wss
    // removeListener = registerListActionEvent()
  }

  socket.onRemoteEvent('list:sync:action', (action) => {
    if (!socket.isReady) return
    // console.log(msg)
    void handleListAction(userName,action).then(key => {
      if (!key) return
      updateDeviceSnapshotKey(userName,socket.keyInfo, key)
      void broadcast(userName,key, action, [socket.keyInfo.clientId])
    })
    // socket.broadcast.emit('list:action', { action: 'list_remove', data: { id: 'default', index: 0 } })
  })

  // socket.on('list:add', addMusic)
}
export const unregisterListHandler = () => {
  wss = null

  if (removeListener) {
    removeListener()
    removeListener = null
  }
}
