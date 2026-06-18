const express = require('express')
const { getDB } = require('../db/database')

const router = express.Router()

const TRUTH_QUESTIONS = [
  '说出你最喜欢主人的3个地方',
  '今天最想对主人说的一句话是什么？',
  '你觉得我们之间最甜蜜的回忆是哪一次？',
  '如果可以和主人去任何地方旅行，你想去哪？',
  '描述一下你心目中和主人的理想周末',
  '你最近偷偷想主人的时候在做什么？',
  '说出一件你一直想为主人做但还没做的事',
  '用三个词形容今天的心情',
  '你最喜欢主人做的哪道菜？',
  '如果只能带一样东西去荒岛，你会带什么？',
  '说出你们在一起最搞笑的一件事',
  '你觉得主人最可爱的瞬间是什么时候？',
  '形容一下第一次见到主人的感觉',
  '你偷偷为主人做过什么主人不知道的事？',
  '如果可以回到过去的一天，你会选哪天？'
]

const DARE_CHALLENGES = [
  '给主人发一条超甜的语音消息',
  '给主人唱一首歌（录音发送）',
  '拍一张此刻最美的自拍发给主人',
  '给主人写一段50字以内的小情书',
  '模仿一个主人的口头禅并录视频',
  '给主人做一顿爱心早餐（明天执行）',
  '立刻给主人打一个电话说"我想你了"',
  '画一幅主人的画像（不限水平）',
  '用最甜的声音叫一声"主人~"',
  '发一张你今天吃的饭的照片',
  '做一个可爱的表情并自拍',
  '用语音说出"主人我爱你"',
  '给主人列出今天的愿望清单',
  '模仿一只小狗的叫声发语音',
  '给主人准备一个小惊喜（今天内）'
]

const RANDOM_EVENTS = [
  { text: '今天是特别乖巧日！所有任务积分翻倍~', effect: 'double_points', icon: '🌟' },
  { text: '幸运降临！免费获得一次转盘机会', effect: 'free_wheel', icon: '🎰' },
  { text: '主人心情好！额外奖励20积分', effect: 'bonus_points', value: 20, icon: '🎉' },
  { text: '今天是撒娇日，小源可以免除一个任务', effect: 'skip_task', icon: '🎀' },
  { text: '神秘宝箱！随机获得10-50积分', effect: 'random_points', icon: '📦' },
  { text: '亲密度UP！今天互动增加双倍亲密度', effect: 'double_affection', icon: '💕' },
  { text: '平静的一天，一切照常~', effect: 'none', icon: '☀️' }
]

const WHEEL_ITEMS = [
  { text: '主人夸夸', color: '#FF6B9D', points: 10 },
  { text: '做深蹲10个', color: '#C084FC', points: -5 },
  { text: '加20积分', color: '#4ADE80', points: 20 },
  { text: '唱一首歌', color: '#FB923C', points: 0 },
  { text: '加10积分', color: '#60A5FA', points: 10 },
  { text: '说"主人棒"', color: '#FBBF24', points: -5 },
  { text: '大奖50分', color: '#F43F5E', points: 50 },
  { text: '做俯卧撑5个', color: '#8B5CF6', points: -5 }
]

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function updatePoints(db, userId, points) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
  const petUserId = user.role === 'pet' ? user.id : user.partner_id
  if (!petUserId) return

  const pet = db.prepare('SELECT * FROM pet_status WHERE user_id = ?').get(petUserId)
  if (!pet) return

  const newPoints = Math.max(0, pet.points + points)
  const newTotal = points > 0 ? pet.total_points + points : pet.total_points
  db.prepare('UPDATE pet_status SET points = ?, total_points = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(newPoints, newTotal, pet.id)
}

// 转盘
router.post('/wheel', (req, res) => {
  const db = getDB()
  const item = randomPick(WHEEL_ITEMS)

  updatePoints(db, req.session.userId, item.points)

  db.prepare('INSERT INTO game_records (user_id, game_type, result, points_change) VALUES (?, ?, ?, ?)')
    .run(req.session.userId, 'wheel', item.text, item.points)

  res.json({ code: 0, data: { result: item, items: WHEEL_ITEMS } })
})

// 获取转盘配置
router.get('/wheel/items', (req, res) => {
  res.json({ code: 0, data: WHEEL_ITEMS })
})

// 骰子
router.post('/dice', (req, res) => {
  const db = getDB()
  const ownerDice = randomInt(1, 6)
  const petDice = randomInt(1, 6)
  let resultText = ''
  let points = 0

  if (ownerDice === petDice) {
    if (ownerDice === 6) {
      resultText = '双六！大吉大利！奖励30积分~'
      points = 30
    } else if (ownerDice === 1) {
      resultText = '蛇眼...安慰奖5积分'
      points = 5
    } else {
      resultText = '豹子！主人和小源心意相通~ 奖励15积分'
      points = 15
    }
  } else if (ownerDice > petDice) {
    resultText = '👑 主人赢了！可以给小源布置一个临时任务~'
  } else {
    resultText = '🐶 小源赢了！获得10积分奖励！'
    points = 10
  }

  if (points) updatePoints(db, req.session.userId, points)

  db.prepare('INSERT INTO game_records (user_id, game_type, result, points_change) VALUES (?, ?, ?, ?)')
    .run(req.session.userId, 'dice', `${ownerDice}vs${petDice}`, points)

  res.json({ code: 0, data: { ownerDice, petDice, resultText, points } })
})

// 真心话大冒险
router.post('/tod', (req, res) => {
  const { type } = req.body
  const question = type === 'truth' ? randomPick(TRUTH_QUESTIONS) : randomPick(DARE_CHALLENGES)
  res.json({ code: 0, data: { type, question } })
})

// 真心话大冒险评分
router.post('/tod/rate', (req, res) => {
  const { points, question } = req.body
  const db = getDB()

  if (points) updatePoints(db, req.session.userId, points)

  db.prepare('INSERT INTO game_records (user_id, game_type, result, points_change) VALUES (?, ?, ?, ?)')
    .run(req.session.userId, 'truth_or_dare', question || '', points || 0)

  res.json({ code: 0, message: '评分完成！' })
})

// 随机事件
router.post('/random-event', (req, res) => {
  const db = getDB()
  const event = randomPick(RANDOM_EVENTS)
  let bonusPoints = 0

  if (event.effect === 'bonus_points') {
    bonusPoints = event.value || 20
    updatePoints(db, req.session.userId, bonusPoints)
  } else if (event.effect === 'random_points') {
    bonusPoints = randomInt(10, 50)
    updatePoints(db, req.session.userId, bonusPoints)
    event.text += ` 获得${bonusPoints}积分！`
  }

  db.prepare('INSERT INTO game_records (user_id, game_type, result, points_change) VALUES (?, ?, ?, ?)')
    .run(req.session.userId, 'random_event', event.text, bonusPoints)

  res.json({ code: 0, data: event })
})

// 游戏历史
router.get('/history', (req, res) => {
  const db = getDB()
  const records = db.prepare('SELECT * FROM game_records WHERE user_id = ? ORDER BY played_at DESC LIMIT 50')
    .all(req.session.userId)
  res.json({ code: 0, data: records })
})

module.exports = router
