
const config: LX.Config = {
  serverName: 'My Sync Server', // 同步服务名称
  connectPasword: '', // 连接密码，若在外网，务必增加密码复杂度
  maxSsnapshotNum: 10, // 最大备份快照数
  'proxy.enabled': false, // 是否使用代理转发请求到本服务器
  'proxy.header': 'x-real-ip', // 代理转发的请求头 原始IP

  'list.addMusicLocationType': 'top', // 添加歌曲到我的列表时的方式 top | bottom

} as const

export default config
