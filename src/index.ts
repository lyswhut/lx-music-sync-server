#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { initLogger } from '@/utils/log4js'
import defaultConfig from './defaultConfig'

const envLog = ['PORT', 'BIND_IP', 'CONNECT_PWD', 'CONFIG_PATH', 'LOG_PATH', 'DATA_PATH']
  .map(e => [e, process.env[e]])
  .filter(([_, v]) => v !== undefined)
  .map(([e, v]) => `${e as string}: ${v as string}`)
  .join('\n')
if (envLog) console.log(envLog)

const dataPath = process.env.DATA_PATH ?? path.join(__dirname, '../data')
global.lx = {
  logPath: process.env.LOG_PATH ?? path.join(__dirname, '../logs'),
  dataPath,
  snapshotPath: path.join(dataPath, './snapshot'),
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
  global.lx.config = newConfig
  return true
}

const p1 = path.join(__dirname, '../config.js')
fs.existsSync(p1) && margeConfig(p1)
process.env.CONFIG_PATH && fs.existsSync(process.env.CONFIG_PATH) && margeConfig(process.env.CONFIG_PATH)
if (process.env.CONNECT_PWD != null) lx.config.connectPasword = process.env.CONNECT_PWD


const exit = (message: string): never => {
  console.error(message)
  process.exit(0)
}

if (!global.lx.config.connectPasword) {
  exit('Connection password is not set, please edit config.ts file')
}


export const checkAndCreateDirSync = (path: string) => {
  if (!fs.existsSync(path)) {
    try {
      fs.mkdirSync(path, { recursive: true })
    } catch (e: any) {
      if (e.code !== 'EEXIST') {
        exit(`Could not set up log directory, error was: ${e.message as string}`)
      }
    }
  }
}

checkAndCreateDirSync(global.lx.logPath)
checkAndCreateDirSync(global.lx.dataPath)
checkAndCreateDirSync(global.lx.snapshotPath)
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

const port = normalizePort(process.env.PORT ?? '9527')
const bindIP = process.env.BIND_IP ?? '127.0.0.1'

void Promise.all([import('@/event'), import('@/server')]).then(async([{ createListEvent }, { startServer }]) => {
  global.event_list = createListEvent()
  return startServer(port, bindIP)
})

