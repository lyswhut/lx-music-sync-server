#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import {initLogger} from '@/utils/log4js'
import defaultConfig from './defaultConfig'

const envLog = ['PORT', 'BIND_IP', 'CONNECT_PWD', 'CONFIG_PATH', 'LOG_PATH', 'DATA_PATH']
  .map(e => [e, process.env[e]])
  .filter(([_, v]) => v !== undefined)
  .map(([e, v]) => `${e as string}: ${v as string}`)
  .join('\n')
if (envLog) console.log(envLog)

function normalizePort(val: string) {
  const port = parseInt(val, 10)

  if (isNaN(port) || port < 1) {
    // named pipe
    exit(`port illegal: ${val}`)
  }
  return port
}

const exit = (message: string): never => {
  console.error(message)
  process.exit(0)
}

export const isEmpty = (o: any) => {
  if (o === null) return true
  if (o === undefined) return true
  if (typeof o === 'string' && o === '') return true
  return Object.keys(o).length === 0;
}

export const isItInTheArray = (key: string, array: Array<string>) => {
  return array.indexOf(key) > -1
}

const margeConfig = (configPath: string) => {
  let configs: Record<string, LX.Config>
  try {
    configs = path.extname(configPath) == '.js' ? require(configPath) : JSON.parse(fs.readFileSync(configPath).toString())
  } catch (err: any) {
    console.warn('Read config error: ' + (err.message as string))
    return false
  }
  if (isEmpty(configs)) return false

  const userNames = Object.keys(configs)
  const passwords = Object.values(configs).map(c => c.connectPasword)

  for (const userName of Object.keys(configs)) {
    const config = configs[userName]
    if (!config.hasOwnProperty('state')) {
      config.state = defaultConfig.users.mySyncServer.status
    }
    if (!config.hasOwnProperty('userName') || isEmpty(config.userName)) {
      config.userName = userName
    }
    if (userNames.filter(un => un === userName).length > 1) {
      exit('The userName is duplicate, please modify the configuration file')
    }
    if (!config.hasOwnProperty('connectPasword') || isEmpty(config.connectPasword)) {
      exit('User ' + userName + ' has not set a password, please modify the configuration file')
    }
    if (passwords.filter(pw => pw === config.connectPasword).length > 1) {
      exit('The password is duplicate, please modify the configuration file')
    }
    if (!config.hasOwnProperty('maxSnapshotNum') || isEmpty(config.maxSnapshotNum)) {
      config.maxSnapshotNum = defaultConfig.users.mySyncServer.maxSnapshotNum
    }
    if (!config.hasOwnProperty('list.addMusicLocationType') || isEmpty(config['list.addMusicLocationType'])) {
      config['list.addMusicLocationType'] = defaultConfig.users.mySyncServer["list.addMusicLocationType"]
    }
    console.log('Load' + userName + ' config')
  }
  global.lx.users = configs
  console.log('Load config: ' + configPath + 'ok')
  return true
}

export const checkAndCreateDirSync = (path: string) => {
  if (!fs.existsSync(path)) {
    try {
      fs.mkdirSync(path, {recursive: true})
    } catch (e: any) {
      if (e.code !== 'EEXIST') {
        exit(`Could not set up log directory, error was: ${e.message as string}`)
      }
    }
  }
}

const deleteFolder = (path: string) => {
  let files = [];
  if (fs.existsSync(path)) {
    files = fs.readdirSync(path);
    for (const file of files) {
      const curPath = path + "/" + file;
      if (fs.statSync(curPath).isDirectory()) { // recurse
        deleteFolder(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    }
    fs.rmdirSync(path);
  }
}

global.lx = {
  port: normalizePort(process.env.PORT ?? defaultConfig.port + ''),
  bindIP: process.env.HOST ?? defaultConfig.bindIP,
  logPath: process.env.LOG_PATH ?? defaultConfig.logPath,
  dataPath: process.env.DATA_PATH ?? defaultConfig.dataPath,
  serverName: process.env.SERVER_NAME ?? defaultConfig.serverName,
  'proxy.enabled': Boolean(process.env.PROXY_ENABLED ?? defaultConfig["proxy.enabled"]),
  'proxy.header': process.env.PROXY_HEADER ?? defaultConfig["proxy.header"],
  clearDeleteUserData: Boolean(process.env.CLEAR_DELETE_USER_DATA ?? defaultConfig.clearDeleteUserData),
  users: {}
}
let configPath = path.join(__dirname, '../config.js')
const pec = process.env.CONFIG_PATH
if (pec) {
  if (!fs.existsSync(pec)) {
    checkAndCreateDirSync(pec.substring(0, pec.lastIndexOf('\\')))
    fs.copyFileSync(configPath, pec)
  }
  console.log('create【' + process.env.CONFIG_PATH + '】profile')
  configPath = pec
}

if (!margeConfig(configPath)) {
  console.log('The user profile is empty, the default configuration will be used')
  const userName = process.env.CONNECT_PWD ?? 'mySyncServer'
  global.lx.users[userName] = {
    state: true,
    userName: userName,
    connectPasword: process.env.CONNECT_PWD ?? defaultConfig.users.mySyncServer.connectPasword,
    maxSnapshotNum: process.env.MAXS_SNAPSHOT_NUM ?? defaultConfig.users.mySyncServer.maxSnapshotNum,
    'list.addMusicLocationType': defaultConfig.users.mySyncServer['list.addMusicLocationType'],
  }
  if (isEmpty(defaultConfig.users.mySyncServer.connectPasword)) {
    exit('The default user has not set the password. Please modify the configuration file defaultConfig.js or set the environment variable CONNECT_ PWD')
  }
}

checkAndCreateDirSync(global.lx.logPath)

for (const userName in global.lx.users) {
  checkAndCreateDirSync(path.join(global.lx.dataPath, userName, "snapshot"))
}

if (global.lx.clearDeleteUserData) {
  const userNames = Object.keys(global.lx.users)
  fs.readdir(global.lx.dataPath, (err, files) => {
    for (const file of files) {
      const tempPath = path.join(global.lx.dataPath, file)
      fs.stat(tempPath, (err, stat) => {
        if (stat.isDirectory() && !isItInTheArray(file, userNames)) {
          console.log('Delete', tempPath, ' user directory')
          deleteFolder(tempPath)
        }
      })
    }
  })
}

initLogger()

void Promise.all([import('@/event'), import('@/server')]).then(async ([{createListEvent}, {startServer}]) => {
  global.event_list = createListEvent()
  return startServer(global.lx.port, global.lx.bindIP)
})

