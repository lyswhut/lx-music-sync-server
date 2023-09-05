// import { Event as App, type Type as AppType } from './AppEvent'
import {
  ListEvent,
  type ListEventType,
  DislikeEvent,
  type DislikeEventType,
} from '@/modules'

export type {
  // AppType,
  ListEventType,
  DislikeEventType,
}

// export const createAppEvent = (): AppType => {
//   return new App()
// }

export const createModuleEvent = () => {
  global.event_list = new ListEvent()
  global.event_dislike = new DislikeEvent()
}

