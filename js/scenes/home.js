/**
 * 主页场景 - 宠物展示、状态面板、底部导航
 */

import { Scene } from '../base/scene'
import { Theme, drawRoundRect, drawButton, drawCard, drawTitle, drawText, drawAvatar, drawProgressBar, drawNavBar, drawBadge } from '../base/ui'
import { FloatAnimation } from '../utils/animation'

const NAV_TABS = [
  { name: 'home', icon: '🏠', label: '首页' },
  { name: 'tasks', icon: '📋', label: '任务' },
  { name: 'games', icon: '🎮', label: '游戏' },
  { name: 'shop', icon: '🎁', label: '商城' },
  { name: 'diary', icon: '📖', label: '日记' }
]

export class HomeScene extends Scene {
  constructor(game) {
    super(game)
    this.petFloat = new FloatAnimation(4, 0.002)
    this.activeTab = 'home'
  }

  onEnter() {
    this.activeTab = 'home'
    this.refreshData()
  }

  async refreshData() {
    try {
      await this.game.loadGameData()
    } catch (e) {
      console.error('刷新数据失败:', e)
    }
  }

  render(ctx) {
    const { screenWidth, screenHeight } = this.game
    this.buttons = []

    // 背景
    const gradient = ctx.createLinearGradient(0, 0, 0, screenHeight * 0.4)
    gradient.addColorStop(0, '#FDE8EE')
    gradient.addColorStop(1, '#FFFFFF')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, screenWidth, screenHeight)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, screenHeight * 0.4, screenWidth, screenHeight * 0.6)

    const pet = this.game.petStatus || this.getDefaultPet()
    const user = this.game.userInfo || {}
    const isOwner = user.role === 'owner'

    // 顶部标题
    drawTitle(ctx, '小源养成记', screenWidth / 2, 40, 20, Theme.primary)

    // 角色标识
    const roleText = isOwner ? '👑 主人模式' : '🐶 小源模式'
    drawText(ctx, roleText, screenWidth / 2, 62, null, 12, Theme.textSecondary, 'center')

    // 宠物展示区域
    const petY = 140 + this.petFloat.value
    const petEmoji = this.getPetEmoji(pet.level, pet.mood)
    drawAvatar(ctx, screenWidth / 2, petY, 55, petEmoji)

    // 称号
    drawText(ctx, pet.title, screenWidth / 2, petY + 70, null, 13, Theme.secondary, 'center')

    // 心情图标
    const moodEmoji = pet.mood === 'happy' ? '😊' : pet.mood === 'normal' ? '😐' : '😢'
    drawText(ctx, moodEmoji, screenWidth / 2 + 60, petY - 50, null, 20, null, 'center')

    // 状态面板
    const panelY = petY + 100
    const panelX = 20
    const panelW = screenWidth - 40

    drawCard(ctx, panelX, panelY, panelW, 160, 16)

    // 等级 + 经验条
    const expForNext = this.getExpForLevel(pet.level)
    const expProgress = pet.exp / expForNext

    drawText(ctx, `Lv.${pet.level}`, panelX + 16, panelY + 16, null, 16, Theme.primary, 'left')
    ctx.font = 'bold 16px "PingFang SC", sans-serif'

    drawText(ctx, `${pet.exp}/${expForNext} EXP`, panelX + panelW - 16, panelY + 16, null, 11, Theme.textSecondary, 'right')
    drawProgressBar(ctx, panelX + 16, panelY + 42, panelW - 32, 10, expProgress, Theme.primary)

    // 数据网格 (2x2)
    const gridY = panelY + 65
    const cellW = (panelW - 32) / 2
    const cellH = 40

    const stats = [
      { label: '积分', value: pet.points, icon: '💎', color: Theme.accent },
      { label: '亲密度', value: `${pet.affection}%`, icon: '💕', color: Theme.danger },
      { label: '连续打卡', value: `${pet.streak}天`, icon: '🔥', color: '#EF4444' },
      { label: '总积分', value: pet.totalPoints, icon: '⭐', color: Theme.warning }
    ]

    stats.forEach((stat, i) => {
      const cx = panelX + 16 + (i % 2) * cellW
      const cy = gridY + Math.floor(i / 2) * cellH

      ctx.font = '16px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(stat.icon, cx, cy + 12)

      drawText(ctx, stat.label, cx + 22, cy + 2, null, 11, Theme.textSecondary, 'left')
      ctx.font = `bold 14px "PingFang SC", sans-serif`
      ctx.fillStyle = stat.color
      ctx.textAlign = 'left'
      ctx.fillText(String(stat.value), cx + 22, cy + 20)
    })

    // 快捷操作按钮
    const actionY = panelY + 180

    if (isOwner) {
      // 主人操作
      const btn1 = {
        x: panelX, y: actionY, width: (panelW - 10) / 2, height: 44,
        text: '📝 发布任务', color: Theme.primary, fontSize: 14,
        onClick: () => this.game.sceneManager.switchTo('tasks', { tab: 'create' })
      }
      const btn2 = {
        x: panelX + (panelW - 10) / 2 + 10, y: actionY, width: (panelW - 10) / 2, height: 44,
        text: '✅ 确认任务', color: Theme.success, fontSize: 14,
        onClick: () => this.game.sceneManager.switchTo('tasks', { tab: 'verify' })
      }
      drawButton(ctx, btn1)
      drawButton(ctx, btn2)
      this.buttons.push(btn1, btn2)
    } else {
      // 小源操作
      const btn1 = {
        x: panelX, y: actionY, width: (panelW - 10) / 2, height: 44,
        text: '📋 去打卡', color: Theme.primary, fontSize: 14,
        onClick: () => this.game.sceneManager.switchTo('tasks')
      }
      const btn2 = {
        x: panelX + (panelW - 10) / 2 + 10, y: actionY, width: (panelW - 10) / 2, height: 44,
        text: '🎮 玩游戏', color: Theme.secondary, fontSize: 14,
        onClick: () => this.game.sceneManager.switchTo('games')
      }
      drawButton(ctx, btn1)
      drawButton(ctx, btn2)
      this.buttons.push(btn1, btn2)
    }

    // 今日概览卡片
    const overviewY = actionY + 64
    drawCard(ctx, panelX, overviewY, panelW, 80, 12)
    drawText(ctx, '📌 今日概览', panelX + 16, overviewY + 12, null, 14, Theme.textPrimary, 'left')
    ctx.font = `bold 14px "PingFang SC", sans-serif`
    drawText(ctx, '已完成 0/7 个任务 · 获得 0 积分', panelX + 16, overviewY + 38, panelW - 32, 12, Theme.textSecondary, 'left')
    drawText(ctx, '继续加油哦~ 💪', panelX + 16, overviewY + 56, null, 12, Theme.accent, 'left')

    // 底部导航
    const navTabs = NAV_TABS.map(tab => ({
      ...tab,
      onClick: () => {
        if (tab.name === 'home') return
        this.game.sceneManager.switchTo(tab.name === 'tasks' ? 'tasks' :
          tab.name === 'games' ? 'games' :
          tab.name === 'shop' ? 'shop' :
          tab.name === 'diary' ? 'diary' : 'home')
      }
    }))
    const navButtons = drawNavBar(ctx, screenWidth, screenHeight, this.activeTab, navTabs)
    this.buttons.push(...navButtons)
  }

  getPetEmoji(level, mood) {
    if (mood === 'sad') return '🐶'
    if (level >= 30) return '🐕'
    if (level >= 20) return '🦮'
    if (level >= 10) return '🐩'
    return '🐶'
  }

  getExpForLevel(level) {
    return Math.floor(50 * Math.pow(1.15, level - 1))
  }

  getDefaultPet() {
    return {
      level: 1, exp: 0, points: 100, totalPoints: 100,
      mood: 'happy', affection: 50, title: '初来乍到的小狗',
      appearance: 'default', streak: 0
    }
  }
}
