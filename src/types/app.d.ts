/* eslint-disable no-var */
import {type ListType} from '@/event'


declare global {

  interface Lx {
    /**
     * 监听端口
     */
    port: number
    /**
     * 绑定IP
     */
    bindIP: string
    /**
     * 日志存放位置
     */
    logPath: string
    /**
     * 数据存放目录
     */
    dataPath: string
    /**
     * 服务器名称
     */
    serverName: string
    /**
     * 是否使用代理转发请求到本服务器
     */
    'proxy.enabled': boolean
    /**
     * 代理转发的请求头 原始IP
     */
    'proxy.header': string
    /**
     * 删除用户配置，是否同时删除用户信息
     */
    clearDeleteUserData: boolean
    /**
     * 用户配置文件
     */
    users: Record<string, Lx.Config>
  }

  // var envParams: LX.EnvParams
  var lx: Lx
  var event_list: ListType

}

export {}
