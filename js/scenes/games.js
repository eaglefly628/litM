/**
 * 互动小游戏场景 - 转盘、骰子、真心话大冒险、随机事件
 */

import { Scene } from '../base/scene'
import { Theme, drawRoundRect, drawButton, drawCard, drawTitle, drawText, drawNavBar, drawModal } from '../base/ui'
import { TRUTH_QUESTIONS, DARE_CHALLENGES, RANDOM_EVENTS, DEFAULT_WHEEL_ITEMS, DICE_SPECIAL_EVENTS, TOD_RATINGS, GAME_COSTS } from '../config/games-config'
import { randomPick, randomInt, rollDice, weightedRandom, calculateWheelAngle } from '../utils/random'
import { Tween, ParticleSystem } from '../utils/animation'

const PAGE_MENU = 'menu'
const PAGE_WHEEL = 'wheel'
const PAGE_DICE = 'dice'
const PAGE_TOD = 'tod'    // truth or dare
const PAGE_EVENT = 'event'

export class GamesScene extends Scene {
  constructor(game) {
    super(game)
    this.page = PAGE_MENU
    this.wheelAngle = 0
    this.wheelSpinning = false
    this.wheelTween = null
    this.wheelResult = null

    this.diceValues = [0, 0]
    this.diceRolling = false
    this.diceResult = null

    this.todType = null  // 'truth' or 'dare'
    this.todQuestion = ''
    this.todShowRating = false

    this.randomEvent = null
    this.particles = null
  }

  onEnter() {
    this.page = PAGE_MENU
    this.wheelResult = null
    this.diceResult = null
    this.todQuestion = ''
    this.randomEvent = null
  }

  render(ctx) {
    const { screenWidth, screenHeight } = this.game
    this.buttons = []

    // 背景
    ctx.fillStyle = '#F9FAFB'
    ctx.fillRect(0, 0, screenWidth, screenHeight)

    // 顶部
    drawRoundRect(ctx, 0, 0, screenWidth, 80, 0, '#FFFFFF')
    const backBtn = {
      x: 10, y: 30, width: 50, height: 35,
      text: '← 返回', color: 'transparent', textColor: Theme.primary, fontSize: 13,
      onClick: () => {
        if (this.page === PAGE_MENU) {
          this.game.sceneManager.switchTo('home')
        } else {
          this.page = PAGE_MENU
          this.wheelResult = null
          this.diceResult = null
        }
      }
    }
    drawButton(ctx, backBtn)
    this.buttons.push(backBtn)

    drawTitle(ctx, '🎮 趣味游戏', screenWidth / 2, 48, 18, Theme.textPrimary)

    switch (this.page) {
      case PAGE_MENU: this.renderMenu(ctx); break
      case PAGE_WHEEL: this.renderWheel(ctx); break
      case PAGE_DICE: this.renderDice(ctx); break
      case PAGE_TOD: this.renderTruthOrDare(ctx); break
      case PAGE_EVENT: this.renderRandomEvent(ctx); break
    }

    // 粒子效果
    if (this.particles && !this.particles.finished) {
      this.particles.update()
      this.particles.render(ctx)
    }

    // 底部导航
    const navTabs = [
      { name: 'home', icon: '🏠', label: '首页', onClick: () => this.game.sceneManager.switchTo('home') },
      { name: 'tasks', icon: '📋', label: '任务', onClick: () => this.game.sceneManager.switchTo('tasks') },
      { name: 'games', icon: '🎮', label: '游戏', onClick: () => {} },
      { name: 'shop', icon: '🎁', label: '商城', onClick: () => this.game.sceneManager.switchTo('shop') },
      { name: 'diary', icon: '📖', label: '日记', onClick: () => this.game.sceneManager.switchTo('diary') }
    ]
    const navButtons = drawNavBar(ctx, screenWidth, screenHeight, 'games', navTabs)
    this.buttons.push(...navButtons)
  }

  renderMenu(ctx) {
    const { screenWidth } = this.game
    const cardW = screenWidth - 40
    const cardX = 20

    const games = [
      { name: '🎰 幸运转盘', desc: '转一转，看看今天的运气~', page: PAGE_WHEEL, color: '#FF6B9D' },
      { name: '🎲 骰子挑战', desc: '和主人比点数，输了要接受挑战', page: PAGE_DICE, color: '#C084FC' },
      { name: '💬 真心话大冒险', desc: '真心话还是大冒险？你来选~', page: PAGE_TOD, color: '#FB923C' },
      { name: '🎁 今日随机事件', desc: '看看今天会发生什么有趣的事', page: PAGE_EVENT, color: '#4ADE80' }
    ]

    games.forEach((g, i) => {
      const y = 100 + i * 100

      drawCard(ctx, cardX, y, cardW, 85, 14)

      // 左侧色条
      drawRoundRect(ctx, cardX, y, 6, 85, 3, g.color)

      drawText(ctx, g.name, cardX + 20, y + 18, null, 16, Theme.textPrimary, 'left')
      ctx.font = `bold 16px "PingFang SC", sans-serif`
      drawText(ctx, g.desc, cardX + 20, y + 44, cardW - 40, 12, Theme.textSecondary, 'left')

      // 进入按钮
      const enterBtn = {
        x: cardX + cardW - 70, y: y + 25, width: 55, height: 32,
        text: '开始', color: g.color, fontSize: 13, radius: 8,
        onClick: () => {
          this.page = g.page
          if (g.page === PAGE_EVENT) this.triggerRandomEvent()
        }
      }
      drawButton(ctx, enterBtn)
      this.buttons.push(enterBtn)
    })
  }

  renderWheel(ctx) {
    const { screenWidth, screenHeight } = this.game
    const centerX = screenWidth / 2
    const centerY = 260
    const radius = 110

    const items = DEFAULT_WHEEL_ITEMS

    // 更新转盘角度
    if (this.wheelTween && !this.wheelTween.finished) {
      this.wheelAngle = this.wheelTween.value
    }

    // 绘制转盘
    const slotAngle = (Math.PI * 2) / items.length
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate((this.wheelAngle * Math.PI) / 180)

    items.forEach((item, i) => {
      const startAngle = i * slotAngle
      const endAngle = startAngle + slotAngle

      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.arc(0, 0, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = item.color
      ctx.fill()
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 2
      ctx.stroke()

      // 文字
      ctx.save()
      ctx.rotate(startAngle + slotAngle / 2)
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 11px "PingFang SC", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(item.text, radius * 0.65, 4)
      ctx.restore()
    })

    ctx.restore()

    // 指针
    ctx.beginPath()
    ctx.moveTo(centerX, centerY - radius - 15)
    ctx.lineTo(centerX - 10, centerY - radius + 5)
    ctx.lineTo(centerX + 10, centerY - radius + 5)
    ctx.closePath()
    ctx.fillStyle = '#F43F5E'
    ctx.fill()

    // 中心按钮
    ctx.beginPath()
    ctx.arc(centerX, centerY, 25, 0, Math.PI * 2)
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()
    ctx.strokeStyle = Theme.primary
    ctx.lineWidth = 3
    ctx.stroke()

    ctx.font = 'bold 12px "PingFang SC", sans-serif'
    ctx.fillStyle = Theme.primary
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.wheelSpinning ? '...' : 'GO', centerX, centerY)

    if (!this.wheelSpinning) {
      const spinBtn = {
        x: centerX - 25, y: centerY - 25, width: 50, height: 50,
        onClick: () => this.spinWheel()
      }
      this.buttons.push(spinBtn)
    }

    // 结果显示
    if (this.wheelResult) {
      const resultY = centerY + radius + 40
      drawCard(ctx, 30, resultY, screenWidth - 60, 80, 12)
      drawTitle(ctx, '🎉 结果', screenWidth / 2, resultY + 20, 14, Theme.textPrimary)
      drawText(ctx, this.wheelResult.text, screenWidth / 2, resultY + 42, null, 16, Theme.primary, 'center')
      if (this.wheelResult.points !== 0) {
        const ptText = this.wheelResult.points > 0 ? `+${this.wheelResult.points}积分` : `${this.wheelResult.points}积分`
        drawText(ctx, ptText, screenWidth / 2, resultY + 62, null, 13, this.wheelResult.points > 0 ? Theme.success : Theme.danger, 'center')
      }
    }
  }

  renderDice(ctx) {
    const { screenWidth } = this.game
    const centerX = screenWidth / 2

    drawText(ctx, '各自掷骰子，点数大的一方赢！', centerX, 110, screenWidth - 40, 13, Theme.textSecondary, 'center')

    // 骰子显示
    const diceSize = 70
    const diceEmojis = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

    // 主人骰子
    drawCard(ctx, centerX - diceSize - 20, 160, diceSize, diceSize, 12)
    ctx.font = '40px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.diceValues[0] ? diceEmojis[this.diceValues[0]] : '🎲', centerX - diceSize / 2 - 20, 195)
    drawText(ctx, '👑 主人', centerX - diceSize / 2 - 20, 240, null, 12, Theme.textSecondary, 'center')

    // VS
    drawTitle(ctx, 'VS', centerX, 195, 20, Theme.danger)

    // 小源骰子
    drawCard(ctx, centerX + 20, 160, diceSize, diceSize, 12)
    ctx.font = '40px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.diceValues[1] ? diceEmojis[this.diceValues[1]] : '🎲', centerX + diceSize / 2 + 20, 195)
    drawText(ctx, '🐶 小源', centerX + diceSize / 2 + 20, 240, null, 12, Theme.textSecondary, 'center')

    // 掷骰子按钮
    if (!this.diceRolling) {
      const rollBtn = {
        x: (screenWidth - 160) / 2, y: 280, width: 160, height: 44,
        text: '🎲 掷骰子！', color: Theme.secondary, fontSize: 15,
        onClick: () => this.rollDices()
      }
      drawButton(ctx, rollBtn)
      this.buttons.push(rollBtn)
    }

    // 结果
    if (this.diceResult) {
      const resultY = 350
      drawCard(ctx, 30, resultY, screenWidth - 60, 80, 12)
      drawText(ctx, this.diceResult.text, screenWidth / 2, resultY + 20, screenWidth - 80, 14, Theme.textPrimary, 'center')
      if (this.diceResult.points) {
        const ptText = this.diceResult.points > 0 ? `+${this.diceResult.points}积分` : `${this.diceResult.points}积分`
        drawText(ctx, ptText, screenWidth / 2, resultY + 50, null, 14, this.diceResult.points > 0 ? Theme.success : Theme.danger, 'center')
      }
    }
  }

  renderTruthOrDare(ctx) {
    const { screenWidth } = this.game
    const centerX = screenWidth / 2

    if (!this.todType) {
      // 选择真心话还是大冒险
      drawText(ctx, '选择你的命运~', centerX, 120, null, 14, Theme.textSecondary, 'center')

      const truthBtn = {
        x: 30, y: 170, width: screenWidth / 2 - 40, height: 100,
        text: '💬\n真心话', color: '#FF6B9D', fontSize: 16, radius: 16,
        onClick: () => this.pickTod('truth')
      }
      const dareBtn = {
        x: screenWidth / 2 + 10, y: 170, width: screenWidth / 2 - 40, height: 100,
        text: '🔥\n大冒险', color: '#FB923C', fontSize: 16, radius: 16,
        onClick: () => this.pickTod('dare')
      }

      // 手动绘制（因为需要多行文字）
      drawRoundRect(ctx, truthBtn.x, truthBtn.y, truthBtn.width, truthBtn.height, 16, truthBtn.color)
      ctx.font = '30px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('💬', truthBtn.x + truthBtn.width / 2, truthBtn.y + 38)
      ctx.font = 'bold 16px "PingFang SC", sans-serif'
      ctx.fillStyle = '#FFFFFF'
      ctx.fillText('真心话', truthBtn.x + truthBtn.width / 2, truthBtn.y + 72)
      this.buttons.push(truthBtn)

      drawRoundRect(ctx, dareBtn.x, dareBtn.y, dareBtn.width, dareBtn.height, 16, dareBtn.color)
      ctx.font = '30px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('🔥', dareBtn.x + dareBtn.width / 2, dareBtn.y + 38)
      ctx.font = 'bold 16px "PingFang SC", sans-serif'
      ctx.fillStyle = '#FFFFFF'
      ctx.fillText('大冒险', dareBtn.x + dareBtn.width / 2, dareBtn.y + 72)
      this.buttons.push(dareBtn)

      // 随机选择按钮
      const randomBtn = {
        x: (screenWidth - 180) / 2, y: 300, width: 180, height: 44,
        text: '🎲 随机选择', color: Theme.secondary, fontSize: 14,
        onClick: () => this.pickTod(Math.random() > 0.5 ? 'truth' : 'dare')
      }
      drawButton(ctx, randomBtn)
      this.buttons.push(randomBtn)
    } else {
      // 显示题目
      const typeLabel = this.todType === 'truth' ? '💬 真心话' : '🔥 大冒险'
      const typeColor = this.todType === 'truth' ? '#FF6B9D' : '#FB923C'

      drawRoundRect(ctx, 30, 110, screenWidth - 60, 160, 16, typeColor)
      drawTitle(ctx, typeLabel, centerX, 140, 18, '#FFFFFF')
      drawText(ctx, this.todQuestion, centerX, 170, screenWidth - 80, 15, '#FFFFFF', 'center')

      if (!this.todShowRating) {
        // 换一个按钮
        const rerollBtn = {
          x: (screenWidth - 200) / 2, y: 290, width: 200, height: 40,
          text: '🔄 换一个', color: '#E5E7EB', textColor: Theme.textPrimary, fontSize: 13,
          onClick: () => this.pickTod(this.todType)
        }
        drawButton(ctx, rerollBtn)
        this.buttons.push(rerollBtn)

        // 完成按钮
        const doneBtn = {
          x: (screenWidth - 200) / 2, y: 345, width: 200, height: 40,
          text: '✅ 完成了！请评分', color: Theme.success, fontSize: 13,
          onClick: () => { this.todShowRating = true }
        }
        drawButton(ctx, doneBtn)
        this.buttons.push(doneBtn)
      } else {
        // 评分界面
        drawText(ctx, '对方表现如何？', centerX, 295, null, 14, Theme.textPrimary, 'center')

        TOD_RATINGS.forEach((rating, i) => {
          const btnY = 320 + i * 48
          const ratingBtn = {
            x: 40, y: btnY, width: screenWidth - 80, height: 40,
            text: `${rating.emoji} ${rating.label} (${rating.points > 0 ? '+' : ''}${rating.points}分)`,
            color: rating.points > 0 ? Theme.primary : '#E5E7EB',
            textColor: rating.points > 0 ? Theme.textLight : Theme.textPrimary,
            fontSize: 13, radius: 10,
            onClick: () => this.rateTod(rating.points)
          }
          drawButton(ctx, ratingBtn)
          this.buttons.push(ratingBtn)
        })
      }
    }
  }

  renderRandomEvent(ctx) {
    const { screenWidth } = this.game
    const centerX = screenWidth / 2

    if (!this.randomEvent) {
      drawText(ctx, '加载中...', centerX, 200, null, 14, Theme.textSecondary, 'center')
      return
    }

    const event = this.randomEvent

    // 事件卡片
    drawCard(ctx, 30, 120, screenWidth - 60, 200, 20)

    ctx.font = '50px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(event.icon, centerX, 175)

    drawTitle(ctx, '今日随机事件', centerX, 210, 16, Theme.textSecondary)
    drawText(ctx, event.text, centerX, 240, screenWidth - 100, 15, Theme.textPrimary, 'center')

    if (event.effect !== 'none') {
      drawText(ctx, '✨ 效果已生效！', centerX, 290, null, 13, Theme.success, 'center')
    }

    // 重新抽取（每日限1次，这里简化处理）
    const okBtn = {
      x: (screenWidth - 160) / 2, y: 350, width: 160, height: 44,
      text: '知道了~', color: Theme.primary, fontSize: 14,
      onClick: () => { this.page = PAGE_MENU }
    }
    drawButton(ctx, okBtn)
    this.buttons.push(okBtn)
  }

  // ========== 游戏逻辑 ==========

  spinWheel() {
    if (this.wheelSpinning) return
    this.wheelSpinning = true
    this.wheelResult = null

    const items = DEFAULT_WHEEL_ITEMS
    const targetIndex = randomInt(0, items.length - 1)
    const targetAngle = calculateWheelAngle(items.length, targetIndex)

    this.wheelTween = new Tween(this.wheelAngle, this.wheelAngle + targetAngle, 3000, 'easeOutCubic')

    setTimeout(() => {
      this.wheelSpinning = false
      this.wheelResult = items[targetIndex]
      this.wheelAngle = (this.wheelAngle + targetAngle) % 360

      // 记录积分变化
      this.applyPointsChange(items[targetIndex].points)
      this.particles = new ParticleSystem(this.game.screenWidth / 2, 260)

      this.game.cloud.addGameRecord({
        gameType: 'wheel',
        result: items[targetIndex].text,
        pointsChange: items[targetIndex].points
      })
    }, 3200)
  }

  rollDices() {
    if (this.diceRolling) return
    this.diceRolling = true
    this.diceResult = null

    // 动画效果 - 快速切换数字
    let count = 0
    const interval = setInterval(() => {
      this.diceValues = [rollDice(), rollDice()]
      count++
      if (count >= 15) {
        clearInterval(interval)
        this.diceRolling = false
        this.resolveDice()
      }
    }, 100)
  }

  resolveDice() {
    const [ownerDice, petDice] = this.diceValues

    // 检查特殊事件
    if (ownerDice === petDice) {
      if (ownerDice === 6) {
        this.diceResult = DICE_SPECIAL_EVENTS.DOUBLE_SIX
      } else if (ownerDice === 1) {
        this.diceResult = DICE_SPECIAL_EVENTS.DOUBLE_ONE
      } else {
        this.diceResult = DICE_SPECIAL_EVENTS.DOUBLE_OTHER
      }
    } else if (ownerDice > petDice) {
      this.diceResult = { text: '👑 主人赢了！可以给小源布置一个临时任务~', points: 0 }
    } else {
      this.diceResult = { text: '🐶 小源赢了！获得10积分奖励！', points: 10 }
    }

    this.applyPointsChange(this.diceResult.points || 0)
    if (this.diceResult.points) {
      this.particles = new ParticleSystem(this.game.screenWidth / 2, 350)
    }

    this.game.cloud.addGameRecord({
      gameType: 'dice',
      result: `主人:${ownerDice} vs 小源:${petDice}`,
      pointsChange: this.diceResult.points || 0
    })
  }

  pickTod(type) {
    this.todType = type
    this.todShowRating = false
    this.todQuestion = type === 'truth' ? randomPick(TRUTH_QUESTIONS) : randomPick(DARE_CHALLENGES)
  }

  rateTod(points) {
    this.applyPointsChange(points)
    this.todShowRating = false
    this.todType = null
    this.todQuestion = ''

    if (points > 0) {
      this.particles = new ParticleSystem(this.game.screenWidth / 2, 300)
    }

    this.game.cloud.addGameRecord({
      gameType: 'truth_or_dare',
      result: this.todQuestion,
      pointsChange: points
    })
  }

  triggerRandomEvent() {
    const event = weightedRandom(
      RANDOM_EVENTS.map(e => ({ value: e, weight: e.probability }))
    )
    this.randomEvent = event

    // 处理事件效果
    if (event.effect === 'bonus_points') {
      this.applyPointsChange(event.value || 20)
    } else if (event.effect === 'random_points') {
      const pts = randomInt(10, 50)
      this.applyPointsChange(pts)
      this.randomEvent = { ...event, text: event.text + ` 获得${pts}积分！` }
    }

    this.game.cloud.addGameRecord({
      gameType: 'random_event',
      result: event.text,
      pointsChange: 0
    })
  }

  async applyPointsChange(points) {
    if (points === 0) return
    const pet = this.game.petStatus
    if (!pet) return

    try {
      const newPoints = Math.max(0, (pet.points || 0) + points)
      const newTotal = points > 0 ? (pet.totalPoints || 0) + points : pet.totalPoints
      await this.game.cloud.updatePetStatus(pet._id, {
        points: newPoints,
        totalPoints: newTotal
      })
      this.game.petStatus.points = newPoints
      this.game.petStatus.totalPoints = newTotal
    } catch (e) {
      console.error('积分更新失败:', e)
    }
  }
}
