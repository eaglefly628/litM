/**
 * 云函数 - points
 * 积分管理：增减积分、经验计算、等级升级
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 等级经验表
function getExpForLevel(level) {
  return Math.floor(50 * Math.pow(1.15, level - 1))
}

// 称号表
const TITLES = [
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

function getTitleForLevel(level) {
  for (const t of TITLES) {
    if (level >= t.min && level <= t.max) return t.title
  }
  return TITLES[TITLES.length - 1].title
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { action, data } = event

  try {
    switch (action) {
      case 'addPoints':
        return await addPoints(openid, data)
      case 'addExp':
        return await addExp(openid, data)
      case 'checkLevelUp':
        return await checkLevelUp(openid)
      default:
        return { code: -1, message: '未知操作' }
    }
  } catch (e) {
    return { code: -1, message: e.message }
  }
}

async function addPoints(openid, data) {
  const { points } = data
  const petRes = await db.collection('pet_status').where({ _openid: openid }).get()
  if (petRes.data.length === 0) return { code: -1, message: '宠物不存在' }

  const pet = petRes.data[0]
  const newPoints = Math.max(0, pet.points + points)
  const newTotal = points > 0 ? pet.totalPoints + points : pet.totalPoints

  await db.collection('pet_status').doc(pet._id).update({
    data: {
      points: newPoints,
      totalPoints: newTotal,
      updatedAt: db.serverDate()
    }
  })

  return { code: 0, data: { points: newPoints, totalPoints: newTotal } }
}

async function addExp(openid, data) {
  const { exp } = data
  const petRes = await db.collection('pet_status').where({ _openid: openid }).get()
  if (petRes.data.length === 0) return { code: -1, message: '宠物不存在' }

  const pet = petRes.data[0]
  let newExp = pet.exp + exp
  let newLevel = pet.level
  let leveledUp = false

  // 检查是否升级
  while (newExp >= getExpForLevel(newLevel)) {
    newExp -= getExpForLevel(newLevel)
    newLevel++
    leveledUp = true
  }

  const newTitle = getTitleForLevel(newLevel)

  await db.collection('pet_status').doc(pet._id).update({
    data: {
      exp: newExp,
      level: newLevel,
      title: newTitle,
      updatedAt: db.serverDate()
    }
  })

  return {
    code: 0,
    data: {
      exp: newExp,
      level: newLevel,
      title: newTitle,
      leveledUp,
      previousLevel: pet.level
    }
  }
}

async function checkLevelUp(openid) {
  const petRes = await db.collection('pet_status').where({ _openid: openid }).get()
  if (petRes.data.length === 0) return { code: -1, message: '宠物不存在' }

  const pet = petRes.data[0]
  const needed = getExpForLevel(pet.level)

  return {
    code: 0,
    data: {
      level: pet.level,
      exp: pet.exp,
      needed,
      progress: (pet.exp / needed * 100).toFixed(1) + '%',
      title: pet.title
    }
  }
}
