/**
 * 积分商城场景 - 兑换奖励、管理奖惩池
 */

import { Scene } from '../base/scene'
import { Theme, drawRoundRect, drawButton, drawCard, drawTitle, drawText, drawNavBar, drawBadge } from '../base/ui'
import { PRESET_REWARDS, PRESET_PUNISHMENTS, REWARD_TIERS } from '../config/rewards-config'

const TAB_REWARDS = 'rewards'
const TAB_PUNISHMENTS = 'punishments'

export class ShopScene extends Scene {
  constructor(game) {
    super(game)
    this.tab = TAB_REWARDS
    this.rewards = []
    this.punishments = []
    this.showResult = null
  }

  async onEnter() {
    this.tab = TAB_REWARDS
    this.showResult = null
    await this.loadRewards()
  }

  async loadRewards() {
    try {
      const pool = await this.game.cloud.getRewardsPool(
        this.game.userInfo.partnerId || this.game.userInfo._openid
      )
      this.rewards = pool.filter(r => r.type === 'reward')
      this.punishments = pool.filter(r => r.type === 'punishment')

      // 如果池子为空，使用预设
      if (this.rewards.length === 0) this.rewards = PRESET_REWARDS
      if (this.punishments.length === 0) this.punishments = PRESET_PUNISHMENTS
    } catch (e) {
      this.rewards = PRESET_REWARDS
      this.punishments = PRESET_PUNISHMENTS
    }
  }

  render(ctx) {
    const { screenWidth, screenHeight } = this.game
    const user = this.game.userInfo || {}
    const isOwner = user.role === 'owner'
    const pet = this.game.petStatus || { points: 0 }
    this.buttons = []

    // 背景
    ctx.fillStyle = '#F9FAFB'
    ctx.fillRect(0, 0, screenWidth, screenHeight)

    // 顶部
    drawRoundRect(ctx, 0, 0, screenWidth, 80, 0, '#FFFFFF')
    const backBtn = {
      x: 10, y: 30, width: 50, height: 35,
      text: '← 返回', color: 'transparent', textColor: Theme.primary, fontSize: 13,
      onClick: () => this.game.sceneManager.switchTo('home')
    }
    drawButton(ctx, backBtn)
    this.buttons.push(backBtn)

    drawTitle(ctx, '🎁 积分商城', screenWidth / 2, 48, 18, Theme.textPrimary)

    // 积分显示
    drawCard(ctx, 16, 90, screenWidth - 32, 50, 10)
    drawText(ctx, '💎 当前积分:', 32, 105, null, 13, Theme.textSecondary, 'left')
    ctx.font = 'bold 20px "PingFang SC", sans-serif'
    ctx.fillStyle = Theme.accent
    ctx.textAlign = 'right'
    ctx.fillText(String(pet.points || 0), screenWidth - 32, 120)

    // 标签页切换
    const tabY = 155
    const tabW = (screenWidth - 48) / 2

    const rewardTabBtn = {
      x: 16, y: tabY, width: tabW, height: 36,
      text: '🎁 奖励', color: this.tab === TAB_REWARDS ? Theme.primary : '#E5E7EB',
      textColor: this.tab === TAB_REWARDS ? Theme.textLight : Theme.textSecondary,
      fontSize: 13, radius: 8,
      onClick: () => { this.tab = TAB_REWARDS }
    }
    const punishTabBtn = {
      x: 32 + tabW, y: tabY, width: tabW, height: 36,
      text: '⚡ 惩罚', color: this.tab === TAB_PUNISHMENTS ? Theme.danger : '#E5E7EB',
      textColor: this.tab === TAB_PUNISHMENTS ? Theme.textLight : Theme.textSecondary,
      fontSize: 13, radius: 8,
      onClick: () => { this.tab = TAB_PUNISHMENTS }
    }
    drawButton(ctx, rewardTabBtn)
    drawButton(ctx, punishTabBtn)
    this.buttons.push(rewardTabBtn, punishTabBtn)

    // 列表
    const items = this.tab === TAB_REWARDS ? this.rewards : this.punishments
    let listY = tabY + 50

    for (let i = 0; i < items.length && listY < screenHeight - 100; i++) {
      const item = items[i]
      const cardH = 58
      const cardW = screenWidth - 32

      drawCard(ctx, 16, listY, cardW, cardH, 10)

      // 图标
      ctx.font = '20px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(item.icon || '🎁', 30, listY + 28)

      // 内容
      drawText(ctx, item.content, 58, listY + 12, cardW - 130, 13, Theme.textPrimary, 'left')

      // 等级/类别标签
      const categoryColor = item.category === '铜级' ? '#CD7F32' :
                            item.category === '银级' ? '#999' :
                            item.category === '金级' ? '#DAA520' :
                            item.category === '钻石级' ? '#5CC8FF' :
                            item.category === '轻度' ? Theme.success :
                            item.category === '中度' ? Theme.warning : Theme.danger
      drawBadge(ctx, 58, listY + 34, item.category, categoryColor)

      // 兑换按钮（奖励需要积分）
      if (this.tab === TAB_REWARDS && !isOwner) {
        const cost = item.pointsCost || 50
        const canAfford = pet.points >= cost
        const redeemBtn = {
          x: 16 + cardW - 75, y: listY + 12, width: 65, height: 32,
          text: `${cost}分`, color: canAfford ? Theme.primary : '#D1D5DB',
          textColor: canAfford ? Theme.textLight : Theme.textSecondary,
          fontSize: 12, radius: 8,
          onClick: () => canAfford ? this.redeemReward(item) : null
        }
        drawButton(ctx, redeemBtn)
        this.buttons.push(redeemBtn)
      }

      if (this.tab === TAB_PUNISHMENTS) {
        // 惩罚转盘按钮（仅主人可指派）
        if (isOwner) {
          const assignBtn = {
            x: 16 + cardW - 65, y: listY + 14, width: 55, height: 28,
            text: '指派', color: Theme.danger, fontSize: 12, radius: 8,
            onClick: () => this.assignPunishment(item)
          }
          drawButton(ctx, assignBtn)
          this.buttons.push(assignBtn)
        }
      }

      listY += cardH + 8
    }

    // 主人添加按钮
    if (isOwner) {
      const addBtn = {
        x: screenWidth - 70, y: screenHeight - 130, width: 54, height: 54,
        text: '+', color: this.tab === TAB_REWARDS ? Theme.primary : Theme.danger,
        fontSize: 28, radius: 27,
        onClick: () => this.addCustomItem()
      }
      drawButton(ctx, addBtn)
      this.buttons.push(addBtn)
    }

    // 结果弹窗
    if (this.showResult) {
      this.renderResultModal(ctx)
    }

    // 底部导航
    const navTabs = [
      { name: 'home', icon: '🏠', label: '首页', onClick: () => this.game.sceneManager.switchTo('home') },
      { name: 'tasks', icon: '📋', label: '任务', onClick: () => this.game.sceneManager.switchTo('tasks') },
      { name: 'games', icon: '🎮', label: '游戏', onClick: () => this.game.sceneManager.switchTo('games') },
      { name: 'shop', icon: '🎁', label: '商城', onClick: () => {} },
      { name: 'diary', icon: '📖', label: '日记', onClick: () => this.game.sceneManager.switchTo('diary') }
    ]
    const navButtons = drawNavBar(ctx, screenWidth, screenHeight, 'shop', navTabs)
    this.buttons.push(...navButtons)
  }

  renderResultModal(ctx) {
    const { screenWidth, screenHeight } = this.game
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(0, 0, screenWidth, screenHeight)

    const modalW = screenWidth * 0.75
    const modalH = 180
    const modalX = (screenWidth - modalW) / 2
    const modalY = (screenHeight - modalH) / 2

    drawCard(ctx, modalX, modalY, modalW, modalH, 20)

    ctx.font = '40px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(this.showResult.success ? '🎉' : '😅', screenWidth / 2, modalY + 50)

    drawText(ctx, this.showResult.message, screenWidth / 2, modalY + 80, modalW - 40, 14, Theme.textPrimary, 'center')

    const okBtn = {
      x: (screenWidth - 120) / 2, y: modalY + modalH - 50, width: 120, height: 36,
      text: '好的', color: Theme.primary, fontSize: 14, radius: 10,
      onClick: () => { this.showResult = null }
    }
    drawButton(ctx, okBtn)
    this.buttons.push(okBtn)
  }

  async redeemReward(reward) {
    const pet = this.game.petStatus
    if (!pet || pet.points < reward.pointsCost) return

    try {
      const newPoints = pet.points - reward.pointsCost
      await this.game.cloud.updatePetStatus(pet._id, { points: newPoints })
      this.game.petStatus.points = newPoints

      this.showResult = {
        success: true,
        message: `成功兑换: ${reward.content}！\n花费${reward.pointsCost}积分，剩余${newPoints}积分`
      }

      this.game.cloud.addGameRecord({
        gameType: 'redeem',
        result: reward.content,
        pointsChange: -reward.pointsCost
      })
    } catch (e) {
      this.showResult = { success: false, message: '兑换失败，请重试' }
    }
  }

  assignPunishment(punishment) {
    this.showResult = {
      success: true,
      message: `已指派惩罚: ${punishment.content}\n小源需要完成这个惩罚哦~`
    }

    this.game.cloud.addGameRecord({
      gameType: 'punishment',
      result: punishment.content,
      pointsChange: 0
    })
  }

  addCustomItem() {
    const type = this.tab === TAB_REWARDS ? 'reward' : 'punishment'
    wx.showModal({
      title: type === 'reward' ? '添加奖励' : '添加惩罚',
      editable: true,
      placeholderText: `输入${type === 'reward' ? '奖励' : '惩罚'}内容`,
      success: async (res) => {
        if (res.confirm && res.content) {
          const newItem = {
            content: res.content,
            type,
            category: type === 'reward' ? '铜级' : '轻度',
            pointsCost: type === 'reward' ? 50 : 0,
            icon: type === 'reward' ? '🎁' : '⚡',
            ownerOpenid: this.game.userInfo._openid || ''
          }

          try {
            await this.game.cloud.addReward(newItem)
            if (type === 'reward') {
              this.rewards.push(newItem)
            } else {
              this.punishments.push(newItem)
            }
          } catch (e) {
            console.error('添加失败:', e)
          }
        }
      }
    })
  }
}
