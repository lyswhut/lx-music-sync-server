export const LIST_IDS = {
  DEFAULT: 'default',
  LOVE: 'love',
  TEMP: 'temp',
  DOWNLOAD: 'download',
  PLAY_LATER: null,
} as const

export const SYNC_CODE = {
  helloMsg: 'Hello~::^-^::~v3~',
  idPrefix: 'OjppZDo6',
  authMsg: 'lx-music auth::',
  msgAuthFailed: 'Auth failed',
  msgBlockedIp: 'Blocked IP',
  msgConnect: 'lx-music connect',
  msgAccount:'Account deactivated'
} as const

export const SYNC_CLOSE_CODE = {
  normal: 1000,
  failed: 4100,
} as const

export const TRANS_MODE: Readonly<Record<LX.Sync.Mode, LX.Sync.Mode>> = {
  merge_local_remote: 'merge_remote_local',
  merge_remote_local: 'merge_local_remote',
  overwrite_local_remote: 'overwrite_remote_local',
  overwrite_remote_local: 'overwrite_local_remote',
  overwrite_local_remote_full: 'overwrite_remote_local_full',
  overwrite_remote_local_full: 'overwrite_local_remote_full',
  cancel: 'cancel',
} as const
