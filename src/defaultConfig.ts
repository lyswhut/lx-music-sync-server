import path from "path";

const config: Lx = {
  port: 9527,
  bindIP: '0.0.0.0',
  logPath: path.join(__dirname, '../logs'),
  dataPath: path.join(__dirname, '../data'),
  serverName: 'LxSyncServer', // 服务其名称
  'proxy.enabled': false, // 是否使用代理转发请求到本服务器
  'proxy.header': 'x-real-ip', // 代理转发的请求头 原始IP
  clearDeleteUserData: true, // 删除用户配置，是否同时删除用户信息
  users: { // key 用户名
    mySyncServer: {
      state: true, // 账号是否启用
      userName: 'mySyncServer', // 备用用户名，默认不填为key(mySyncServer),暂时没用
      connectPasword: 'mySyncServer', // 连接密码，若在外网，务必增加密码复杂度
      maxSnapshotNum: 10, // 最大备份快照数
      'list.addMusicLocationType': 'top', // 添加歌曲到我的列表时的方式 top | bottom
    }
  }
} as const

export default config

