// import { Event as App, type Type as AppType } from './AppEvent'
import {
  ListEvent,
  type ListEventType,
} from '@/modules'

export type {
  // AppType,
  ListEventType,
}

// export const createAppEvent = (): AppType => {
//   return new App()
// }

export const createModuleEvent = () => {
  global.event_list = new ListEvent()
}

