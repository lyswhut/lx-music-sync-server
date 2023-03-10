import fs from 'node:fs'
import crypto from 'node:crypto'


export const createDirSync = (path: string) => {
  if (!fs.existsSync(path)) {
    try {
      fs.mkdirSync(path, { recursive: true })
    } catch (e: any) {
      if (e.code !== 'EEXIST') {
        console.error('Could not set up log directory, error was: ', e)
        process.exit(1)
      }
    }
  }
}

/**
 * 创建 MD5 hash
 * @param {*} str
 */
export const toMD5 = (str: string) => crypto.createHash('md5').update(str).digest('hex')
