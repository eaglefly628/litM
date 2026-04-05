/**
 * 随机数和抽奖工具
 */

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function randomShuffle(arr) {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * 加权随机选择
 * items: [{value, weight}]
 */
export function weightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
  let random = Math.random() * totalWeight

  for (const item of items) {
    random -= item.weight
    if (random <= 0) return item.value
  }
  return items[items.length - 1].value
}

/**
 * 掷骰子 (1-6)
 */
export function rollDice() {
  return randomInt(1, 6)
}

/**
 * 转盘停止角度计算
 * slotCount: 格子数
 * targetIndex: 目标格子索引
 * returns: 最终旋转角度（包含多圈）
 */
export function calculateWheelAngle(slotCount, targetIndex) {
  const slotAngle = 360 / slotCount
  const targetAngle = targetIndex * slotAngle + slotAngle / 2
  const extraRotations = randomInt(3, 5) * 360
  return extraRotations + (360 - targetAngle)
}
