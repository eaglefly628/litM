/**
 * 登录场景 - 微信登录、角色选择、配对码输入
 */

import { Scene } from '../base/scene'
import { Theme, drawRoundRect, drawButton, drawCard, drawTitle, drawText, drawAvatar, drawModal } from '../base/ui'

// 登录子页面状态
const PAGE_LOADING = 'loading'
const PAGE_ROLE_SELECT = 'role_select'
const PAGE_BIND_CODE = 'bind_code'
const PAGE_ENTER_CODE = 'enter_code'

export class LoginScene extends Scene {
  constructor(game) {
    super(game)
    this.page = PAGE_LOADING
    this.bindCode = ''
    this.inputCode = ''
    this.errorMsg = ''
    this.loginData = null
  }

  async onEnter() {
    this.page = PAGE_LOADING
    this.buttons = []
    this.errorMsg = ''

    try {
      // 调用云函数登录
      const result = await this.game.cloud.login()
      this.loginData = result

      if (result && !result.data.isNew && result.data.user.role) {
        // 已有用户，直接进入主页
        this.game.userInfo = result.data.user
        this.game.petStatus = result.data.petStatus
        this.game.storage.set('userInfo', result.data.user)
        this.game.sceneManager.switchTo('home')
        return
      }

      // 新用户，显示角色选择
      this.page = PAGE_ROLE_SELECT
    } catch (e) {
      console.error('登录失败:', e)
      // 降级到离线角色选择
      this.page = PAGE_ROLE_SELECT
    }
  }

  render(ctx) {
    const { screenWidth, screenHeight } = this.game
    this.buttons = []

    // 背景渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, screenHeight)
    gradient.addColorStop(0, '#FDE8EE')
    gradient.addColorStop(1, '#E8D5F5')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, screenWidth, screenHeight)

    switch (this.page) {
      case PAGE_LOADING:
        this.renderLoading(ctx)
        break
      case PAGE_ROLE_SELECT:
        this.renderRoleSelect(ctx)
        break
      case PAGE_BIND_CODE:
        this.renderBindCode(ctx)
        break
      case PAGE_ENTER_CODE:
        this.renderEnterCode(ctx)
        break
    }
  }

  renderLoading(ctx) {
    const { screenWidth, screenHeight } = this.game
    drawAvatar(ctx, screenWidth / 2, screenHeight / 2 - 60, 50, '🐶')
    drawTitle(ctx, '小源养成记', screenWidth / 2, screenHeight / 2 + 20, 28, Theme.primary)
    drawText(ctx, '正在登录中...', screenWidth / 2, screenHeight / 2 + 55, null, 14, Theme.textSecondary, 'center')
  }

  renderRoleSelect(ctx) {
    const { screenWidth, screenHeight } = this.game
    const centerX = screenWidth / 2

    // 标题区
    drawAvatar(ctx, centerX, 120, 45, '🐶')
    drawTitle(ctx, '小源养成记', centerX, 190, 26, Theme.primary)
    drawText(ctx, '选择你的角色开始游戏吧~', centerX, 225, null, 14, Theme.textSecondary, 'center')

    // 角色卡片 - 主人
    const cardWidth = screenWidth * 0.7
    const cardX = (screenWidth - cardWidth) / 2

    drawCard(ctx, cardX, 280, cardWidth, 120, 16)
    ctx.font = '36px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('👑', cardX + 40, 340)
    drawTitle(ctx, '主人', cardX + cardWidth / 2 + 20, 310, 20, Theme.textPrimary)
    drawText(ctx, '管理任务、设置奖惩、守护小源', cardX + cardWidth / 2 + 20, 340, cardWidth - 100, 12, Theme.textSecondary, 'center')

    const ownerBtn = {
      x: cardX, y: 280, width: cardWidth, height: 120,
      onClick: () => this.selectRole('owner')
    }
    this.buttons.push(ownerBtn)

    // 角色卡片 - 小源
    drawCard(ctx, cardX, 420, cardWidth, 120, 16)
    ctx.font = '36px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('🐶', cardX + 40, 480)
    drawTitle(ctx, '小源', cardX + cardWidth / 2 + 20, 450, 20, Theme.textPrimary)
    drawText(ctx, '完成任务、获取积分、快乐成长', cardX + cardWidth / 2 + 20, 480, cardWidth - 100, 12, Theme.textSecondary, 'center')

    const petBtn = {
      x: cardX, y: 420, width: cardWidth, height: 120,
      onClick: () => this.selectRole('pet')
    }
    this.buttons.push(petBtn)
  }

  renderBindCode(ctx) {
    const { screenWidth, screenHeight } = this.game
    const centerX = screenWidth / 2

    drawTitle(ctx, '你的配对码', centerX, 150, 22, Theme.textPrimary)
    drawText(ctx, '把这个配对码发给对方\n对方输入后即可配对成功', centerX, 185, screenWidth * 0.7, 14, Theme.textSecondary, 'center')

    // 配对码显示
    const codeWidth = screenWidth * 0.6
    const codeX = (screenWidth - codeWidth) / 2
    drawCard(ctx, codeX, 250, codeWidth, 70, 16)
    ctx.font = 'bold 32px monospace'
    ctx.fillStyle = Theme.primary
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.bindCode, centerX, 285)

    // 我要输入配对码按钮
    const enterBtn = {
      x: (screenWidth - 200) / 2, y: 370, width: 200, height: 44,
      text: '我要输入配对码', color: Theme.secondary,
      onClick: () => { this.page = PAGE_ENTER_CODE }
    }
    drawButton(ctx, enterBtn)
    this.buttons.push(enterBtn)

    // 跳过，稍后配对
    const skipBtn = {
      x: (screenWidth - 200) / 2, y: 430, width: 200, height: 44,
      text: '跳过，稍后配对', color: '#E5E7EB', textColor: Theme.textSecondary,
      onClick: () => this.skipBinding()
    }
    drawButton(ctx, skipBtn)
    this.buttons.push(skipBtn)
  }

  renderEnterCode(ctx) {
    const { screenWidth, screenHeight } = this.game
    const centerX = screenWidth / 2

    drawTitle(ctx, '输入配对码', centerX, 150, 22, Theme.textPrimary)
    drawText(ctx, '输入对方给你的6位配对码', centerX, 185, null, 14, Theme.textSecondary, 'center')

    // 输入框显示
    const inputWidth = screenWidth * 0.6
    const inputX = (screenWidth - inputWidth) / 2
    drawCard(ctx, inputX, 230, inputWidth, 60, 12)

    ctx.font = 'bold 28px monospace'
    ctx.fillStyle = this.inputCode ? Theme.textPrimary : '#CBD5E1'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.inputCode || '______', centerX, 260)

    // 错误信息
    if (this.errorMsg) {
      drawText(ctx, this.errorMsg, centerX, 305, null, 12, Theme.danger, 'center')
    }

    // 数字键盘 (0-9)
    const keySize = 55
    const keyGap = 10
    const keyboardWidth = 3 * keySize + 2 * keyGap
    const keyboardX = (screenWidth - keyboardWidth) / 2
    let keyY = 330

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        let num
        if (row < 3) {
          num = row * 3 + col + 1
        } else {
          if (col === 0) { num = 'back'; }
          else if (col === 1) { num = 0; }
          else { num = 'ok'; }
        }

        const kx = keyboardX + col * (keySize + keyGap)
        const ky = keyY + row * (keySize + keyGap)

        const isSpecial = num === 'back' || num === 'ok'
        const btnColor = num === 'ok' ? Theme.primary : '#F3F4F6'
        const txtColor = num === 'ok' ? Theme.textLight : Theme.textPrimary

        const keyBtn = {
          x: kx, y: ky, width: keySize, height: keySize,
          text: num === 'back' ? '←' : num === 'ok' ? '✓' : String(num),
          color: btnColor, textColor: txtColor, fontSize: 20, radius: 10,
          onClick: () => this.onKeyPress(num)
        }
        drawButton(ctx, keyBtn)
        this.buttons.push(keyBtn)
      }
    }

    // 返回按钮
    const backBtn = {
      x: (screenWidth - 200) / 2, y: keyY + 4 * (keySize + keyGap) + 10, width: 200, height: 40,
      text: '返回', color: '#E5E7EB', textColor: Theme.textSecondary, fontSize: 14,
      onClick: () => { this.page = PAGE_BIND_CODE }
    }
    drawButton(ctx, backBtn)
    this.buttons.push(backBtn)
  }

  onKeyPress(key) {
    if (key === 'back') {
      this.inputCode = this.inputCode.slice(0, -1)
      this.errorMsg = ''
    } else if (key === 'ok') {
      this.submitCode()
    } else {
      if (this.inputCode.length < 6) {
        this.inputCode += String(key)
        this.errorMsg = ''
      }
    }
  }

  async selectRole(role) {
    const code = this.generateBindCode()
    this.bindCode = code

    try {
      // 创建用户记录
      const userId = await this.game.cloud.createUser({
        nickname: role === 'owner' ? '主人' : '小源',
        avatar: '',
        role,
        bindCode: code,
        partnerId: ''
      })

      // 如果是小源角色，创建宠物状态
      if (role === 'pet') {
        await this.game.cloud.createPetStatus({
          petOpenid: '', // 会自动填充_openid
          level: 1,
          exp: 0,
          points: 100,
          totalPoints: 100,
          mood: 'happy',
          affection: 50,
          title: '初来乍到的小狗',
          appearance: 'default',
          streak: 0,
          lastCheckIn: ''
        })
      }

      this.game.userInfo = { role, bindCode: code, _id: userId }
      this.game.storage.set('userInfo', this.game.userInfo)
    } catch (e) {
      console.error('创建角色失败:', e)
      // 离线模式
      this.game.userInfo = { role, bindCode: code }
      this.game.storage.set('userInfo', this.game.userInfo)
    }

    this.page = PAGE_BIND_CODE
  }

  async submitCode() {
    if (this.inputCode.length !== 6) {
      this.errorMsg = '请输入6位配对码'
      return
    }

    try {
      const partner = await this.game.cloud.findUserByBindCode(this.inputCode)
      if (!partner) {
        this.errorMsg = '配对码无效，请检查后重试'
        return
      }

      if (partner.role === this.game.userInfo.role) {
        this.errorMsg = '不能和相同角色配对哦'
        return
      }

      // 双向绑定
      await this.game.cloud.bindPartner(this.game.userInfo._id, partner._openid)
      await this.game.cloud.updateUser(partner._id, { partnerId: this.game.userInfo._openid || '' })

      this.game.userInfo.partnerId = partner._openid
      this.game.partnerInfo = partner
      this.game.storage.set('userInfo', this.game.userInfo)

      // 进入主页
      this.game.sceneManager.switchTo('home')
    } catch (e) {
      console.error('配对失败:', e)
      this.errorMsg = '配对失败，请重试'
    }
  }

  skipBinding() {
    this.game.sceneManager.switchTo('home')
  }

  generateBindCode() {
    return String(Math.floor(100000 + Math.random() * 900000))
  }
}
