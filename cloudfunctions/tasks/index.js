/**
 * 云函数 - tasks
 * 任务管理：生成每日任务、更新任务状态、计算积分
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { action, data } = event

  try {
    switch (action) {
      case 'checkMissedTasks':
        return await checkMissedTasks(openid, data)
      case 'dailySummary':
        return await generateDailySummary(openid, data)
      default:
        return { code: -1, message: '未知操作' }
    }
  } catch (e) {
    return { code: -1, message: e.message }
  }
}

// 检查过期任务并扣分
async function checkMissedTasks(openid, data) {
  const { date } = data
  const taskDoc = await db.collection('daily_tasks').where({
    _openid: openid,
    date
  }).get()

  if (taskDoc.data.length === 0) return { code: 0, message: '无任务' }

  const doc = taskDoc.data[0]
  let totalLost = 0
  let updated = false

  doc.tasks.forEach(task => {
    if (task.status === 'pending') {
      task.status = 'missed'
      totalLost += Math.floor(task.points * 0.5)
      updated = true
    }
  })

  if (updated) {
    await db.collection('daily_tasks').doc(doc._id).update({
      data: { tasks: doc.tasks, totalLost }
    })

    // 扣减积分
    if (totalLost > 0) {
      await db.collection('pet_status').where({
        _openid: openid
      }).update({
        data: {
          points: _.inc(-totalLost)
        }
      })
    }
  }

  return { code: 0, message: '已处理', data: { totalLost } }
}

// 生成每日总结
async function generateDailySummary(openid, data) {
  const { date } = data
  const taskDoc = await db.collection('daily_tasks').where({
    _openid: openid,
    date
  }).get()

  if (taskDoc.data.length === 0) return { code: 0, data: null }

  const doc = taskDoc.data[0]
  const completed = doc.tasks.filter(t => t.status === 'done').length
  const total = doc.tasks.length
  const totalEarned = doc.tasks
    .filter(t => t.status === 'done')
    .reduce((sum, t) => sum + t.points, 0)

  return {
    code: 0,
    data: {
      date,
      completed,
      total,
      totalEarned,
      totalLost: doc.totalLost || 0,
      completionRate: total > 0 ? (completed / total * 100).toFixed(0) + '%' : '0%'
    }
  }
}
