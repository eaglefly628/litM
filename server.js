const express = require('express')
const session = require('express-session')
const path = require('path')
const { initDB } = require('./db/database')
const authRoutes = require('./routes/auth')
const taskRoutes = require('./routes/tasks')
const gameRoutes = require('./routes/games')
const shopRoutes = require('./routes/shop')
const diaryRoutes = require('./routes/diary')

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))
app.use(session({
  secret: process.env.SESSION_SECRET || 'xiaoyuan-secret-key-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30天
}))

// 认证中间件
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ code: -1, message: '请先登录' })
  }
  next()
}

// 路由
app.use('/api/auth', authRoutes)
app.use('/api/tasks', requireAuth, taskRoutes)
app.use('/api/games', requireAuth, gameRoutes)
app.use('/api/shop', requireAuth, shopRoutes)
app.use('/api/diary', requireAuth, diaryRoutes)

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// 初始化数据库并启动
initDB()
app.listen(PORT, () => {
  console.log(`🐶 小源养成记已启动: http://localhost:${PORT}`)
})
