declare namespace LX {
  type AddMusicLocationType = 'top' | 'bottom'

  interface Config {
    /**
     * 同步服务名称
     */
    'serverName': string

    /**
     * 连接密码
     */
    'connectPasword': string

    /**
     * 最大备份快照数
     */
    'maxSsnapshotNum': number

    /**
     * 是否使用代理转发请求到本服务器
     */
    'proxy.enabled': boolean

    /**
     * 代理转发的请求头 原始IP
     */
    'proxy.header': string

    /**
     * 添加歌曲到我的列表时的方式
     */
    'list.addMusicLocationType': LX.AddMusicLocationType

  }
}

