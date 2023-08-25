declare namespace LX {
  type OnlineSource = 'kw' | 'kg' | 'tx' | 'wy' | 'mg'
  type Source = OnlineSource | 'local'
  type Quality = '128k' | '320k' | 'flac' | 'flac24bit' | '192k' | 'ape' | 'wav'
  type QualityList = Partial<Record<Source, Quality[]>>
  type AddMusicLocationType = 'top' | 'bottom'

  namespace Sync {
    interface Status {
      status: boolean
      message: string
      address: string[]
      // code: string
      devices: KeyInfo[]
    }
    interface KeyInfo {
      clientId: string
      key: string
      deviceName: string
      lastConnectDate?: number
      isMobile: boolean
    }

    interface ListInfo {
      lastSyncDate?: number
      snapshotKey: string
    }
    type ListData = Omit<LX.List.ListDataFull, 'tempList'>
    type ListSyncMode = 'merge_local_remote'
    | 'merge_remote_local'
    | 'overwrite_local_remote'
    | 'overwrite_remote_local'
    | 'overwrite_local_remote_full'
    | 'overwrite_remote_local_full'
    // | 'none'
    | 'cancel'
  }
}
