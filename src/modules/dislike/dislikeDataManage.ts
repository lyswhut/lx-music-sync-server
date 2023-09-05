import { SPLIT_CHAR } from '@/constants'
import { type SnapshotDataManage } from './snapshotDataManage'
import { filterRules } from './utils'

const filterRulesToString = (rules: string) => {
  return Array.from(filterRules(rules)).join('\n')
}

export class DislikeDataManage {
  snapshotDataManage: SnapshotDataManage
  dislikeRules = ''

  constructor(snapshotDataManage: SnapshotDataManage) {
    this.snapshotDataManage = snapshotDataManage

    let dislikeRules: LX.Dislike.DislikeRules | null
    void this.snapshotDataManage.getSnapshotInfo().then(async(snapshotInfo) => {
      if (snapshotInfo.latest) dislikeRules = await this.snapshotDataManage.getSnapshot(snapshotInfo.latest)
      if (!dislikeRules) dislikeRules = ''
      this.dislikeRules = dislikeRules
    })
  }

  getDislikeRules = async(): Promise<LX.Dislike.DislikeRules> => {
    return this.dislikeRules
  }

  addDislikeInfo = async(infos: LX.Dislike.DislikeMusicInfo[]) => {
    this.dislikeRules = filterRulesToString(this.dislikeRules + '\n' + infos.map(info => `${info.name ?? ''}${SPLIT_CHAR.DISLIKE_NAME}${info.singer ?? ''}`).join('\n'))
    return this.dislikeRules
  }

  overwirteDislikeInfo = async(rules: string) => {
    this.dislikeRules = filterRulesToString(rules)
    return this.dislikeRules
  }
}

