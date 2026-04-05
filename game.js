/**
 * 小源养成记 - 游戏入口
 * 微信小游戏主入口文件
 */

import { SceneManager } from './js/base/scene'
import { CloudManager } from './js/base/cloud'
import { StorageManager } from './js/base/storage'
import { LoginScene } from './js/scenes/login'
import { HomeScene } from './js/scenes/home'
import { TasksScene } from './js/scenes/tasks'
import { GamesScene } from './js/scenes/games'
import { ShopScene } from './js/scenes/shop'
import { DiaryScene } from './js/scenes/diary'

const canvas = wx.createCanvas()
const ctx = canvas.getContext('2d')

const screenWidth = canvas.width
const screenHeight = canvas.height

// 设备像素比
const dpr = wx.getWindowInfo().pixelRatio || 2

class Game {
  constructor() {
    this.canvas = canvas
    this.ctx = ctx
    this.screenWidth = screenWidth
    this.screenHeight = screenHeight
    this.dpr = dpr

    this.sceneManager = new SceneManager(this)
    this.cloud = new CloudManager()
    this.storage = new StorageManager()

    // 当前用户信息
    this.userInfo = null
    this.partnerInfo = null
    this.petStatus = null

    this.touchHandler = this.onTouchStart.bind(this)
    this.touchEndHandler = this.onTouchEnd.bind(this)

    this.init()
  }

  async init() {
    // 初始化云开发
    await this.cloud.init()

    // 注册场景
    this.sceneManager.register('login', new LoginScene(this))
    this.sceneManager.register('home', new HomeScene(this))
    this.sceneManager.register('tasks', new TasksScene(this))
    this.sceneManager.register('games', new GamesScene(this))
    this.sceneManager.register('shop', new ShopScene(this))
    this.sceneManager.register('diary', new DiaryScene(this))

    // 绑定触摸事件
    canvas.addEventListener('touchstart', this.touchHandler)
    canvas.addEventListener('touchend', this.touchEndHandler)

    // 尝试自动登录
    const savedUser = this.storage.get('userInfo')
    if (savedUser && savedUser.role) {
      this.userInfo = savedUser
      await this.loadGameData()
      this.sceneManager.switchTo('home')
    } else {
      this.sceneManager.switchTo('login')
    }

    // 启动游戏循环
    this.loop()
  }

  async loadGameData() {
    try {
      // 加载宠物状态
      const petData = await this.cloud.getPetStatus()
      if (petData) {
        this.petStatus = petData
      }
      // 加载配对信息
      if (this.userInfo.partnerId) {
        const partner = await this.cloud.getPartnerInfo(this.userInfo.partnerId)
        if (partner) {
          this.partnerInfo = partner
        }
      }
    } catch (e) {
      console.error('加载游戏数据失败:', e)
    }
  }

  onTouchStart(e) {
    const touch = e.touches[0]
    const x = touch.clientX
    const y = touch.clientY
    this.sceneManager.onTouchStart(x, y)
  }

  onTouchEnd(e) {
    const touch = e.changedTouches[0]
    const x = touch.clientX
    const y = touch.clientY
    this.sceneManager.onTouchEnd(x, y)
  }

  loop() {
    ctx.clearRect(0, 0, screenWidth, screenHeight)
    this.sceneManager.render(ctx)
    requestAnimationFrame(this.loop.bind(this))
  }
}

// 启动游戏
new Game()
