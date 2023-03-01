#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { initLogger } from '@/utils/log4js'
import config from '../config'

const dataPath = process.env.DATA_PATH ?? path.join(__dirname, '../data')
global.lx = {
  logPath: process.env.LOG_PATH ?? path.join(__dirname, '../logs'),
  dataPath,
  snapshotPath: path.join(dataPath, './snapshot'),
  config,
}

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
const bindIP = process.env.HOST ?? '127.0.0.1'

void Promise.all([import('@/event'), import('@/server')]).then(async([{ createListEvent }, { startServer }]) => {
  global.event_list = createListEvent()
  return startServer(port, bindIP)
})

