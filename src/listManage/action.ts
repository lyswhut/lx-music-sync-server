import {
  getSnapshotInfo,
  saveSnapshot,
  getSnapshot,
  saveSnapshotInfo,
} from '@/utils/data'
import {arrPush, arrPushByPosition, arrUnshift} from '@/utils/common'
import {LIST_IDS} from '@/constants'
import {toMD5} from '@/utils'
import {allMusicList} from "@/listManage/state";

// export const snapshotInfo = getSnapshotInfo()
export const userLists: LX.List.UserListInfo[] = []
export const allMusicLists = new Map<string, Map<string, LX.Music.MusicInfo[]>>()

for (const userName of Object.keys(global.lx.configs)) {
  const allMusicList = new Map<string, LX.Music.MusicInfo[]>()
  {
    let listData
    const snapshotInfo = getSnapshotInfo(userName)
    if (snapshotInfo.latest) listData = getSnapshot(userName, snapshotInfo.latest)
    if (!listData) listData = {defaultList: [], loveList: [], userList: []}
    allMusicList.set(LIST_IDS.DEFAULT, listData.defaultList)
    allMusicList.set(LIST_IDS.LOVE, listData.loveList)
    userLists.push(...listData.userList.map(({list, ...l}) => {
      allMusicList.set(l.id, list)
      return l
    }))
  }
  allMusicLists.set(userName, allMusicList)
}


export const createSnapshot = (userName: string) => {
  const listData = JSON.stringify(getListData(userName))
  const md5 = toMD5(listData)
  const snapshotInfo = getSnapshotInfo(userName)
  if (snapshotInfo.latest == md5) return md5
  if (snapshotInfo.list.includes(md5)) {
    snapshotInfo.list.splice(snapshotInfo.list.indexOf(md5), 1)
  } else saveSnapshot(userName, md5, listData)
  if (snapshotInfo.latest) snapshotInfo.list.unshift(snapshotInfo.latest)
  snapshotInfo.latest = md5
  snapshotInfo.time = Date.now()
  saveSnapshotInfo(userName, snapshotInfo)
  return md5
}
export const getCurrentListInfoKey = (userName: string) => {
  const snapshotInfo = getSnapshotInfo(userName)
  if (snapshotInfo.latest) {
    return snapshotInfo.latest
  }
  snapshotInfo.latest = toMD5(JSON.stringify(getListData(userName)))
  saveSnapshotInfo(userName, snapshotInfo)
  return snapshotInfo.latest
}

export const getListData = (userName: string): LX.Sync.ListData => {
  const allMusicList = allMusicLists.get(userName)
  if (allMusicList)
    return {
      defaultList: allMusicList.get(LIST_IDS.DEFAULT) ?? [],
      loveList: allMusicList.get(LIST_IDS.LOVE) ?? [],
      userList: userLists.map(l => ({...l, list: allMusicList.get(l.id) ?? []})),
    }
  else {
    return {
      defaultList: [],
      loveList: [],
      userList: []
    }
  }
}


export const setUserLists = (lists: LX.List.UserListInfo[]) => {
  userLists.splice(0, userLists.length, ...lists)
  return userLists
}

export const setMusicList = (listId: string, musicList: LX.Music.MusicInfo[]): LX.Music.MusicInfo[] => {
  allMusicList.set(listId, musicList)
  return musicList
}
const removeMusicList = (id: string) => {
  allMusicList.delete(id)
}

const createUserList = ({
                          name,
                          id,
                          source,
                          sourceListId,
                          locationUpdateTime,
                        }: LX.List.UserListInfo, position: number) => {
  if (position < 0 || position >= userLists.length) {
    userLists.push({
      name,
      id,
      source,
      sourceListId,
      locationUpdateTime,
    })
  } else {
    userLists.splice(position, 0, {
      name,
      id,
      source,
      sourceListId,
      locationUpdateTime,
    })
  }
}

const updateList = ({
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
      targetList = userLists.find(l => l.id == id)
      if (!targetList) return
      targetList.name = name
      targetList.source = source
      targetList.sourceListId = sourceListId
      targetList.locationUpdateTime = locationUpdateTime
      break
  }
}

const removeUserList = (id: string) => {
  const index = userLists.findIndex(l => l.id == id)
  if (index < 0) return
  userLists.splice(index, 1)
  // removeMusicList(id)
}

const overwriteUserList = (lists: LX.List.UserListInfo[]) => {
  userLists.splice(0, userLists.length, ...lists)
}


// const sendMyListUpdateEvent = (ids: string[]) => {
//   window.app_event.myListUpdate(ids)
// }


export const listDataOverwrite = ({
                                    defaultList,
                                    loveList,
                                    userList,
                                    tempList
                                  }: MakeOptional<LX.List.ListDataFull, 'tempList'>): string[] => {
  const updatedListIds: string[] = []
  const newUserIds: string[] = []
  const newUserListInfos = userList.map(({list, ...listInfo}) => {
    if (allMusicList.has(listInfo.id)) updatedListIds.push(listInfo.id)
    newUserIds.push(listInfo.id)
    setMusicList(listInfo.id, list)
    return listInfo
  })
  for (const list of userLists) {
    if (!allMusicList.has(list.id) || newUserIds.includes(list.id)) continue
    removeMusicList(list.id)
    updatedListIds.push(list.id)
  }
  overwriteUserList(newUserListInfos)

  if (allMusicList.has(LIST_IDS.DEFAULT)) updatedListIds.push(LIST_IDS.DEFAULT)
  setMusicList(LIST_IDS.DEFAULT, defaultList)
  setMusicList(LIST_IDS.LOVE, loveList)
  updatedListIds.push(LIST_IDS.LOVE)

  if (tempList && allMusicList.has(LIST_IDS.TEMP)) {
    setMusicList(LIST_IDS.TEMP, tempList)
    updatedListIds.push(LIST_IDS.TEMP)
  }
  const newIds = [LIST_IDS.DEFAULT, LIST_IDS.LOVE, ...userList.map(l => l.id)]
  if (tempList) newIds.push(LIST_IDS.TEMP)
  // void overwriteListPosition(newIds)
  // void overwriteListUpdateInfo(newIds)
  return updatedListIds
}

export const userListCreate = ({name, id, source, sourceListId, position, locationUpdateTime}: {
  name: string
  id: string
  source?: LX.OnlineSource
  sourceListId?: string
  position: number
  locationUpdateTime: number | null
}) => {
  if (userLists.some(item => item.id == id)) return
  const newList: LX.List.UserListInfo = {
    name,
    id,
    source,
    sourceListId,
    locationUpdateTime,
  }
  createUserList(newList, position)
}

export const userListsRemove = (ids: string[]) => {
  const changedIds = []
  for (const id of ids) {
    removeUserList(id)
    // removeListPosition(id)
    // removeListUpdateInfo(id)
    if (!allMusicList.has(id)) continue
    removeMusicList(id)
    changedIds.push(id)
  }

  return changedIds
}

export const userListsUpdate = (listInfos: LX.List.UserListInfo[]) => {
  for (const info of listInfos) {
    updateList(info)
  }
}

export const userListsUpdatePosition = (position: number, ids: string[]) => {
  const newUserLists = [...userLists]

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

  setUserLists(newUserLists)
}


/**
 * 获取列表内的歌曲
 * @param listId
 */
export const getListMusics = async (listId: string): Promise<LX.Music.MusicInfo[]> => {
  if (!listId || !allMusicList.has(listId)) return []
  return allMusicList.get(listId) as LX.Music.MusicInfo[]
}

export const listMusicOverwrite = async (listId: string, musicInfos: LX.Music.MusicInfo[]): Promise<string[]> => {
  setMusicList(listId, musicInfos)
  return [listId]
}

export const listMusicAdd = async (id: string, musicInfos: LX.Music.MusicInfo[], addMusicLocationType: LX.AddMusicLocationType): Promise<string[]> => {
  const targetList = await getListMusics(id)

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

  setMusicList(id, targetList)

  return [id]
}

export const listMusicRemove = async (listId: string, ids: string[]): Promise<string[]> => {
  let targetList = await getListMusics(listId)

  const listSet = new Set<string>()
  for (const item of targetList) listSet.add(item.id)
  for (const id of ids) listSet.delete(id)
  const newList = targetList.filter(mInfo => listSet.has(mInfo.id))
  targetList.splice(0, targetList.length)
  arrPush(targetList, newList)

  return [listId]
}

export const listMusicMove = async (fromId: string, toId: string, musicInfos: LX.Music.MusicInfo[], addMusicLocationType: LX.AddMusicLocationType): Promise<string[]> => {
  return [
    ...await listMusicRemove(fromId, musicInfos.map(musicInfo => musicInfo.id)),
    ...await listMusicAdd(toId, musicInfos, addMusicLocationType),
  ]
}

export const listMusicUpdateInfo = async (musicInfos: LX.List.ListActionMusicUpdate): Promise<string[]> => {
  const updateListIds = new Set<string>()
  for (const {id, musicInfo} of musicInfos) {
    const targetList = await getListMusics(id)
    if (!targetList.length) continue
    const index = targetList.findIndex(l => l.id == musicInfo.id)
    if (index < 0) continue
    const info: LX.Music.MusicInfo = {...targetList[index]}
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


export const listMusicUpdatePosition = async (listId: string, position: number, ids: string[]): Promise<string[]> => {
  let targetList = await getListMusics(listId)

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


export const listMusicClear = async (ids: string[]): Promise<string[]> => {
  const changedIds: string[] = []
  for (const id of ids) {
    const list = await getListMusics(id)
    if (!list.length) continue
    setMusicList(id, [])
    changedIds.push(id)
  }
  return changedIds
}
