/* eslint-disable no-var */
import { type ListType } from '@/event'

declare global {
  interface Lx {
    logPath: string
    dataPath: string
    snapshotPath: string
    config: LX.Config
  }

  // var envParams: LX.EnvParams
  var lx: Lx
  var event_list: ListType

}

export {}
