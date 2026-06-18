const express = require('express')
const { getDB } = require('../db/database')

const router = express.Router()

const PRESET_TASKS = [
  { task_id: 'breakfast', name: '按时吃早饭', type: 'meal', points: 10, icon: '🥣', time_start: '07:00', time_end: '09:00' },
  { task_id: 'lunch', name: '按时吃午饭', type: 'meal', points: 10, icon: '🍱', time_start: '11:30', time_end: '13:30' },
  { task_id: 'dinner', name: '按时吃晚饭', type: 'meal', points: 10, icon: '🍽️', time_start: '17:30', time_end: '19:30' },
  { task_id: 'sleep', name: '按时睡觉', type: 'sleep', points: 15, icon: '😴', time_start: '', time_end: '23:00' },
  { task_id: 'water', name: '喝够8杯水', type: 'health', points: 5, icon: '💧', time_start: '', time_end: '' },
  { task_id: 'exercise', name: '运动30分钟', type: 'exercise', points: 20, icon: '🏃', time_start: '', time_end: '' },
  { task_id: 'mood', name: '心情记录', type: 'mood', points: 5, icon: '📝', time_start: '', time_end: '' }
]

function getToday() {
  const now = new Date()
  return now.toISOString().split('T')[0]
}

function getPetUserId(db, userId) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
  if (!user) return null
  if (user.role === 'pet') return user.id
  return user.partner_id
}

// 获取今日任务（自动生成）
router.get('/today', (req, res) => {
  const db = getDB()
  const today = getToday()
  const petUserId = getPetUserId(db, req.session.userId)

  if (!petUserId) {
    return res.json({ code: 0, data: { tasks: [], date: today } })
  }

  // 检查是否已有今日任务
  let tasks = db.prepare('SELECT * FROM daily_tasks WHERE user_id = ? AND date = ? ORDER BY id').all(petUserId, today)

  if (tasks.length === 0) {
    // 自动生成预设任务
    const insert = db.prepare(
      'INSERT OR IGNORE INTO daily_tasks (user_id, date, task_id, name, type, icon, points, time_start, time_end) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    for (const t of PRESET_TASKS) {
      insert.run(petUserId, today, t.task_id, t.name, t.type, t.icon, t.points, t.time_start, t.time_end)
    }

    // 加载主人自定义的每日任务
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(petUserId)
    if (user && user.partner_id) {
      const customs = db.prepare('SELECT * FROM custom_tasks WHERE owner_id = ? AND active = 1 AND recurring = 1').all(user.partner_id)
      for (const c of customs) {
        insert.run(petUserId, today, 'custom_' + c.id, c.name, 'custom', c.icon || '⭐', c.points, '', c.time_limit || '')
      }
    }

    tasks = db.prepare('SELECT * FROM daily_tasks WHERE user_id = ? AND date = ? ORDER BY id').all(petUserId, today)
  }

  const completed = tasks.filter(t => t.status === 'done').length

  res.json({ code: 0, data: { tasks, date: today, completed, total: tasks.length } })
})

// 打卡（小源提交）
router.post('/checkin', (req, res) => {
  const { taskId, detail } = req.body
  const db = getDB()
  const today = getToday()
  const petUserId = getPetUserId(db, req.session.userId)

  const task = db.prepare('SELECT * FROM daily_tasks WHERE user_id = ? AND date = ? AND task_id = ?').get(petUserId, today, taskId)
  if (!task) return res.json({ code: -1, message: '任务不存在' })
  if (task.status !== 'pending') return res.json({ code: -1, message: '任务已处理' })

  db.prepare('UPDATE daily_tasks SET status = ?, detail = ?, completed_at = ? WHERE id = ?')
    .run('submitted', detail || '', new Date().toISOString(), task.id)

  res.json({ code: 0, message: '打卡成功，等待主人确认~' })
})

// 确认任务（主人操作）
router.post('/verify', (req, res) => {
  const { taskId } = req.body
  const db = getDB()
  const today = getToday()

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId)
  if (user.role !== 'owner') return res.json({ code: -1, message: '只有主人才能确认' })

  const petUserId = user.partner_id
  if (!petUserId) return res.json({ code: -1, message: '尚未配对' })

  const task = db.prepare('SELECT * FROM daily_tasks WHERE user_id = ? AND date = ? AND task_id = ?').get(petUserId, today, taskId)
  if (!task) return res.json({ code: -1, message: '任务不存在' })
  if (task.status !== 'submitted') return res.json({ code: -1, message: '任务未提交或已确认' })

  db.prepare('UPDATE daily_tasks SET status = ?, verified_by = ? WHERE id = ?')
    .run('done', 'owner', task.id)

  // 加积分和经验
  const pet = db.prepare('SELECT * FROM pet_status WHERE user_id = ?').get(petUserId)
  if (pet) {
    const newPoints = pet.points + task.points
    const newTotal = pet.total_points + task.points
    const newExp = pet.exp + Math.max(1, Math.floor(task.points / 5))
    let newLevel = pet.level
    let expNeeded = getExpForLevel(newLevel)

    let remainExp = newExp
    while (remainExp >= expNeeded) {
      remainExp -= expNeeded
      newLevel++
      expNeeded = getExpForLevel(newLevel)
    }

    const newTitle = getTitleForLevel(newLevel)

    db.prepare('UPDATE pet_status SET points = ?, total_points = ?, exp = ?, level = ?, title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newPoints, newTotal, remainExp, newLevel, newTitle, pet.id)
  }

  res.json({ code: 0, message: '确认成功！积分已到账~', data: { points: task.points } })
})

// 主人创建自定义任务
router.post('/custom', (req, res) => {
  const { name, points, icon, recurring, timeLimit } = req.body
  const db = getDB()
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId)

  if (user.role !== 'owner') return res.json({ code: -1, message: '只有主人才能创建任务' })

  db.prepare('INSERT INTO custom_tasks (owner_id, name, points, icon, recurring, time_limit) VALUES (?, ?, ?, ?, ?, ?)')
    .run(user.id, name, points || 15, icon || '⭐', recurring ? 1 : 0, timeLimit || '')

  // 如果不是每日重复，直接加到今天的任务里
  if (!recurring && user.partner_id) {
    const today = getToday()
    const taskId = 'custom_' + Date.now()
    db.prepare('INSERT OR IGNORE INTO daily_tasks (user_id, date, task_id, name, type, icon, points) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(user.partner_id, today, taskId, name, 'custom', icon || '⭐', points || 15)
  }

  res.json({ code: 0, message: '任务创建成功！' })
})

function getExpForLevel(level) {
  return Math.floor(50 * Math.pow(1.15, level - 1))
}

function getTitleForLevel(level) {
  const titles = [
    { min: 1, max: 5, title: '初来乍到的小狗' },
    { min: 6, max: 10, title: '听话的乖狗狗' },
    { min: 11, max: 15, title: '努力的小可爱' },
    { min: 16, max: 20, title: '贴心小棉袄' },
    { min: 21, max: 25, title: '主人的骄傲' },
    { min: 26, max: 30, title: '超级乖巧' },
    { min: 31, max: 40, title: '最佳伙伴' },
    { min: 41, max: 50, title: '传说中的好孩子' },
    { min: 51, max: 99, title: '永远的宝贝' }
  ]
  for (const t of titles) {
    if (level >= t.min && level <= t.max) return t.title
  }
  return titles[titles.length - 1].title
}

module.exports = router
