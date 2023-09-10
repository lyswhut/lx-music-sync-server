
// 构建列表信息对象，用于统一字段位置顺序
export const buildUserListInfoFull = ({ id, name, source, sourceListId, list, locationUpdateTime }: LX.List.UserListInfoFull) => {
  return {
    id,
    name,
    source,
    sourceListId,
    locationUpdateTime,
    list,
  }
}
