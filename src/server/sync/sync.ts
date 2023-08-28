import { FeaturesList } from '@/constants'
import { featureVersion, modules } from '@/modules'


export const sync = async(socket: LX.Socket) => {
  let disconnected = false
  socket.onClose(() => {
    disconnected = true
  })
  const enabledFeatures = await socket.remote.getEnabledFeatures('server', featureVersion)

  if (disconnected) throw new Error('disconnected')
  for (const moduleName of FeaturesList) {
    if (enabledFeatures[moduleName]) {
      await modules[moduleName].sync(socket).then(() => {
        socket.feature[moduleName] = true
      }).catch(_ => _)
    }
    if (disconnected) throw new Error('disconnected')
  }
  await socket.remote.finished()
}
