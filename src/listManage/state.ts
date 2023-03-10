import { LIST_IDS } from '@/constants'

export const allMusicList = new Map<string, LX.Music.MusicInfo[]>()

export const defaultList: LX.List.MyDefaultListInfo = {
  id: LIST_IDS.DEFAULT,
  name: '试听列表',
}

export const loveList: LX.List.MyLoveListInfo = {
  id: LIST_IDS.LOVE,
  name: '我的收藏',
}
export const tempList: LX.List.MyTempListInfo = {
  id: LIST_IDS.TEMP,
  name: '临时列表',
  meta: {},
}

export const userLists: LX.List.UserListInfo[] = []
