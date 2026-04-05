/**
 * UI组件系统 - 提供按钮、弹窗、进度条等常用UI组件的绘制方法
 */

// 颜色主题
export const Theme = {
  primary: '#FF6B9D',      // 粉色主题色
  secondary: '#C084FC',    // 紫色次要色
  accent: '#FB923C',       // 橙色强调色
  success: '#4ADE80',      // 绿色成功
  warning: '#FBBF24',      // 黄色警告
  danger: '#F87171',       // 红色危险
  bg: '#FFF5F7',           // 浅粉背景
  bgCard: '#FFFFFF',       // 卡片背景
  textPrimary: '#1F2937',  // 主文字
  textSecondary: '#6B7280', // 次要文字
  textLight: '#FFFFFF',     // 白色文字
  border: '#E5E7EB',       // 边框色
  shadow: 'rgba(0,0,0,0.08)' // 阴影色
}

/**
 * 绘制圆角矩形
 */
export function drawRoundRect(ctx, x, y, width, height, radius, fillColor, strokeColor) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.arcTo(x + width, y, x + width, y + radius, radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius)
  ctx.lineTo(x + radius, y + height)
  ctx.arcTo(x, y + height, x, y + height - radius, radius)
  ctx.lineTo(x, y + radius)
  ctx.arcTo(x, y, x + radius, y, radius)
  ctx.closePath()

  if (fillColor) {
    ctx.fillStyle = fillColor
    ctx.fill()
  }
  if (strokeColor) {
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = 1
    ctx.stroke()
  }
}

/**
 * 绘制按钮
 */
export function drawButton(ctx, btn) {
  const { x, y, width, height, text, color = Theme.primary, textColor = Theme.textLight, fontSize = 16, radius = 12 } = btn

  // 按钮背景
  drawRoundRect(ctx, x, y, width, height, radius, color)

  // 按钮文字
  ctx.fillStyle = textColor
  ctx.font = `bold ${fontSize}px "PingFang SC", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + width / 2, y + height / 2)
}

/**
 * 绘制卡片
 */
export function drawCard(ctx, x, y, width, height, radius = 16) {
  // 阴影效果
  ctx.shadowColor = Theme.shadow
  ctx.shadowBlur = 12
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 4
  drawRoundRect(ctx, x, y, width, height, radius, Theme.bgCard)
  // 重置阴影
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
}

/**
 * 绘制进度条
 */
export function drawProgressBar(ctx, x, y, width, height, progress, color = Theme.primary, bgColor = '#E5E7EB') {
  const radius = height / 2
  // 背景
  drawRoundRect(ctx, x, y, width, height, radius, bgColor)
  // 进度
  const progressWidth = Math.max(height, width * Math.min(1, Math.max(0, progress)))
  drawRoundRect(ctx, x, y, progressWidth, height, radius, color)
}

/**
 * 绘制文本（支持自动换行）
 */
export function drawText(ctx, text, x, y, maxWidth, fontSize = 14, color = Theme.textPrimary, align = 'left') {
  ctx.fillStyle = color
  ctx.font = `${fontSize}px "PingFang SC", sans-serif`
  ctx.textAlign = align
  ctx.textBaseline = 'top'

  if (!maxWidth) {
    ctx.fillText(text, x, y)
    return y + fontSize + 4
  }

  const words = text.split('')
  let line = ''
  let currentY = y

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i]
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line, x, currentY)
      line = words[i]
      currentY += fontSize + 6
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, x, currentY)
  return currentY + fontSize + 4
}

/**
 * 绘制标题
 */
export function drawTitle(ctx, text, x, y, fontSize = 22, color = Theme.textPrimary) {
  ctx.fillStyle = color
  ctx.font = `bold ${fontSize}px "PingFang SC", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y)
}

/**
 * 绘制圆形头像占位
 */
export function drawAvatar(ctx, x, y, radius, emoji = '🐶') {
  // 圆形背景
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fillStyle = '#FDE8EE'
  ctx.fill()
  ctx.strokeStyle = Theme.primary
  ctx.lineWidth = 2
  ctx.stroke()

  // emoji
  ctx.font = `${radius}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(emoji, x, y)
}

/**
 * 绘制底部导航栏
 */
export function drawNavBar(ctx, screenWidth, screenHeight, activeTab, tabs) {
  const navHeight = 60
  const navY = screenHeight - navHeight

  // 导航背景
  drawRoundRect(ctx, 0, navY, screenWidth, navHeight, 0, '#FFFFFF', '#E5E7EB')

  const tabWidth = screenWidth / tabs.length
  const navButtons = []

  tabs.forEach((tab, i) => {
    const tabX = i * tabWidth
    const isActive = tab.name === activeTab

    // 图标emoji
    ctx.font = '22px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(tab.icon, tabX + tabWidth / 2, navY + 22)

    // 标签文字
    ctx.font = `${isActive ? 'bold ' : ''}10px "PingFang SC", sans-serif`
    ctx.fillStyle = isActive ? Theme.primary : Theme.textSecondary
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(tab.label, tabX + tabWidth / 2, navY + 45)

    navButtons.push({
      x: tabX, y: navY, width: tabWidth, height: navHeight,
      name: tab.name,
      onClick: tab.onClick
    })
  })

  return navButtons
}

/**
 * 绘制弹窗
 */
export function drawModal(ctx, screenWidth, screenHeight, title, content, buttons = []) {
  // 半透明遮罩
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.fillRect(0, 0, screenWidth, screenHeight)

  // 弹窗卡片
  const modalWidth = screenWidth * 0.8
  const modalHeight = 240
  const modalX = (screenWidth - modalWidth) / 2
  const modalY = (screenHeight - modalHeight) / 2

  drawCard(ctx, modalX, modalY, modalWidth, modalHeight, 20)

  // 标题
  drawTitle(ctx, title, screenWidth / 2, modalY + 35, 18)

  // 内容
  drawText(ctx, content, modalX + 24, modalY + 65, modalWidth - 48, 14, Theme.textSecondary, 'left')

  // 按钮
  const btnWidth = (modalWidth - 60) / Math.max(1, buttons.length)
  const btnY = modalY + modalHeight - 60
  const modalButtons = []

  buttons.forEach((btn, i) => {
    const btnX = modalX + 20 + i * (btnWidth + 20)
    const btnData = {
      x: btnX, y: btnY, width: btnWidth, height: 40,
      text: btn.text,
      color: btn.color || (i === 0 ? Theme.primary : '#E5E7EB'),
      textColor: btn.textColor || (i === 0 ? Theme.textLight : Theme.textPrimary),
      fontSize: 14,
      onClick: btn.onClick
    }
    drawButton(ctx, btnData)
    modalButtons.push(btnData)
  })

  return modalButtons
}

/**
 * 绘制标签/徽章
 */
export function drawBadge(ctx, x, y, text, color = Theme.danger) {
  const padding = 6
  ctx.font = 'bold 10px "PingFang SC", sans-serif'
  const textWidth = ctx.measureText(text).width
  const badgeWidth = textWidth + padding * 2
  const badgeHeight = 18

  drawRoundRect(ctx, x, y, badgeWidth, badgeHeight, 9, color)
  ctx.fillStyle = Theme.textLight
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + badgeWidth / 2, y + badgeHeight / 2)
}
