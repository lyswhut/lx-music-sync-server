const fs = require('fs')
const { jp, formatTime } = require('./utils')
const pkgDir = '../package.json'
const pkg = require(pkgDir)
const chalk = require('chalk')
const parseChangelog = require('changelog-parser')
const changelogPath = jp('../CHANGELOG.md')

const getPrevVer = () => parseChangelog(changelogPath).then(res => {
  if (!res.versions.length) throw new Error('CHANGELOG 无法解析到版本号')
  return res.versions[0].version
})

const updateChangeLog = async(newVerNum, newChangeLog) => {
  let changeLog = fs.readFileSync(changelogPath, 'utf-8')
  const prevVer = await getPrevVer()
  const log = `## [${newVerNum}](${pkg.repository.url.replace(/^git\+(http.+)\.git$/, '$1')}/compare/v${prevVer}...v${newVerNum}) - ${formatTime()}\n\n${newChangeLog}`
  fs.writeFileSync(changelogPath, changeLog.replace(/(## [?0.1.1]?)/, log + '\n$1'), 'utf-8')
}


module.exports = async newVerNum => {
  if (!newVerNum) {
    let verArr = pkg.version.split('.')
    verArr[verArr.length - 1] = parseInt(verArr[verArr.length - 1]) + 1
    newVerNum = verArr.join('.')
  }
  const newMDChangeLog = fs.readFileSync(jp('./changeLog.md'), 'utf-8')
  pkg.version = newVerNum

  console.log(chalk.blue('new version: ') + chalk.green(newVerNum))

  await updateChangeLog(newVerNum, newMDChangeLog)

  fs.writeFileSync(jp(pkgDir), JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
}

