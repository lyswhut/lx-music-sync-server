module.exports = {}

/**
 * 配置例子
 * 设置该配置后默认用户配置则被覆盖取消
 * module.exports = {
 *   test1: { // key 用户1
 *     state: true, // 账号是否启用
 *     userName: '', // 备用用户名，默认不填为key(test1),暂时没用
 *     connectPasword: 'dddd', // 连接密码，若在外网，务必增加密码复杂度,密码唯一，根据链接的密码自动分组用户
 *     maxSnapshotNum: 10, // 最大备份快照数
 *     'list.addMusicLocationType': 'top', // 添加歌曲到我的列表时的方式 top | bottom
 *   },
 *   test2: { // key 用户2
 *     state: true, // 账号是否启用
 *     userName: '', // 备用用户名，默认不填为key(test2),暂时没用
 *     connectPasword: 'ssss', // 连接密码，若在外网，务必增加密码复杂度,密码唯一，根据链接的密码自动分组用户
 *     maxSnapshotNum: 10, // 最大备份快照数
 *     'list.addMusicLocationType': 'top', // 添加歌曲到我的列表时的方式 top | bottom
 *   },
 *   test3: { // key 用户2
 *     state: false, // 账号是否启用
 *     userName: '', // 备用用户名，默认不填为key(test2),暂时没用
 *     connectPasword: 'aaaa', // 连接密码，若在外网，务必增加密码复杂度,密码唯一，根据链接的密码自动分组用户
 *     maxSnapshotNum: 10, // 最大备份快照数
 *     'list.addMusicLocationType': 'top', // 添加歌曲到我的列表时的方式 top | bottom
 *   }
 * }
 *
 *
 */
