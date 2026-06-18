const express = require('express')
const { v4: uuidv4 } = require('uuid')
const { getDB } = require('../db/database')
const { initPresetRewards } = require('./shop')

const router = express.Router()

// 注册
router.post('/register', (req, res) => {
  const { username, password, nickname, role } = req.body
  if (!username || !password || !role) {
    return res.json({ code: -1, message: '请填写完整信息' })
  }
  if (!['owner', 'pet'].includes(role)) {
    return res.json({ code: -1, message: '角色无效' })
  }

  const db = getDB()
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (existing) {
    return res.json({ code: -1, message: '用户名已存在' })
  }

  const bindCode = Math.floor(100000 + Math.random() * 900000).toString()

  const result = db.prepare(
    'INSERT INTO users (username, password, nickname, role, bind_code) VALUES (?, ?, ?, ?, ?)'
  ).run(username, password, nickname || (role === 'owner' ? '主人' : '小源'), role, bindCode)

  const userId = result.lastInsertRowid

  // 小源角色自动创建宠物状态
  if (role === 'pet') {
    db.prepare(
      'INSERT INTO pet_status (user_id) VALUES (?)'
    ).run(userId)
  }

  // 主人角色自动初始化预设奖惩
  if (role === 'owner') {
    initPresetRewards(userId)
  }

  req.session.userId = userId
  req.session.role = role

  res.json({
    code: 0,
    message: '注册成功',
    data: { userId, role, bindCode, nickname: nickname || (role === 'owner' ? '主人' : '小源') }
  })
})

// 登录
router.post('/login', (req, res) => {
  const { username, password } = req.body
  const db = getDB()

  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password)
  if (!user) {
    return res.json({ code: -1, message: '用户名或密码错误' })
  }

  req.session.userId = user.id
  req.session.role = user.role

  res.json({
    code: 0,
    message: '登录成功',
    data: {
      userId: user.id,
      username: user.username,
      nickname: user.nickname,
      role: user.role,
      bindCode: user.bind_code,
      partnerId: user.partner_id
    }
  })
})

// 获取当前用户信息
router.get('/me', (req, res) => {
  if (!req.session.userId) {
    return res.json({ code: -1, message: '未登录' })
  }

  const db = getDB()
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId)
  if (!user) {
    return res.json({ code: -1, message: '用户不存在' })
  }

  let petStatus = null
  let partner = null

  // 获取宠物状态
  const petUserId = user.role === 'pet' ? user.id : user.partner_id
  if (petUserId) {
    petStatus = db.prepare('SELECT * FROM pet_status WHERE user_id = ?').get(petUserId)
  }

  // 获取伴侣信息
  if (user.partner_id) {
    partner = db.prepare('SELECT id, nickname, role FROM users WHERE id = ?').get(user.partner_id)
  }

  res.json({
    code: 0,
    data: {
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        role: user.role,
        bindCode: user.bind_code,
        partnerId: user.partner_id
      },
      petStatus,
      partner
    }
  })
})

// 配对
router.post('/bind', (req, res) => {
  if (!req.session.userId) {
    return res.json({ code: -1, message: '未登录' })
  }

  const { code } = req.body
  const db = getDB()

  const me = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId)
  const partner = db.prepare('SELECT * FROM users WHERE bind_code = ?').get(code)

  if (!partner) {
    return res.json({ code: -1, message: '配对码无效' })
  }
  if (partner.id === me.id) {
    return res.json({ code: -1, message: '不能和自己配对哦' })
  }
  if (partner.role === me.role) {
    return res.json({ code: -1, message: '不能和相同角色配对' })
  }

  // 双向绑定
  db.prepare('UPDATE users SET partner_id = ? WHERE id = ?').run(partner.id, me.id)
  db.prepare('UPDATE users SET partner_id = ? WHERE id = ?').run(me.id, partner.id)

  // 如果主人还没有宠物状态关联，确保宠物状态存在
  const petId = me.role === 'pet' ? me.id : partner.id
  const existing = db.prepare('SELECT id FROM pet_status WHERE user_id = ?').get(petId)
  if (!existing) {
    db.prepare('INSERT INTO pet_status (user_id) VALUES (?)').run(petId)
  }

  res.json({ code: 0, message: '配对成功！', data: { partnerId: partner.id, partnerNickname: partner.nickname } })
})

// 登出
router.post('/logout', (req, res) => {
  req.session.destroy()
  res.json({ code: 0, message: '已登出' })
})

module.exports = router
