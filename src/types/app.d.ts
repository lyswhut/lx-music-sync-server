/* eslint-disable no-var */
import { type ListEventType, type DislikeEventType } from '@/event'

declare global {
  interface Lx {
    logPath: string
    dataPath: string
    userPath: string
    config: LX.Config
  }

  // var envParams: LX.EnvParams
  var lx: Lx
  var event_list: ListEventType
  var event_dislike: DislikeEventType

}

export {}
