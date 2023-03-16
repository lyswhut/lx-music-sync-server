import { UserDataManage } from '@/utils/data'
import { ListManage } from './modules/listManage'

export interface UserSpace {
  dataManage: UserDataManage
  listManage: ListManage
}
const users = new Map<string, UserSpace>()

export const getUserSpace = (userName: string) => {
  let user = users.get(userName)
  if (!user) {
    console.log('new user data manage:', userName)
    const dataManage = new UserDataManage(userName)
    users.set(userName, user = {
      dataManage,
      listManage: new ListManage(dataManage),
    })
  }
  return user
}

export const releaseUserSpace = (userName: string) => {
  users.delete(userName)
}
