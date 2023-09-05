import { sync as listSync } from './list'
import { sync as dislikeSync } from './dislike'

export const callObj = Object.assign({},
  listSync.handler,
  dislikeSync.handler,
)

export const modules = {
  list: listSync,
  dislike: dislikeSync,
}


export { ListManage, ListEvent, type ListEventType } from './list'

export { DislikeManage, DislikeEvent, type DislikeEventType } from './dislike'

export const featureVersion = {
  list: 1,
  dislike: 1,
} as const
