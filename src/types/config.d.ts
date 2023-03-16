declare namespace LX {
  type AddMusicLocationType = 'top' | 'bottom'

  interface User {
    /**
     * 用户名
     */
    name: string

    /**
     * 连接密码
     */
    password: string

    /**
     * 最大备份快照数
     */
    maxSnapshotNum?: number

    /**
     * 添加歌曲到我的列表时的方式
     */
    'list.addMusicLocationType'?: AddMusicLocationType
  }

  interface UserConfig extends User {
    dataPath: string
  }

  interface Config {
    /**
     * 同步服务名称
     */
    'serverName': string

    /**
     * 是否使用代理转发请求到本服务器
     */
    'proxy.enabled': boolean

    /**
     * 代理转发的请求头 原始IP
     */
    'proxy.header': string

    /**
     * 公共最大备份快照数
     */
    maxSnapshotNum: number

    /**
     * 公共添加歌曲到我的列表时的方式 top | bottom，参考客户端的设置-列表设置-添加歌曲到我的列表时的方式
     */
    'list.addMusicLocationType': AddMusicLocationType

    /**
     * 同步用户
     */
    users: UserConfig[]
  }
}

