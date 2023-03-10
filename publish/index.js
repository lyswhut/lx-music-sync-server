const chalk = require('chalk')
const updateVersionFile = require('./updateChangeLog')

const run = async() => {
  // const params = parseArgv(process.argv.slice(2))
  // const bak = await updateVersionFile(params.ver)
  await updateVersionFile(process.argv.slice(2)[0])
  console.log(chalk.green('日志更新完成~'))
}


run()
