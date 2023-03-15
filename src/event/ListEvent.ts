import {EventEmitter} from 'events'
import {
  userListCreate,
  userListsUpdate,
  userListsRemove,
  userListsUpdatePosition,
  listDataOverwrite,
  listMusicOverwrite,
  listMusicAdd,
  listMusicMove,
  listMusicRemove,
  listMusicUpdateInfo,
  listMusicUpdatePosition,
  listMusicClear,
} from '@/listManage/action'


const listUpdated = () => {
  // return createSnapshot()
}
export const checkUpdateList = async (changedIds: string[]) => {
  // if (!changedIds.length) return
  // await saveListMusics(changedIds.map(id => ({ id, musics: allMusicList.get(id) as LX.List.ListMusics })))
  // global.app_event.myListMusicUpdate(changedIds)
}


export class Event extends EventEmitter {
  list_changed() {
    this.emit('list_changed')
  }

  /**
   * 覆盖整个列表数据
   * @param userName
   * @param listData 列表数据
   * @param isRemote 是否属于远程操作
   */
  async list_data_overwrite(userName: string, listData: MakeOptional<LX.List.ListDataFull, 'tempList'>, isRemote: boolean = false) {
    // const oldIds = userLists.map(l => l.id)
    // const changedIds =
    listDataOverwrite(userName, listData)
    // await updateUserList(userLists)
    // await checkUpdateList(changedIds)
    // const removedList = oldIds.filter(id => !allMusicList.has(id))
    // if (removedList.length) await removeListMusics(removedList)
    // const allListIds = [LIST_IDS.DEFAULT, LIST_IDS.LOVE, ...userLists.map(l => l.id)]
    // if (changedIds.includes(LIST_IDS.TEMP)) allListIds.push(LIST_IDS.TEMP)
    // await saveListMusics([...allListIds.map(id => ({ id, musics: allMusicList.get(id) as LX.List.ListMusics }))])
    // global.app_event.myListMusicUpdate(changedIds)
    this.emit('list_data_overwrite', listData, isRemote)
    listUpdated()
  }

  /**
   * 批量创建列表
   * @param userName
   * @param position 列表位置
   * @param lists 列表信息
   * @param isRemote 是否属于远程操作
   */
  async list_create(userName: string, position: number, lists: LX.List.UserListInfo[], isRemote: boolean = false) {
    // const changedIds: string[] = []
    for (const list of lists) {
      userListCreate(userName, {...list, position})
      // changedIds.push(list.id)
    }
    // await updateUserList(userLists)
    this.emit('list_create', position, lists, isRemote)
    listUpdated()
  }

  /**
   * 批量删除列表及列表内歌曲
   * @param userName
   * @param ids 列表ids
   * @param isRemote 是否属于远程操作
   */
  async list_remove(userName: string, ids: string[], isRemote: boolean = false) {
    // const changedIds =
    userListsRemove(userName, ids)
    // await updateUserList(userLists)
    // await removeListMusics(ids)
    this.emit('list_remove', ids, isRemote)
    listUpdated()
    // global.app_event.myListMusicUpdate(changedIds)
  }

  /**
   * 批量更新列表信息
   * @param userName
   * @param lists 列表信息
   * @param isRemote 是否属于远程操作
   */
  async list_update(userName: string, lists: LX.List.UserListInfo[], isRemote: boolean = false) {
    userListsUpdate(userName, lists)
    // await updateUserList(userLists)
    this.emit('list_update', lists, isRemote)
    listUpdated()
  }

  /**
   * 批量更新列表位置
   * @param userName
   * @param position 列表位置
   * @param ids 列表ids
   * @param isRemote 是否属于远程操作
   */
  async list_update_position(userName: string, position: number, ids: string[], isRemote: boolean = false) {
    userListsUpdatePosition(userName, position, ids)
    // await updateUserList(userLists)
    this.emit('list_update_position', position, ids, isRemote)
    listUpdated()
  }

  /**
   * 覆盖列表内歌曲
   * @param userName
   * @param listId 列表id
   * @param musicInfos 音乐信息
   * @param isRemote 是否属于远程操作
   */
  async list_music_overwrite(userName: string, listId: string, musicInfos: LX.Music.MusicInfo[], isRemote: boolean = false) {
    // const changedIds =
    await listMusicOverwrite(userName, listId, musicInfos)
    // await checkUpdateList(changedIds)
    this.emit('list_music_overwrite', listId, musicInfos, isRemote)
    listUpdated()
  }

  /**
   * 批量添加歌曲到列表
   * @param userName
   * @param listId 列表id
   * @param musicInfos 添加的歌曲信息
   * @param addMusicLocationType 添加在到列表的位置
   * @param isRemote 是否属于远程操作
   */
  async list_music_add(userName: string, listId: string, musicInfos: LX.Music.MusicInfo[], addMusicLocationType: LX.AddMusicLocationType, isRemote: boolean = false) {
    // const changedIds =
    await listMusicAdd(userName, listId, musicInfos, addMusicLocationType)
    // await checkUpdateList(changedIds)
    this.emit('list_music_add', listId, musicInfos, addMusicLocationType, isRemote)
    listUpdated()
  }

  /**
   * 批量移动歌曲
   * @param userName
   * @param fromId 源列表id
   * @param toId 目标列表id
   * @param musicInfos 移动的歌曲信息
   * @param addMusicLocationType 添加在到列表的位置
   * @param isRemote 是否属于远程操作
   */
  async list_music_move(userName: string, fromId: string, toId: string, musicInfos: LX.Music.MusicInfo[], addMusicLocationType: LX.AddMusicLocationType, isRemote: boolean = false) {
    // const changedIds =
    await listMusicMove(userName, fromId, toId, musicInfos, addMusicLocationType)
    // await checkUpdateList(changedIds)
    this.emit('list_music_move', fromId, toId, musicInfos, addMusicLocationType, isRemote)
    listUpdated()
  }

  /**
   * 批量移除歌曲
   * @param listId
   * @param userName
   * @param listId 列表Id
   * @param ids 要删除歌曲的id
   * @param isRemote 是否属于远程操作
   */
  async list_music_remove(userName: string, listId: string, ids: string[], isRemote: boolean = false) {
    // const changedIds =
    await listMusicRemove(userName, listId, ids)
    // console.log(changedIds)
    // await checkUpdateList(changedIds)
    this.emit('list_music_remove', listId, ids, isRemote)
    listUpdated()
  }

  /**
   * 批量更新歌曲信息
   * @param userName
   * @param musicInfos 歌曲&列表信息
   * @param isRemote 是否属于远程操作
   */
  async list_music_update(userName: string, musicInfos: LX.List.ListActionMusicUpdate, isRemote: boolean = false) {
    // const changedIds =
    await listMusicUpdateInfo(userName, musicInfos)
    // await checkUpdateList(changedIds)
    this.emit('list_music_update', musicInfos, isRemote)
    listUpdated()
  }

  /**
   * 清空列表内的歌曲
   * @param userName
   * @param ids 列表Id
   * @param isRemote 是否属于远程操作
   */
  async list_music_clear(userName: string, ids: string[], isRemote: boolean = false) {
    // const changedIds =
    await listMusicClear(userName, ids)
    // await checkUpdateList(changedIds)
    this.emit('list_music_clear', ids, isRemote)
    listUpdated()
  }

  /**
   * 批量更新歌曲位置
   * @param userName
   * @param listId 列表ID
   * @param position 新位置
   * @param ids 歌曲id
   * @param isRemote 是否属于远程操作
   */
  async list_music_update_position(userName: string, listId: string, position: number, ids: string[], isRemote: boolean = false) {
    // const changedIds =
    await listMusicUpdatePosition(userName, listId, position, ids)
    // await checkUpdateList(changedIds)
    this.emit('list_music_update_position', listId, position, ids, isRemote)
    listUpdated()
  }
}


type EventMethods = Omit<EventType, keyof EventEmitter>

declare class EventType extends Event {
  on<K extends keyof EventMethods>(event: K, listener: EventMethods[K]): this

  once<K extends keyof EventMethods>(event: K, listener: EventMethods[K]): this

  off<K extends keyof EventMethods>(event: K, listener: EventMethods[K]): this
}

export declare type Type = Omit<EventType, keyof Omit<EventEmitter, 'on' | 'off' | 'once'>>
