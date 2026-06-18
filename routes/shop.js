const express = require('express')
const { getDB } = require('../db/database')

const router = express.Router()

const PRESET_REWARDS = [
  { content: '主人夸夸一次', category: '铜级', points_cost: 50, type: 'reward', icon: '💬' },
  { content: '选择今天看什么电影', category: '铜级', points_cost: 50, type: 'reward', icon: '🎬' },
  { content: '免除一次小任务', category: '铜级', points_cost: 50, type: 'reward', icon: '🎫' },
  { content: '主人给讲一个故事', category: '铜级', points_cost: 50, type: 'reward', icon: '📚' },
  { content: '主人准备一顿爱心餐', category: '银级', points_cost: 100, type: 'reward', icon: '🍳' },
  { content: '一起散步30分钟', category: '银级', points_cost: 100, type: 'reward', icon: '🚶' },
  { content: '获得一次撒娇豁免权', category: '银级', points_cost: 100, type: 'reward', icon: '🎀' },
  { content: '一起看一部电影', category: '银级', points_cost: 100, type: 'reward', icon: '🍿' },
  { content: '一起去想去的餐厅', category: '金级', points_cost: 200, type: 'reward', icon: '🍽️' },
  { content: '主人准备一个小惊喜', category: '金级', points_cost: 200, type: 'reward', icon: '🎁' },
  { content: '一天的自由日', category: '金级', points_cost: 200, type: 'reward', icon: '🌈' },
  { content: '一起出去玩一天', category: '钻石级', points_cost: 500, type: 'reward', icon: '✈️' },
  { content: '满足一个小愿望', category: '钻石级', points_cost: 500, type: 'reward', icon: '⭐' },
  { content: '主人的特别奖励', category: '钻石级', points_cost: 500, type: 'reward', icon: '💎' }
]

const PRESET_PUNISHMENTS = [
  { content: '做10个深蹲', category: '轻度', type: 'punishment', icon: '🏋️' },
  { content: '唱一首歌给主人听', category: '轻度', type: 'punishment', icon: '🎤' },
  { content: '说10遍"主人最棒了"', category: '轻度', type: 'punishment', icon: '📢' },
  { content: '做10个俯卧撑', category: '轻度', type: 'punishment', icon: '💪' },
  { content: '学小狗叫3声', category: '轻度', type: 'punishment', icon: '🐕' },
  { content: '明天多完成一个任务', category: '中度', type: 'punishment', icon: '📋' },
  { content: '写100字检讨', category: '中度', type: 'punishment', icon: '✏️' },
  { content: '给主人做一次按摩', category: '中度', type: 'punishment', icon: '💆' },
  { content: '给主人做一杯奶茶', category: '中度', type: 'punishment', icon: '🧋' },
  { content: '周末大扫除', category: '重度', type: 'punishment', icon: '🧹' },
  { content: '给主人做三天早餐', category: '重度', type: 'punishment', icon: '🍳' },
  { content: '一天不能吃零食', category: '重度', type: 'punishment', icon: '🚫' }
]

function initPresetRewards(ownerId) {
  const db = getDB()
  const insert = db.prepare(
    'INSERT INTO rewards_pool (owner_id, type, category, content, icon, points_cost) VALUES (?, ?, ?, ?, ?, ?)'
  )
  for (const r of [...PRESET_REWARDS, ...PRESET_PUNISHMENTS]) {
    insert.run(ownerId, r.type, r.category, r.content, r.icon, r.points_cost || 0)
  }
}

// 获取奖惩列表
router.get('/list', (req, res) => {
  const db = getDB()
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId)
  const ownerId = user.role === 'owner' ? user.id : user.partner_id

  if (!ownerId) {
    return res.json({ code: 0, data: { rewards: PRESET_REWARDS, punishments: PRESET_PUNISHMENTS } })
  }

  const all = db.prepare('SELECT * FROM rewards_pool WHERE owner_id = ? AND active = 1 ORDER BY type, category, id').all(ownerId)
  const rewards = all.filter(r => r.type === 'reward')
  const punishments = all.filter(r => r.type === 'punishment')

  // 获取宠物积分
  const petUserId = user.role === 'pet' ? user.id : user.partner_id
  let currentPoints = 0
  if (petUserId) {
    const pet = db.prepare('SELECT points FROM pet_status WHERE user_id = ?').get(petUserId)
    currentPoints = pet ? pet.points : 0
  }

  res.json({ code: 0, data: { rewards, punishments, currentPoints } })
})

// 兑换奖励
router.post('/redeem', (req, res) => {
  const { rewardId } = req.body
  const db = getDB()
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId)

  const reward = db.prepare('SELECT * FROM rewards_pool WHERE id = ?').get(rewardId)
  if (!reward) return res.json({ code: -1, message: '奖励不存在' })

  const petUserId = user.role === 'pet' ? user.id : user.partner_id
  const pet = db.prepare('SELECT * FROM pet_status WHERE user_id = ?').get(petUserId)
  if (!pet) return res.json({ code: -1, message: '宠物数据不存在' })

  if (pet.points < reward.points_cost) {
    return res.json({ code: -1, message: '积分不足！' })
  }

  const newPoints = pet.points - reward.points_cost
  db.prepare('UPDATE pet_status SET points = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(newPoints, pet.id)

  db.prepare('INSERT INTO game_records (user_id, game_type, result, points_change) VALUES (?, ?, ?, ?)')
    .run(req.session.userId, 'redeem', reward.content, -reward.points_cost)

  res.json({ code: 0, message: `兑换成功: ${reward.content}`, data: { remaining: newPoints } })
})

// 主人添加奖惩
router.post('/add', (req, res) => {
  const { type, category, content, icon, pointsCost } = req.body
  const db = getDB()
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId)
  if (user.role !== 'owner') return res.json({ code: -1, message: '只有主人才能添加' })

  db.prepare('INSERT INTO rewards_pool (owner_id, type, category, content, icon, points_cost) VALUES (?, ?, ?, ?, ?, ?)')
    .run(user.id, type, category || (type === 'reward' ? '铜级' : '轻度'), content, icon || '🎁', pointsCost || 50)

  res.json({ code: 0, message: '添加成功！' })
})

// 删除奖惩
router.post('/remove', (req, res) => {
  const { id } = req.body
  const db = getDB()
  db.prepare('UPDATE rewards_pool SET active = 0 WHERE id = ?').run(id)
  res.json({ code: 0, message: '已删除' })
})

module.exports = router
module.exports.initPresetRewards = initPresetRewards
