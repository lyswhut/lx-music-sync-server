import {
  getSnapshotInfo,
  saveSnapshot,
  getSnapshot,
  saveSnapshotInfo,
} from '@/utils/data'
import {arrPush, arrPushByPosition, arrUnshift} from '@/utils/common'
import {LIST_IDS} from '@/constants'
import {toMD5} from '@/utils'

// export const snapshotInfo = getSnapshotInfo()
export const allMusicLists: Record<string, Map<string, LX.Music.MusicInfo[]>> = {}
export const userListss: Record<string, LX.List.UserListInfo[]> = {}

for (const userName of Object.keys(global.lx.users)) {
  const allMusicList = new Map<string, LX.Music.MusicInfo[]>()
  const userLists: LX.List.UserListInfo[] = []
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
  userListss[userName] = userLists
  allMusicLists[userName] = allMusicList
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
  const allMusicList = allMusicLists[userName]
  if (allMusicList)
    return {
      defaultList: allMusicList.get(LIST_IDS.DEFAULT) ?? [],
      loveList: allMusicList.get(LIST_IDS.LOVE) ?? [],
      userList: userListss[userName].map(l => ({...l, list: allMusicList.get(l.id) ?? []})),
    }
  return {defaultList: [], loveList: [], userList: []}
}

export const setUserLists = (userName: string, lists: LX.List.UserListInfo[]) => {
  const userLists = userListss[userName]
  userLists.splice(0, userLists.length, ...lists)
  return userLists
}

export const setMusicList = (userName: string, listId: string, musicList: LX.Music.MusicInfo[]): LX.Music.MusicInfo[] => {
  allMusicLists[userName].set(listId, musicList)
  return musicList
}
const removeMusicList = (userName: string, id: string) => {
  allMusicLists[userName].delete(id)
}

const createUserList = (userName: string, {
  name,
  id,
  source,
  sourceListId,
  locationUpdateTime,
}: LX.List.UserListInfo, position: number) => {
  const userLists = userListss[userName]
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

const updateList = (userName: string, {
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
      targetList = userListss[userName].find(l => l.id == id)
      if (!targetList) return
      targetList.name = name
      targetList.source = source
      targetList.sourceListId = sourceListId
      targetList.locationUpdateTime = locationUpdateTime
      break
  }
}

const removeUserList = (userName: string, id: string) => {
  const userLists = userListss[userName]
  const index = userLists.findIndex(l => l.id == id)
  if (index < 0) return
  userLists.splice(index, 1)
  // removeMusicList(id)
}

const overwriteUserList = (userName: string, lists: LX.List.UserListInfo[]) => {
  const userLists = userListss[userName]
  userLists.splice(0, userLists.length, ...lists)
}


// const sendMyListUpdateEvent = (ids: string[]) => {
//   window.app_event.myListUpdate(ids)
// }


export const listDataOverwrite = (userName: string, {
  defaultList,
  loveList,
  userList,
  tempList
}: MakeOptional<LX.List.ListDataFull, 'tempList'>): string[] => {
  const updatedListIds: string[] = []
  const newUserIds: string[] = []
  const allMusicList = allMusicLists[userName]
  const newUserListInfos = userList.map(({list, ...listInfo}) => {
    if (allMusicList.has(listInfo.id)) updatedListIds.push(listInfo.id)
    newUserIds.push(listInfo.id)
    setMusicList(userName, listInfo.id, list)
    return listInfo
  })
  for (const list of userListss[userName]) {
    if (!allMusicList.has(list.id) || newUserIds.includes(list.id)) continue
    removeMusicList(userName, list.id)
    updatedListIds.push(list.id)
  }
  overwriteUserList(userName, newUserListInfos)

  if (allMusicList.has(LIST_IDS.DEFAULT)) updatedListIds.push(LIST_IDS.DEFAULT)
  setMusicList(userName, LIST_IDS.DEFAULT, defaultList)
  setMusicList(userName, LIST_IDS.LOVE, loveList)
  updatedListIds.push(LIST_IDS.LOVE)

  if (tempList && allMusicList.has(LIST_IDS.TEMP)) {
    setMusicList(userName, LIST_IDS.TEMP, tempList)
    updatedListIds.push(LIST_IDS.TEMP)
  }
  const newIds = [LIST_IDS.DEFAULT, LIST_IDS.LOVE, ...userList.map(l => l.id)]
  if (tempList) newIds.push(LIST_IDS.TEMP)
  // void overwriteListPosition(newIds)
  // void overwriteListUpdateInfo(newIds)
  return updatedListIds
}

export const userListCreate = (userName: string, {name, id, source, sourceListId, position, locationUpdateTime}: {
  name: string
  id: string
  source?: LX.OnlineSource
  sourceListId?: string
  position: number
  locationUpdateTime: number | null
}) => {
  if (userListss[userName].some(item => item.id == id)) return
  const newList: LX.List.UserListInfo = {
    name,
    id,
    source,
    sourceListId,
    locationUpdateTime,
  }
  createUserList(userName, newList, position)
}

export const userListsRemove = (userName: string, ids: string[]) => {
  const changedIds = []
  for (const id of ids) {
    removeUserList(userName, id)
    // removeListPosition(id)
    // removeListUpdateInfo(id)
    if (!allMusicLists[userName].has(id)) continue
    removeMusicList(userName, id)
    changedIds.push(id)
  }

  return changedIds
}

export const userListsUpdate = (userName: string, listInfos: LX.List.UserListInfo[]) => {
  for (const info of listInfos) {
    updateList(userName, info)
  }
}

export const userListsUpdatePosition = (userName: string, position: number, ids: string[]) => {
  const newUserLists = [...userListss[userName]]

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

  setUserLists(userName, newUserLists)
}


/**
 * 获取列表内的歌曲
 * @param userName
 * @param listId
 */
export const getListMusics = async (userName: string, listId: string): Promise<LX.Music.MusicInfo[]> => {
  const allMusicList = allMusicLists[userName]
  if (!listId || !allMusicList.has(listId)) return []
  return allMusicList.get(listId) as LX.Music.MusicInfo[]
}

export const listMusicOverwrite = async (userName: string, listId: string, musicInfos: LX.Music.MusicInfo[]): Promise<string[]> => {
  setMusicList(userName, listId, musicInfos)
  return [listId]
}

export const listMusicAdd = async (userName: string, id: string, musicInfos: LX.Music.MusicInfo[], addMusicLocationType: LX.AddMusicLocationType): Promise<string[]> => {
  const targetList = await getListMusics(userName, id)

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

  setMusicList(userName, id, targetList)

  return [id]
}

export const listMusicRemove = async (userName: string, listId: string, ids: string[]): Promise<string[]> => {
  let targetList = await getListMusics(userName, listId)

  const listSet = new Set<string>()
  for (const item of targetList) listSet.add(item.id)
  for (const id of ids) listSet.delete(id)
  const newList = targetList.filter(mInfo => listSet.has(mInfo.id))
  targetList.splice(0, targetList.length)
  arrPush(targetList, newList)

  return [listId]
}

export const listMusicMove = async (userName: string, fromId: string, toId: string, musicInfos: LX.Music.MusicInfo[], addMusicLocationType: LX.AddMusicLocationType): Promise<string[]> => {
  return [
    ...await listMusicRemove(userName, fromId, musicInfos.map(musicInfo => musicInfo.id)),
    ...await listMusicAdd(userName, toId, musicInfos, addMusicLocationType),
  ]
}

export const listMusicUpdateInfo = async (userName: string, musicInfos: LX.List.ListActionMusicUpdate): Promise<string[]> => {
  const updateListIds = new Set<string>()
  for (const {id, musicInfo} of musicInfos) {
    const targetList = await getListMusics(userName, id)
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


export const listMusicUpdatePosition = async (userName: string, listId: string, position: number, ids: string[]): Promise<string[]> => {
  let targetList = await getListMusics(userName, listId)

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


export const listMusicClear = async (userName: string, ids: string[]): Promise<string[]> => {
  const changedIds: string[] = []
  for (const id of ids) {
    const list = await getListMusics(userName, id)
    if (!list.length) continue
    setMusicList(userName, id, [])
    changedIds.push(id)
  }
  return changedIds
}
