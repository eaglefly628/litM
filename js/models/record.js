/**
 * 游戏记录数据模型
 */

export class RecordModel {
  constructor(data = {}) {
    this._id = data._id || ''
    this.petOpenid = data.petOpenid || ''
    this.gameType = data.gameType || ''  // 'dice' | 'wheel' | 'truth_or_dare' | 'random_event' | 'redeem' | 'punishment'
    this.result = data.result || ''
    this.pointsChange = data.pointsChange || 0
    this.playedAt = data.playedAt || null
  }

  get isPositive() {
    return this.pointsChange > 0
  }

  get typeLabel() {
    const labels = {
      dice: '🎲 骰子挑战',
      wheel: '🎰 幸运转盘',
      truth_or_dare: '💬 真心话大冒险',
      random_event: '🎁 随机事件',
      redeem: '🎁 兑换奖励',
      punishment: '⚡ 惩罚'
    }
    return labels[this.gameType] || this.gameType
  }

  toJSON() {
    return {
      gameType: this.gameType,
      result: this.result,
      pointsChange: this.pointsChange
    }
  }
}
