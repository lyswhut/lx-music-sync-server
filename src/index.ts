#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { initLogger } from '@/utils/log4js'
import defaultConfig from './defaultConfig'
import { ENV_PARAMS } from './constants'
import { checkAndCreateDirSync } from './utils'

type ENV_PARAMS_Type = typeof ENV_PARAMS
type ENV_PARAMS_Value_Type = ENV_PARAMS_Type[number]

let envParams: Partial<Record<Exclude<ENV_PARAMS_Value_Type, 'LX_USER_'>, string>> = {}
let envUsers: Record<string, string> = {}
const envLog = [
  ...(Object.values(ENV_PARAMS)
    .filter(v => v != 'LX_USER_')
    .map(e => [e, process.env[e]]) as Array<[Exclude<ENV_PARAMS_Value_Type, 'LX_USER_'>, string]>
  ).filter(([k, v]) => {
    if (!v) return false
    envParams[k] = v
    return true
  }),
  ...Object.entries(process.env)
    .filter(([k, v]) => {
      if (k.startsWith('LX_USER_') && !!v) {
        const pwd = k.replace('LX_USER_', '')
        if (pwd) {
          envUsers[pwd] = v
          return true
        }
      }
      return false
    }),
].map(([e, v]) => `${e}: ${v as string}`).join('\n')
if (envLog) console.log(envLog)

const dataPath = envParams.DATA_PATH ?? path.join(__dirname, '../data')
global.lx = {
  logPath: envParams.LOG_PATH ?? path.join(__dirname, '../logs'),
  dataPath,
  userPath: path.join(dataPath, 'users'),
  config: defaultConfig,
}

const margeConfig = (p: string) => {
  let config
  try {
    config = path.extname(p) == '.js'
      ? require(p)
      : JSON.parse(fs.readFileSync(p).toString()) as LX.Config
  } catch (err: any) {
    console.warn('Read config error: ' + (err.message as string))
    return false
  }
  const newConfig = { ...global.lx.config }
  for (const key of Object.keys(defaultConfig) as Array<keyof LX.Config>) {
    // @ts-expect-error
    if (config[key] !== undefined) newConfig[key] = config[key]
  }
  console.log('Load config: ' + p)
  if (newConfig.users) {
    for (const [pwd, user] of Object.entries(newConfig.users)) {
      if (typeof user == 'string') {
        newConfig.users[pwd] = {
          name: user,
          dataPath: '',
        }
      } else {
        newConfig.users[pwd] = {
          ...user,
          dataPath: '',
        }
      }
    }
  }
  global.lx.config = newConfig
  return true
}

const p1 = path.join(__dirname, '../config.js')
fs.existsSync(p1) && margeConfig(p1)
envParams.CONFIG_PATH && fs.existsSync(envParams.CONFIG_PATH) && margeConfig(envParams.CONFIG_PATH)
if (envParams.PROXY_HEADER) {
  global.lx.config['proxy.enabled'] = true
  global.lx.config['proxy.header'] = envParams.PROXY_HEADER
}
if (envParams.MAX_SNAPSHOT_NUM) {
  const num = parseInt(envParams.MAX_SNAPSHOT_NUM)
  if (!isNaN(num)) global.lx.config.maxSnapshotNum = num
}
if (envParams.LIST_ADD_MUSIC_LOCATION_TYPE) {
  switch (envParams.LIST_ADD_MUSIC_LOCATION_TYPE) {
    case 'top':
    case 'bottom':
      global.lx.config['list.addMusicLocationType'] = envParams.LIST_ADD_MUSIC_LOCATION_TYPE
      break
  }
}

if (Object.keys(envUsers).length) {
  const users: LX.Config['users'] = {}
  let u
  for (let [k, v] of Object.entries(envUsers)) {
    try {
      u = JSON.parse(v) as LX.UserConfig
    } catch {
      users[k] = {
        name: v,
        dataPath: '',
      }
      continue
    }
    users[k] = {
      ...u,
      dataPath: '',
    }
  }
  global.lx.config.users = users
}

const exit = (message: string): never => {
  console.error(message)
  process.exit(0)
}

const checkAndCreateDir = (path: string) => {
  try {
    checkAndCreateDirSync(path)
  } catch (e: any) {
    if (e.code !== 'EEXIST') {
      exit(`Could not set up log directory, error was: ${e.message as string}`)
    }
  }
}

const checkUserConfig = (users: LX.Config['users']) => {
  const userNames: string[] = []
  for (const user of Object.values(users)) {
    if (userNames.includes(user.name)) exit('user name duplicate: ' + user.name)
    userNames.push(user.name)
  }
}

checkAndCreateDir(global.lx.logPath)
checkAndCreateDir(global.lx.dataPath)
checkAndCreateDir(global.lx.userPath)
checkUserConfig(global.lx.config.users)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getUserDirname } = require('@/utils/data')
for (const u of Object.values(global.lx.config.users)) {
  const dataPath = path.join(global.lx.userPath, getUserDirname(u.name))
  checkAndCreateDir(dataPath)
  u.dataPath = dataPath
}
initLogger()


/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: string) {
  const port = parseInt(val, 10)

  if (isNaN(port) || port < 1) {
    // named pipe
    exit(`port illegal: ${val}`)
  }
  return port
}

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(envParams.PORT ?? '9527')
const bindIP = envParams.BIND_IP ?? '0.0.0.0'

void Promise.all([import('@/event'), import('@/server')]).then(async([{ createListEvent }, { startServer }]) => {
  global.event_list = createListEvent()
  return startServer(port, bindIP)
})

