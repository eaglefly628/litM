/**
 * 成长日记场景 - 每日记录、心情追踪、历史查看
 */

import { Scene } from '../base/scene'
import { Theme, drawRoundRect, drawButton, drawCard, drawTitle, drawText, drawNavBar, drawProgressBar } from '../base/ui'
import { getToday, getWeekDay } from '../utils/date'

const MOODS = [
  { emoji: '😊', label: '开心', color: '#4ADE80' },
  { emoji: '🥰', label: '甜蜜', color: '#FF6B9D' },
  { emoji: '😌', label: '平静', color: '#60A5FA' },
  { emoji: '😐', label: '一般', color: '#FBBF24' },
  { emoji: '😢', label: '难过', color: '#8B5CF6' },
  { emoji: '😤', label: '生气', color: '#F87171' }
]

export class DiaryScene extends Scene {
  constructor(game) {
    super(game)
    this.diaryList = []
    this.todayDiary = null
    this.showHistory = false
  }

  async onEnter() {
    this.showHistory = false
    await this.loadDiary()
  }

  async loadDiary() {
    try {
      const today = getToday()
      this.todayDiary = await this.game.cloud.getDiary(today)
      this.diaryList = await this.game.cloud.getDiaryList(30)
    } catch (e) {
      console.error('加载日记失败:', e)
      this.todayDiary = null
      this.diaryList = []
    }
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
      onClick: () => this.game.sceneManager.switchTo('home')
    }
    drawButton(ctx, backBtn)
    this.buttons.push(backBtn)

    drawTitle(ctx, '📖 成长日记', screenWidth / 2, 48, 18, Theme.textPrimary)

    if (this.showHistory) {
      this.renderHistory(ctx)
    } else {
      this.renderToday(ctx)
    }

    // 底部导航
    const navTabs = [
      { name: 'home', icon: '🏠', label: '首页', onClick: () => this.game.sceneManager.switchTo('home') },
      { name: 'tasks', icon: '📋', label: '任务', onClick: () => this.game.sceneManager.switchTo('tasks') },
      { name: 'games', icon: '🎮', label: '游戏', onClick: () => this.game.sceneManager.switchTo('games') },
      { name: 'shop', icon: '🎁', label: '商城', onClick: () => this.game.sceneManager.switchTo('shop') },
      { name: 'diary', icon: '📖', label: '日记', onClick: () => {} }
    ]
    const navButtons = drawNavBar(ctx, screenWidth, screenHeight, 'diary', navTabs)
    this.buttons.push(...navButtons)
  }

  renderToday(ctx) {
    const { screenWidth } = this.game
    const today = getToday()
    const weekDay = getWeekDay(today)
    const user = this.game.userInfo || {}
    const isOwner = user.role === 'owner'

    // 日期
    drawText(ctx, `${today} ${weekDay}`, screenWidth / 2, 100, null, 13, Theme.textSecondary, 'center')

    // 心情选择（仅小源可选）
    drawCard(ctx, 16, 125, screenWidth - 32, 90, 12)
    drawText(ctx, '今天心情如何？', 32, 138, null, 13, Theme.textPrimary, 'left')

    const moodSize = (screenWidth - 64) / MOODS.length
    MOODS.forEach((mood, i) => {
      const mx = 24 + i * moodSize
      const my = 162
      const isSelected = this.todayDiary && this.todayDiary.mood === mood.label

      if (isSelected) {
        drawRoundRect(ctx, mx - 2, my - 2, moodSize - 8, 38, 8, mood.color + '30')
      }

      ctx.font = '22px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(mood.emoji, mx + (moodSize - 8) / 2, my + 16)

      ctx.font = '9px "PingFang SC", sans-serif'
      ctx.fillStyle = isSelected ? mood.color : Theme.textSecondary
      ctx.fillText(mood.label, mx + (moodSize - 8) / 2, my + 32)

      if (!isOwner) {
        const moodBtn = {
          x: mx, y: my, width: moodSize - 8, height: 36,
          onClick: () => this.selectMood(mood.label)
        }
        this.buttons.push(moodBtn)
      }
    })

    // 饮食记录
    drawCard(ctx, 16, 230, screenWidth - 32, 100, 12)
    drawText(ctx, '🍽️ 今日饮食', 32, 245, null, 14, Theme.textPrimary, 'left')

    const meals = ['早餐', '午餐', '晚餐']
    const mealIcons = ['🥣', '🍱', '🍽️']
    const mealLog = (this.todayDiary && this.todayDiary.mealLog) || {}

    meals.forEach((meal, i) => {
      const mx = 32 + i * ((screenWidth - 64) / 3)
      const my = 270
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(mealIcons[i], mx + 30, my + 5)
      drawText(ctx, meal, mx + 30, my + 14, null, 11, Theme.textSecondary, 'center')
      drawText(ctx, mealLog[meal] || '未记录', mx + 30, my + 30, 70, 10, mealLog[meal] ? Theme.success : '#CBD5E1', 'center')
    })

    // 主人留言区（仅主人可写）
    const commentY = 345
    drawCard(ctx, 16, commentY, screenWidth - 32, 80, 12)
    drawText(ctx, '👑 主人留言', 32, commentY + 15, null, 13, Theme.textPrimary, 'left')

    const comment = (this.todayDiary && this.todayDiary.ownerComment) || ''
    drawText(ctx, comment || '暂无留言~', 32, commentY + 38, screenWidth - 64, 12, comment ? Theme.textPrimary : '#CBD5E1', 'left')

    if (isOwner) {
      const commentBtn = {
        x: screenWidth - 85, y: commentY + 8, width: 60, height: 28,
        text: '写留言', color: Theme.primary, fontSize: 11, radius: 8,
        onClick: () => this.writeComment()
      }
      drawButton(ctx, commentBtn)
      this.buttons.push(commentBtn)
    }

    // 写日记按钮（仅小源）
    if (!isOwner) {
      const writeBtn = {
        x: 16, y: 440, width: screenWidth - 32, height: 44,
        text: '✏️ 写今日日记', color: Theme.primary, fontSize: 14,
        onClick: () => this.writeDiary()
      }
      drawButton(ctx, writeBtn)
      this.buttons.push(writeBtn)
    }

    // 查看历史按钮
    const histBtn = {
      x: 16, y: isOwner ? 440 : 500, width: screenWidth - 32, height: 40,
      text: '📅 查看历史日记', color: '#E5E7EB', textColor: Theme.textSecondary, fontSize: 13,
      onClick: () => { this.showHistory = true }
    }
    drawButton(ctx, histBtn)
    this.buttons.push(histBtn)
  }

  renderHistory(ctx) {
    const { screenWidth, screenHeight } = this.game

    // 返回今天
    const todayBtn = {
      x: screenWidth - 85, y: 86, width: 70, height: 28,
      text: '← 今天', color: Theme.primary, fontSize: 11, radius: 8,
      onClick: () => { this.showHistory = false }
    }
    drawButton(ctx, todayBtn)
    this.buttons.push(todayBtn)

    drawText(ctx, '最近30天', 32, 95, null, 13, Theme.textSecondary, 'left')

    let listY = 125

    if (this.diaryList.length === 0) {
      drawText(ctx, '还没有日记记录哦~', screenWidth / 2, 200, null, 14, '#CBD5E1', 'center')
      return
    }

    for (let i = 0; i < this.diaryList.length && listY < screenHeight - 100; i++) {
      const diary = this.diaryList[i]
      const cardH = 70

      drawCard(ctx, 16, listY, screenWidth - 32, cardH, 10)

      // 日期
      drawText(ctx, diary.date, 32, listY + 12, null, 12, Theme.textSecondary, 'left')
      drawText(ctx, getWeekDay(diary.date), 120, listY + 12, null, 12, Theme.textSecondary, 'left')

      // 心情
      const mood = MOODS.find(m => m.label === diary.mood)
      if (mood) {
        ctx.font = '18px sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(mood.emoji, screenWidth - 60, listY + 22)
      }

      // 摘要
      const summary = diary.taskSummary || diary.highlights || '无记录'
      drawText(ctx, summary, 32, listY + 36, screenWidth - 80, 11, Theme.textPrimary, 'left')

      listY += cardH + 8
    }
  }

  async selectMood(moodLabel) {
    const today = getToday()
    const diaryData = {
      date: today,
      mood: moodLabel,
      mealLog: (this.todayDiary && this.todayDiary.mealLog) || {},
      taskSummary: '',
      highlights: '',
      ownerComment: (this.todayDiary && this.todayDiary.ownerComment) || ''
    }

    try {
      await this.game.cloud.saveDiary(diaryData)
      this.todayDiary = diaryData
    } catch (e) {
      console.error('保存心情失败:', e)
    }
  }

  writeDiary() {
    wx.showModal({
      title: '写日记',
      editable: true,
      placeholderText: '记录今天的点滴...',
      success: async (res) => {
        if (res.confirm && res.content) {
          const today = getToday()
          const diaryData = {
            date: today,
            mood: (this.todayDiary && this.todayDiary.mood) || 'normal',
            mealLog: (this.todayDiary && this.todayDiary.mealLog) || {},
            taskSummary: '',
            highlights: res.content,
            ownerComment: (this.todayDiary && this.todayDiary.ownerComment) || ''
          }

          try {
            await this.game.cloud.saveDiary(diaryData)
            this.todayDiary = diaryData
          } catch (e) {
            console.error('保存日记失败:', e)
          }
        }
      }
    })
  }

  writeComment() {
    wx.showModal({
      title: '主人留言',
      editable: true,
      placeholderText: '给小源写一句话吧~',
      success: async (res) => {
        if (res.confirm && res.content) {
          const today = getToday()
          const diaryData = {
            date: today,
            mood: (this.todayDiary && this.todayDiary.mood) || '',
            mealLog: (this.todayDiary && this.todayDiary.mealLog) || {},
            taskSummary: (this.todayDiary && this.todayDiary.taskSummary) || '',
            highlights: (this.todayDiary && this.todayDiary.highlights) || '',
            ownerComment: res.content
          }

          try {
            await this.game.cloud.saveDiary(diaryData)
            this.todayDiary = diaryData
          } catch (e) {
            console.error('保存留言失败:', e)
          }
        }
      }
    })
  }
}
