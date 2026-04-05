/**
 * 每日任务场景 - 任务列表、打卡、主人确认
 */

import { Scene } from '../base/scene'
import { Theme, drawRoundRect, drawButton, drawCard, drawTitle, drawText, drawNavBar, drawBadge, drawProgressBar } from '../base/ui'
import { PRESET_TASKS, TASK_STATUS } from '../config/tasks-config'
import { getToday, formatTime, isInTimeRange } from '../utils/date'

export class TasksScene extends Scene {
  constructor(game) {
    super(game)
    this.tasks = []
    this.scrollY = 0
    this.showDetail = null  // 当前查看详情的任务
    this.showCreateForm = false
    this.todayDate = getToday()
  }

  async onEnter(data = {}) {
    this.todayDate = getToday()
    this.scrollY = 0
    this.showDetail = null
    this.showCreateForm = data.tab === 'create'
    await this.loadTasks()
  }

  async loadTasks() {
    try {
      const dailyData = await this.game.cloud.getDailyTasks(this.todayDate)
      if (dailyData) {
        this.tasks = dailyData.tasks
        this.taskDocId = dailyData._id
      } else {
        // 自动生成今日任务
        this.tasks = PRESET_TASKS.map(t => ({
          ...t,
          status: TASK_STATUS.PENDING,
          detail: '',
          completedAt: '',
          verifiedBy: ''
        }))
        // 保存到云端
        this.taskDocId = await this.game.cloud.createDailyTasks({
          date: this.todayDate,
          tasks: this.tasks,
          totalEarned: 0,
          totalLost: 0
        })
      }
    } catch (e) {
      console.error('加载任务失败:', e)
      // 离线模式
      this.tasks = PRESET_TASKS.map(t => ({
        ...t,
        status: TASK_STATUS.PENDING,
        detail: '',
        completedAt: '',
        verifiedBy: ''
      }))
    }
  }

  render(ctx) {
    const { screenWidth, screenHeight } = this.game
    const user = this.game.userInfo || {}
    const isOwner = user.role === 'owner'
    this.buttons = []

    // 背景
    ctx.fillStyle = '#F9FAFB'
    ctx.fillRect(0, 0, screenWidth, screenHeight)

    // 顶部栏
    drawRoundRect(ctx, 0, 0, screenWidth, 90, 0, '#FFFFFF')
    const backBtn = {
      x: 10, y: 35, width: 50, height: 35,
      text: '← 返回', color: 'transparent', textColor: Theme.primary, fontSize: 13,
      onClick: () => this.game.sceneManager.switchTo('home')
    }
    drawButton(ctx, backBtn)
    this.buttons.push(backBtn)

    drawTitle(ctx, '📋 每日任务', screenWidth / 2, 52, 18, Theme.textPrimary)
    drawText(ctx, this.todayDate, screenWidth / 2, 75, null, 11, Theme.textSecondary, 'center')

    // 进度概览
    const completed = this.tasks.filter(t => t.status === TASK_STATUS.DONE).length
    const total = this.tasks.length
    const progress = total > 0 ? completed / total : 0

    drawCard(ctx, 16, 100, screenWidth - 32, 60, 12)
    drawText(ctx, `今日进度: ${completed}/${total}`, 32, 112, null, 13, Theme.textPrimary, 'left')
    drawProgressBar(ctx, 32, 136, screenWidth - 64, 10, progress, Theme.primary)

    // 任务列表
    let listY = 175
    const cardPadding = 16
    const cardWidth = screenWidth - cardPadding * 2

    for (let i = 0; i < this.tasks.length; i++) {
      const task = this.tasks[i]
      const cardHeight = 72
      const cardY = listY + i * (cardHeight + 8)

      // 超出屏幕不渲染
      if (cardY > screenHeight - 60) break

      drawCard(ctx, cardPadding, cardY, cardWidth, cardHeight, 10)

      // 任务图标
      ctx.font = '24px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(task.icon || '📌', cardPadding + 14, cardY + 30)

      // 任务名称
      const nameColor = task.status === TASK_STATUS.DONE ? Theme.success :
                        task.status === TASK_STATUS.MISSED ? Theme.danger : Theme.textPrimary
      drawText(ctx, task.name, cardPadding + 48, cardY + 14, null, 14, nameColor, 'left')

      // 积分标签
      drawText(ctx, `+${task.points}分`, cardPadding + 48, cardY + 36, null, 11, Theme.accent, 'left')

      // 时间提示
      if (task.timeStart && task.timeEnd) {
        drawText(ctx, `${task.timeStart}-${task.timeEnd}`, cardPadding + 120, cardY + 36, null, 11, Theme.textSecondary, 'left')
      }

      // 状态标签和操作按钮
      const btnX = cardPadding + cardWidth - 80
      const btnY = cardY + 16

      if (task.status === TASK_STATUS.DONE) {
        drawBadge(ctx, btnX, btnY, '已完成', Theme.success)
      } else if (task.status === TASK_STATUS.SUBMITTED) {
        if (isOwner) {
          // 主人可以确认
          const verifyBtn = {
            x: btnX - 10, y: btnY, width: 70, height: 30,
            text: '✅ 确认', color: Theme.success, fontSize: 12, radius: 8,
            onClick: () => this.verifyTask(i)
          }
          drawButton(ctx, verifyBtn)
          this.buttons.push(verifyBtn)
        } else {
          drawBadge(ctx, btnX, btnY, '待确认', Theme.warning)
        }
      } else if (task.status === TASK_STATUS.MISSED) {
        drawBadge(ctx, btnX, btnY, '已过期', Theme.danger)
      } else {
        // 待完成 - 小源可以打卡
        if (!isOwner) {
          const checkBtn = {
            x: btnX - 10, y: btnY, width: 70, height: 30,
            text: '打卡', color: Theme.primary, fontSize: 12, radius: 8,
            onClick: () => this.checkInTask(i)
          }
          drawButton(ctx, checkBtn)
          this.buttons.push(checkBtn)
        } else {
          drawBadge(ctx, btnX, btnY, '待完成', '#E5E7EB')
        }
      }
    }

    // 主人创建任务按钮
    if (isOwner) {
      const createBtn = {
        x: screenWidth - 70, y: screenHeight - 130, width: 54, height: 54,
        text: '+', color: Theme.primary, fontSize: 28, radius: 27,
        onClick: () => this.onCreateTask()
      }
      drawButton(ctx, createBtn)
      this.buttons.push(createBtn)
    }

    // 底部导航
    const navTabs = [
      { name: 'home', icon: '🏠', label: '首页', onClick: () => this.game.sceneManager.switchTo('home') },
      { name: 'tasks', icon: '📋', label: '任务', onClick: () => {} },
      { name: 'games', icon: '🎮', label: '游戏', onClick: () => this.game.sceneManager.switchTo('games') },
      { name: 'shop', icon: '🎁', label: '商城', onClick: () => this.game.sceneManager.switchTo('shop') },
      { name: 'diary', icon: '📖', label: '日记', onClick: () => this.game.sceneManager.switchTo('diary') }
    ]
    const navButtons = drawNavBar(ctx, screenWidth, screenHeight, 'tasks', navTabs)
    this.buttons.push(...navButtons)
  }

  async checkInTask(index) {
    const task = this.tasks[index]
    if (task.status !== TASK_STATUS.PENDING) return

    task.status = TASK_STATUS.SUBMITTED
    task.completedAt = new Date().toISOString()

    // 弹出输入（使用微信原生输入）
    try {
      const res = await new Promise((resolve) => {
        wx.showModal({
          title: `打卡: ${task.name}`,
          editable: true,
          placeholderText: '记录一下吧~（如吃了什么）',
          success: (r) => resolve(r)
        })
      })
      if (res.confirm) {
        task.detail = res.content || ''
      } else {
        task.status = TASK_STATUS.PENDING
        task.completedAt = ''
        return
      }
    } catch (e) {
      // 如果不支持editable，直接提交
      task.detail = ''
    }

    // 同步到云端
    try {
      await this.game.cloud.updateDailyTasks(this.taskDocId, {
        tasks: this.tasks
      })
    } catch (e) {
      console.error('同步打卡失败:', e)
    }
  }

  async verifyTask(index) {
    const task = this.tasks[index]
    if (task.status !== TASK_STATUS.SUBMITTED) return

    task.status = TASK_STATUS.DONE
    task.verifiedBy = 'owner'

    // 增加积分
    try {
      const pet = this.game.petStatus
      if (pet) {
        const newPoints = (pet.points || 0) + task.points
        const newTotalPoints = (pet.totalPoints || 0) + task.points
        const newExp = (pet.exp || 0) + Math.floor(task.points / 10)

        await this.game.cloud.updatePetStatus(pet._id, {
          points: newPoints,
          totalPoints: newTotalPoints,
          exp: newExp
        })
        this.game.petStatus.points = newPoints
        this.game.petStatus.totalPoints = newTotalPoints
        this.game.petStatus.exp = newExp
      }

      await this.game.cloud.updateDailyTasks(this.taskDocId, {
        tasks: this.tasks
      })
    } catch (e) {
      console.error('确认任务失败:', e)
    }
  }

  onCreateTask() {
    // 使用微信原生弹窗创建任务
    wx.showModal({
      title: '创建新任务',
      editable: true,
      placeholderText: '输入任务名称',
      success: async (res) => {
        if (res.confirm && res.content) {
          const newTask = {
            id: 'custom_' + Date.now(),
            name: res.content,
            type: 'custom',
            points: 15,
            icon: '⭐',
            status: TASK_STATUS.PENDING,
            detail: '',
            completedAt: '',
            verifiedBy: ''
          }
          this.tasks.push(newTask)

          try {
            await this.game.cloud.updateDailyTasks(this.taskDocId, {
              tasks: this.tasks
            })
          } catch (e) {
            console.error('创建任务失败:', e)
          }
        }
      }
    })
  }
}
