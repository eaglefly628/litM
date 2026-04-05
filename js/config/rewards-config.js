/**
 * 奖惩配置 - 预设奖励和惩罚模板
 */

// 预设奖励模板
export const PRESET_REWARDS = [
  // 铜级 (50分)
  { content: '主人夸夸一次', category: '铜级', pointsCost: 50, type: 'reward', icon: '💬' },
  { content: '选择今天看什么电影', category: '铜级', pointsCost: 50, type: 'reward', icon: '🎬' },
  { content: '免除一次小任务', category: '铜级', pointsCost: 50, type: 'reward', icon: '🎫' },
  { content: '主人给讲一个故事', category: '铜级', pointsCost: 50, type: 'reward', icon: '📚' },

  // 银级 (100分)
  { content: '主人准备一顿爱心餐', category: '银级', pointsCost: 100, type: 'reward', icon: '🍳' },
  { content: '一起散步30分钟', category: '银级', pointsCost: 100, type: 'reward', icon: '🚶' },
  { content: '获得一次撒娇豁免权', category: '银级', pointsCost: 100, type: 'reward', icon: '🎀' },
  { content: '一起看一部电影', category: '银级', pointsCost: 100, type: 'reward', icon: '🍿' },

  // 金级 (200分)
  { content: '一起去想去的餐厅', category: '金级', pointsCost: 200, type: 'reward', icon: '🍽️' },
  { content: '主人准备一个小惊喜', category: '金级', pointsCost: 200, type: 'reward', icon: '🎁' },
  { content: '一天的自由日', category: '金级', pointsCost: 200, type: 'reward', icon: '🌈' },
  { content: '主人陪玩一整个下午', category: '金级', pointsCost: 200, type: 'reward', icon: '🎮' },

  // 钻石级 (500分)
  { content: '一起出去玩一天', category: '钻石级', pointsCost: 500, type: 'reward', icon: '✈️' },
  { content: '满足一个小愿望', category: '钻石级', pointsCost: 500, type: 'reward', icon: '⭐' },
  { content: '主人的特别奖励', category: '钻石级', pointsCost: 500, type: 'reward', icon: '💎' }
]

// 预设惩罚模板
export const PRESET_PUNISHMENTS = [
  // 轻度
  { content: '做10个深蹲', category: '轻度', type: 'punishment', icon: '🏋️' },
  { content: '唱一首歌给主人听', category: '轻度', type: 'punishment', icon: '🎤' },
  { content: '说10遍"主人最棒了"', category: '轻度', type: 'punishment', icon: '📢' },
  { content: '做10个俯卧撑', category: '轻度', type: 'punishment', icon: '💪' },
  { content: '学小狗叫3声', category: '轻度', type: 'punishment', icon: '🐕' },

  // 中度
  { content: '明天多完成一个任务', category: '中度', type: 'punishment', icon: '📋' },
  { content: '写100字检讨', category: '中度', type: 'punishment', icon: '✏️' },
  { content: '给主人做一次按摩', category: '中度', type: 'punishment', icon: '💆' },
  { content: '给主人做一杯奶茶', category: '中度', type: 'punishment', icon: '🧋' },
  { content: '今天不能玩手机1小时', category: '中度', type: 'punishment', icon: '📵' },

  // 重度
  { content: '周末大扫除', category: '重度', type: 'punishment', icon: '🧹' },
  { content: '给主人做三天早餐', category: '重度', type: 'punishment', icon: '🍳' },
  { content: '一天不能吃零食', category: '重度', type: 'punishment', icon: '🚫' },
  { content: '跑步3公里', category: '重度', type: 'punishment', icon: '🏃' }
]

// 奖励等级配置
export const REWARD_TIERS = [
  { name: '铜级', minPoints: 50, color: '#CD7F32', emoji: '🥉' },
  { name: '银级', minPoints: 100, color: '#C0C0C0', emoji: '🥈' },
  { name: '金级', minPoints: 200, color: '#FFD700', emoji: '🥇' },
  { name: '钻石级', minPoints: 500, color: '#B9F2FF', emoji: '💎' }
]
