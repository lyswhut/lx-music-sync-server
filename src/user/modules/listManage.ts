import { type UserDataManage } from '@/utils/data'
import { arrPush, arrPushByPosition, arrUnshift } from '@/utils/common'
import { LIST_IDS } from '@/constants'
import { toMD5 } from '@/utils'

export class ListManage {
  userDataManage: UserDataManage
  userLists: LX.List.UserListInfo[] = []
  allMusicList = new Map<string, LX.Music.MusicInfo[]>()

  constructor(dataManage: UserDataManage) {
    this.userDataManage = dataManage

    let listData
    const snapshotInfo = this.userDataManage.getSnapshotInfo()
    if (snapshotInfo.latest) listData = this.userDataManage.getSnapshot(snapshotInfo.latest)
    if (!listData) listData = { defaultList: [], loveList: [], userList: [] }
    this.allMusicList.set(LIST_IDS.DEFAULT, listData.defaultList)
    this.allMusicList.set(LIST_IDS.LOVE, listData.loveList)
    this.userLists.push(...listData.userList.map(({ list, ...l }) => {
      this.allMusicList.set(l.id, list)
      return l
    }))
  }

  createSnapshot = () => {
    const listData = JSON.stringify(this.getListData())
    const md5 = toMD5(listData)
    const snapshotInfo = this.userDataManage.getSnapshotInfo()
    console.log(md5, snapshotInfo.latest)
    if (snapshotInfo.latest == md5) return md5
    if (snapshotInfo.list.includes(md5)) {
      snapshotInfo.list.splice(snapshotInfo.list.indexOf(md5), 1)
    } else this.userDataManage.saveSnapshot(md5, listData)
    if (snapshotInfo.latest) snapshotInfo.list.unshift(snapshotInfo.latest)
    snapshotInfo.latest = md5
    snapshotInfo.time = Date.now()
    this.userDataManage.saveSnapshotInfo(snapshotInfo)
    return md5
  }

  getCurrentListInfoKey = () => {
    const snapshotInfo = this.userDataManage.getSnapshotInfo()
    if (snapshotInfo.latest) {
      return snapshotInfo.latest
    }
    snapshotInfo.latest = toMD5(JSON.stringify(this.getListData()))
    this.userDataManage.saveSnapshotInfo(snapshotInfo)
    return snapshotInfo.latest
  }

  getListData = (): LX.Sync.ListData => {
    return {
      defaultList: this.allMusicList.get(LIST_IDS.DEFAULT) ?? [],
      loveList: this.allMusicList.get(LIST_IDS.LOVE) ?? [],
      userList: this.userLists.map(l => ({ ...l, list: this.allMusicList.get(l.id) ?? [] })),
    }
  }


  setUserLists = (lists: LX.List.UserListInfo[]) => {
    this.userLists.splice(0, this.userLists.length, ...lists)
    return this.userLists
  }

  setMusicList = (listId: string, musicList: LX.Music.MusicInfo[]): LX.Music.MusicInfo[] => {
    this.allMusicList.set(listId, musicList)
    return musicList
  }

  private readonly removeMusicList = (id: string) => {
    this.allMusicList.delete(id)
  }

  private readonly createUserList = ({
    name,
    id,
    source,
    sourceListId,
    locationUpdateTime,
  }: LX.List.UserListInfo, position: number) => {
    if (position < 0 || position >= this.userLists.length) {
      this.userLists.push({
        name,
        id,
        source,
        sourceListId,
        locationUpdateTime,
      })
    } else {
      this.userLists.splice(position, 0, {
        name,
        id,
        source,
        sourceListId,
        locationUpdateTime,
      })
    }
  }

  private readonly updateList = ({
    name,
    id,
    source,
    sourceListId,
    // meta,
    locationUpdateTime,
  }: LX.List.UserListInfo & { meta?: { id?: string } }) => {
    let targetList
    switch (id) {
      case LIST_IDS.DEFAULT:
      case LIST_IDS.LOVE:
        break
      case LIST_IDS.TEMP:
      //   tempList.meta = meta ?? {}
        // break
      default:
        targetList = this.userLists.find(l => l.id == id)
        if (!targetList) return
        targetList.name = name
        targetList.source = source
        targetList.sourceListId = sourceListId
        targetList.locationUpdateTime = locationUpdateTime
        break
    }
  }

  private readonly removeUserList = (id: string) => {
    const index = this.userLists.findIndex(l => l.id == id)
    if (index < 0) return
    this.userLists.splice(index, 1)
    // removeMusicList(id)
  }

  private readonly overwriteUserList = (lists: LX.List.UserListInfo[]) => {
    this.userLists.splice(0, this.userLists.length, ...lists)
  }


  // const sendMyListUpdateEvent = (ids: string[]) => {
  //   window.app_event.myListUpdate(ids)
  // }


  listDataOverwrite = ({ defaultList, loveList, userList, tempList }: MakeOptional<LX.List.ListDataFull, 'tempList'>): string[] => {
    const updatedListIds: string[] = []
    const newUserIds: string[] = []
    const newUserListInfos = userList.map(({ list, ...listInfo }) => {
      if (this.allMusicList.has(listInfo.id)) updatedListIds.push(listInfo.id)
      newUserIds.push(listInfo.id)
      this.setMusicList(listInfo.id, list)
      return listInfo
    })
    for (const list of this.userLists) {
      if (!this.allMusicList.has(list.id) || newUserIds.includes(list.id)) continue
      this.removeMusicList(list.id)
      updatedListIds.push(list.id)
    }
    this.overwriteUserList(newUserListInfos)

    if (this.allMusicList.has(LIST_IDS.DEFAULT)) updatedListIds.push(LIST_IDS.DEFAULT)
    this.setMusicList(LIST_IDS.DEFAULT, defaultList)
    this.setMusicList(LIST_IDS.LOVE, loveList)
    updatedListIds.push(LIST_IDS.LOVE)

    if (tempList && this.allMusicList.has(LIST_IDS.TEMP)) {
      this.setMusicList(LIST_IDS.TEMP, tempList)
      updatedListIds.push(LIST_IDS.TEMP)
    }
    const newIds = [LIST_IDS.DEFAULT, LIST_IDS.LOVE, ...userList.map(l => l.id)]
    if (tempList) newIds.push(LIST_IDS.TEMP)
    // void overwriteListPosition(newIds)
    // void overwriteListUpdateInfo(newIds)
    return updatedListIds
  }

  userListCreate = ({ name, id, source, sourceListId, position, locationUpdateTime }: {
    name: string
    id: string
    source?: LX.OnlineSource
    sourceListId?: string
    position: number
    locationUpdateTime: number | null
  }) => {
    if (this.userLists.some(item => item.id == id)) return
    const newList: LX.List.UserListInfo = {
      name,
      id,
      source,
      sourceListId,
      locationUpdateTime,
    }
    this.createUserList(newList, position)
  }

  userListsRemove = (ids: string[]) => {
    const changedIds = []
    for (const id of ids) {
      this.removeUserList(id)
      // removeListPosition(id)
      // removeListUpdateInfo(id)
      if (!this.allMusicList.has(id)) continue
      this.removeMusicList(id)
      changedIds.push(id)
    }

    return changedIds
  }

  userListsUpdate = (listInfos: LX.List.UserListInfo[]) => {
    for (const info of listInfos) {
      this.updateList(info)
    }
  }

  userListsUpdatePosition = (position: number, ids: string[]) => {
    const newUserLists = [...this.userLists]

    // console.log(position, ids)

    const updateLists: LX.List.UserListInfo[] = []

    // const targetItem = list[position]
    const map = new Map<string, LX.List.UserListInfo>()
    for (const item of newUserLists) map.set(item.id, item)
    for (const id of ids) {
      const listInfo = map.get(id) as LX.List.UserListInfo
      listInfo.locationUpdateTime = Date.now()
      updateLists.push(listInfo)
      map.delete(id)
    }
    newUserLists.splice(0, newUserLists.length, ...newUserLists.filter(mInfo => map.has(mInfo.id)))
    newUserLists.splice(Math.min(position, newUserLists.length), 0, ...updateLists)

    this.setUserLists(newUserLists)
  }


  /**
   * 获取列表内的歌曲
   * @param listId
   */
  getListMusics = async(listId: string): Promise<LX.Music.MusicInfo[]> => {
    if (!listId || !this.allMusicList.has(listId)) return []
    return this.allMusicList.get(listId) as LX.Music.MusicInfo[]
  }

  listMusicOverwrite = async(listId: string, musicInfos: LX.Music.MusicInfo[]): Promise<string[]> => {
    this.setMusicList(listId, musicInfos)
    return [listId]
  }

  listMusicAdd = async(id: string, musicInfos: LX.Music.MusicInfo[], addMusicLocationType: LX.AddMusicLocationType): Promise<string[]> => {
    const targetList = await this.getListMusics(id)

    const listSet = new Set<string>()
    for (const item of targetList) listSet.add(item.id)
    musicInfos = musicInfos.filter(item => {
      if (listSet.has(item.id)) return false
      listSet.add(item.id)
      return true
    })
    switch (addMusicLocationType) {
      case 'top':
        arrUnshift(targetList, musicInfos)
        break
      case 'bottom':
      default:
        arrPush(targetList, musicInfos)
        break
    }

    this.setMusicList(id, targetList)

    return [id]
  }

  listMusicRemove = async(listId: string, ids: string[]): Promise<string[]> => {
    let targetList = await this.getListMusics(listId)

    const listSet = new Set<string>()
    for (const item of targetList) listSet.add(item.id)
    for (const id of ids) listSet.delete(id)
    const newList = targetList.filter(mInfo => listSet.has(mInfo.id))
    targetList.splice(0, targetList.length)
    arrPush(targetList, newList)

    return [listId]
  }

  listMusicMove = async(fromId: string, toId: string, musicInfos: LX.Music.MusicInfo[], addMusicLocationType: LX.AddMusicLocationType): Promise<string[]> => {
    return [
      ...await this.listMusicRemove(fromId, musicInfos.map(musicInfo => musicInfo.id)),
      ...await this.listMusicAdd(toId, musicInfos, addMusicLocationType),
    ]
  }

  listMusicUpdateInfo = async(musicInfos: LX.List.ListActionMusicUpdate): Promise<string[]> => {
    const updateListIds = new Set<string>()
    for (const { id, musicInfo } of musicInfos) {
      const targetList = await this.getListMusics(id)
      if (!targetList.length) continue
      const index = targetList.findIndex(l => l.id == musicInfo.id)
      if (index < 0) continue
      const info: LX.Music.MusicInfo = { ...targetList[index] }
      // console.log(musicInfo)
      Object.assign(info, {
        name: musicInfo.name,
        singer: musicInfo.singer,
        source: musicInfo.source,
        interval: musicInfo.interval,
        meta: musicInfo.meta,
      })
      targetList.splice(index, 1, info)
      updateListIds.add(id)
    }
    return Array.from(updateListIds)
  }


  listMusicUpdatePosition = async(listId: string, position: number, ids: string[]): Promise<string[]> => {
    let targetList = await this.getListMusics(listId)

    // const infos = Array(ids.length)
    // for (let i = targetList.length; i--;) {
    //   const item = targetList[i]
    //   const index = ids.indexOf(item.id)
    //   if (index < 0) continue
    //   infos.splice(index, 1, targetList.splice(i, 1)[0])
    // }
    // targetList.splice(Math.min(position, targetList.length - 1), 0, ...infos)

    // console.time('ts')

    // const list = createSortedList(targetList, position, ids)
    const infos: LX.Music.MusicInfo[] = []
    const map = new Map<string, LX.Music.MusicInfo>()
    for (const item of targetList) map.set(item.id, item)
    for (const id of ids) {
      infos.push(map.get(id) as LX.Music.MusicInfo)
      map.delete(id)
    }
    const list = targetList.filter(mInfo => map.has(mInfo.id))
    arrPushByPosition(list, infos, Math.min(position, list.length))

    targetList.splice(0, targetList.length)
    arrPush(targetList, list)

    // console.timeEnd('ts')
    return [listId]
  }


  listMusicClear = async(ids: string[]): Promise<string[]> => {
    const changedIds: string[] = []
    for (const id of ids) {
      const list = await this.getListMusics(id)
      if (!list.length) continue
      this.setMusicList(id, [])
      changedIds.push(id)
    }
    return changedIds
  }
}

