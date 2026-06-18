const express = require('express')
const { getDB } = require('../db/database')

const router = express.Router()

function getToday() {
  return new Date().toISOString().split('T')[0]
}

function getPetUserId(db, userId) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
  if (!user) return null
  if (user.role === 'pet') return user.id
  return user.partner_id
}

// 获取今日日记
router.get('/today', (req, res) => {
  const db = getDB()
  const today = getToday()
  const petUserId = getPetUserId(db, req.session.userId)
  if (!petUserId) return res.json({ code: 0, data: null })

  const diary = db.prepare('SELECT * FROM diary WHERE user_id = ? AND date = ?').get(petUserId, today)
  res.json({ code: 0, data: diary || { date: today, mood: '', highlights: '', owner_comment: '' } })
})

// 保存心情
router.post('/mood', (req, res) => {
  const { mood } = req.body
  const db = getDB()
  const today = getToday()
  const petUserId = getPetUserId(db, req.session.userId)

  const existing = db.prepare('SELECT id FROM diary WHERE user_id = ? AND date = ?').get(petUserId, today)
  if (existing) {
    db.prepare('UPDATE diary SET mood = ? WHERE id = ?').run(mood, existing.id)
  } else {
    db.prepare('INSERT INTO diary (user_id, date, mood) VALUES (?, ?, ?)').run(petUserId, today, mood)
  }
  res.json({ code: 0, message: '心情已记录~' })
})

// 保存日记内容
router.post('/write', (req, res) => {
  const { highlights } = req.body
  const db = getDB()
  const today = getToday()
  const petUserId = getPetUserId(db, req.session.userId)

  const existing = db.prepare('SELECT id FROM diary WHERE user_id = ? AND date = ?').get(petUserId, today)
  if (existing) {
    db.prepare('UPDATE diary SET highlights = ? WHERE id = ?').run(highlights, existing.id)
  } else {
    db.prepare('INSERT INTO diary (user_id, date, highlights) VALUES (?, ?, ?)').run(petUserId, today, highlights)
  }
  res.json({ code: 0, message: '日记已保存~' })
})

// 保存饮食记录
router.post('/meal', (req, res) => {
  const { meal, content } = req.body
  const db = getDB()
  const today = getToday()
  const petUserId = getPetUserId(db, req.session.userId)

  const field = `meal_${meal}`
  if (!['meal_breakfast', 'meal_lunch', 'meal_dinner'].includes(field)) {
    return res.json({ code: -1, message: '无效的餐次' })
  }

  const existing = db.prepare('SELECT id FROM diary WHERE user_id = ? AND date = ?').get(petUserId, today)
  if (existing) {
    db.prepare(`UPDATE diary SET ${field} = ? WHERE id = ?`).run(content, existing.id)
  } else {
    db.prepare(`INSERT INTO diary (user_id, date, ${field}) VALUES (?, ?, ?)`).run(petUserId, today, content)
  }
  res.json({ code: 0, message: '饮食已记录~' })
})

// 主人留言
router.post('/comment', (req, res) => {
  const { comment } = req.body
  const db = getDB()
  const today = getToday()
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId)
  if (user.role !== 'owner') return res.json({ code: -1, message: '只有主人才能留言' })

  const petUserId = user.partner_id
  if (!petUserId) return res.json({ code: -1, message: '尚未配对' })

  const existing = db.prepare('SELECT id FROM diary WHERE user_id = ? AND date = ?').get(petUserId, today)
  if (existing) {
    db.prepare('UPDATE diary SET owner_comment = ? WHERE id = ?').run(comment, existing.id)
  } else {
    db.prepare('INSERT INTO diary (user_id, date, owner_comment) VALUES (?, ?, ?)').run(petUserId, today, comment)
  }
  res.json({ code: 0, message: '留言已保存~' })
})

// 历史日记列表
router.get('/history', (req, res) => {
  const db = getDB()
  const petUserId = getPetUserId(db, req.session.userId)
  if (!petUserId) return res.json({ code: 0, data: [] })

  const list = db.prepare('SELECT * FROM diary WHERE user_id = ? ORDER BY date DESC LIMIT 30').all(petUserId)
  res.json({ code: 0, data: list })
})

module.exports = router
