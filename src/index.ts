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
  return o === '';
}

export const isItInTheArray = (key: string, array: Array<string>) => {
  return array.indexOf(key) > -1
}

const margeConfig = (p: string) => {
  let configs: Record<string, LX.Config>
  try {
    configs = path.extname(p) == '.js' ? require(p) : JSON.parse(fs.readFileSync(p).toString())
  } catch (err: any) {
    console.warn('Read config error: ' + (err.message as string))
    return false
  }
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
    if (!config.hasOwnProperty('maxSsnapshotNum') || isEmpty(config.maxSsnapshotNum)) {
      config.maxSsnapshotNum = defaultConfig.users.mySyncServer.maxSsnapshotNum
    }
    if (!config.hasOwnProperty('list.addMusicLocationType') || isEmpty(config['list.addMusicLocationType'])) {
      config['list.addMusicLocationType'] = defaultConfig.users.mySyncServer["list.addMusicLocationType"]
    }
  }
  global.lx.users = configs
  console.log('Load config: ' + p)
  return true
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
  users: defaultConfig.users
}

const configPath = path.join(__dirname, '../config.js')
fs.existsSync(configPath) && margeConfig(configPath)
process.env.CONFIG_PATH && fs.existsSync(process.env.CONFIG_PATH) && margeConfig(process.env.CONFIG_PATH)

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

function deleteFolder(path: string) {
  let files = [];
  if (fs.existsSync(path)) {
    files = fs.readdirSync(path);
    files.forEach(function (file, index) {
      const curPath = path + "/" + file;
      if (fs.statSync(curPath).isDirectory()) { // recurse
        deleteFolder(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
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
          console.log('删除', tempPath, '目录')
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

