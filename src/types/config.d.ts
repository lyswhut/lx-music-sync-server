declare namespace LX {

  type AddMusicLocationType = 'top' | 'bottom'

  interface Config {
    /**
     * 账号是否启用
     */
    state: boolean,

    /**
     * 同步服务名称
     */
    'userName': string

    /**
     * 连接密码
     */
    'connectPasword': string

    /**
     * 最大备份快照数
     */
    'maxSsnapshotNum': number

    /**
     * 添加歌曲到我的列表时的方式
     */
    'list.addMusicLocationType': AddMusicLocationType
  }


}
