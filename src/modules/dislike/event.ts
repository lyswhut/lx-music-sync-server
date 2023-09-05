import { getUserSpace } from '@/user'
import { EventEmitter } from 'events'
// import {
//   userDislikeCreate,
//   userDislikesUpdate,
//   userDislikesRemove,
//   userDislikesUpdatePosition,
//   dislikeDataOverwrite,
//   dislikeMusicOverwrite,
//   dislikeMusicAdd,
//   dislikeMusicMove,
//   dislikeMusicRemove,
//   dislikeMusicUpdateInfo,
//   dislikeMusicUpdatePosition,
//   dislikeMusicClear,
// } from '@/dislikeManage/action'


const dislikeUpdated = () => {
  // return createSnapshot()
}
export const checkUpdateDislike = async(changedIds: string[]) => {
  // if (!changedIds.length) return
  // await saveDislikeMusics(changedIds.map(id => ({ id, musics: allMusicDislike.get(id) as LX.Dislike.DislikeMusics })))
  // global.app_event.myDislikeMusicUpdate(changedIds)
}


export class DislikeEvent extends EventEmitter {
  dislike_changed() {
    this.emit('dislike_changed')
  }

  /**
   * 覆盖整个列表数据
   * @param dislikeData 列表数据
   * @param isRemote 是否属于远程操作
   */
  async dislike_data_overwrite(userName: string, dislikeData: LX.Dislike.DislikeRules, isRemote: boolean = false) {
    const userSpace = getUserSpace(userName)
    await userSpace.dislikeManage.dislikeDataManage.overwirteDislikeInfo(dislikeData)
    this.emit('dislike_data_overwrite', userName, dislikeData, isRemote)
    dislikeUpdated()
  }

  /**
   * 批量添加歌曲到列表
   * @param dislikeId 列表id
   * @param musicInfos 添加的歌曲信息
   * @param addMusicLocationType 添加在到列表的位置
   * @param isRemote 是否属于远程操作
   */
  async dislike_music_add(userName: string, musicInfo: LX.Dislike.DislikeMusicInfo[], isRemote: boolean = false) {
    const userSpace = getUserSpace(userName)
    // const changedIds =
    await userSpace.dislikeManage.dislikeDataManage.addDislikeInfo(musicInfo)
    // await checkUpdateDislike(changedIds)
    this.emit('dislike_music_add', userName, musicInfo, isRemote)
    dislikeUpdated()
  }

  /**
   * 清空列表内的歌曲
   * @param ids 列表Id
   * @param isRemote 是否属于远程操作
   */
  async dislike_music_clear(userName: string, isRemote: boolean = false) {
    const userSpace = getUserSpace(userName)
    // const changedIds =
    await userSpace.dislikeManage.dislikeDataManage.overwirteDislikeInfo('')
    // await checkUpdateDislike(changedIds)
    this.emit('dislike_music_clear', userName, isRemote)
    dislikeUpdated()
  }
}


type EventMethods = Omit<EventType, keyof EventEmitter>
declare class EventType extends DislikeEvent {
  on<K extends keyof EventMethods>(event: K, dislikeener: EventMethods[K]): this
  once<K extends keyof EventMethods>(event: K, dislikeener: EventMethods[K]): this
  off<K extends keyof EventMethods>(event: K, dislikeener: EventMethods[K]): this
}
export type DislikeEventType = Omit<EventType, keyof Omit<EventEmitter, 'on' | 'off' | 'once'>>
