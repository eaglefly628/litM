/**
 * 等级和称号配置
 */

// 称号配置 - 根据等级解锁
export const TITLES = [
  { minLevel: 1,  maxLevel: 5,  title: '初来乍到的小狗', emoji: '🐶' },
  { minLevel: 6,  maxLevel: 10, title: '听话的乖狗狗', emoji: '🐕' },
  { minLevel: 11, maxLevel: 15, title: '努力的小可爱', emoji: '🌟' },
  { minLevel: 16, maxLevel: 20, title: '贴心小棉袄', emoji: '🧸' },
  { minLevel: 21, maxLevel: 25, title: '主人的骄傲', emoji: '👑' },
  { minLevel: 26, maxLevel: 30, title: '超级乖巧', emoji: '💫' },
  { minLevel: 31, maxLevel: 40, title: '最佳伙伴', emoji: '🏆' },
  { minLevel: 41, maxLevel: 50, title: '传说中的好孩子', emoji: '✨' },
  { minLevel: 51, maxLevel: 99, title: '永远的宝贝', emoji: '💖' }
]

/**
 * 计算升级所需经验
 * 公式: 50 * 1.15^(level-1)
 */
export function getExpForLevel(level) {
  return Math.floor(50 * Math.pow(1.15, level - 1))
}

/**
 * 获取当前称号
 */
export function getTitleForLevel(level) {
  for (const t of TITLES) {
    if (level >= t.minLevel && level <= t.maxLevel) {
      return t
    }
  }
  return TITLES[TITLES.length - 1]
}

/**
 * 计算积分奖励的经验值
 * 每获得10积分 = 1经验
 */
export function pointsToExp(points) {
  return Math.max(0, Math.floor(points / 10))
}

// 外观配置
export const APPEARANCES = [
  { id: 'default', name: '默认小狗', unlockLevel: 1, emoji: '🐶' },
  { id: 'ribbon', name: '蝴蝶结小狗', unlockLevel: 5, emoji: '🎀🐶' },
  { id: 'crown', name: '皇冠小狗', unlockLevel: 10, emoji: '👑🐶' },
  { id: 'star', name: '星光小狗', unlockLevel: 20, emoji: '⭐🐶' },
  { id: 'angel', name: '天使小狗', unlockLevel: 30, emoji: '😇🐶' },
  { id: 'rainbow', name: '彩虹小狗', unlockLevel: 40, emoji: '🌈🐶' },
  { id: 'diamond', name: '钻石小狗', unlockLevel: 50, emoji: '💎🐶' }
]

// 亲密度事件
export const AFFECTION_EVENTS = {
  TASK_COMPLETE: 1,          // 完成任务 +1
  GAME_PLAY: 2,              // 玩游戏 +2
  DIARY_WRITE: 1,            // 写日记 +1
  STREAK_BONUS: 3,           // 连续打卡7天 +3
  MISS_TASK: -1,             // 错过任务 -1
  STREAK_BREAK: -10          // 连续3天不打卡 -10
}
