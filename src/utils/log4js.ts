import path from 'node:path'
import log4js from 'log4js'

const createLogConfig = (logPath: string) => {
  return {
    appenders: {
      access: {
        type: 'file',
        filename: path.join(logPath, 'access.log'),
        maxLogSize: 1024 * 1024 * 10,
        category: 'access',
        // compress: true,
        keepFileExt: true,
        numBackups: 10,
      },
      app: {
        type: 'file',
        filename: path.join(logPath, 'app.log'),
        maxLogSize: 10485760,
        backups: 10,
        keepFileExt: true,
      },
      errorFile: {
        type: 'file',
        filename: path.join(logPath, 'errors.log'),
      },
      errors: {
        type: 'logLevelFilter',
        level: 'ERROR',
        appender: 'errorFile',
      },
      console: {
        type: 'console',
      },
    },
    categories: {
      default: { appenders: ['app', 'errors', 'console'], level: 'DEBUG' },
      access: { appenders: ['access'], level: 'ALL' },
    },
  }
}


export const initLogger = () => {
  log4js.configure(createLogConfig(global.lx.logPath))
}


export const startupLog = log4js.getLogger('startup')
export const syncLog = log4js.getLogger('sync')
export const accessLog = log4js.getLogger('access')
