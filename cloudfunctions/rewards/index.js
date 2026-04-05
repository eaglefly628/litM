/**
 * 云函数 - rewards
 * 奖惩管理：初始化预设奖惩、管理奖惩池
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { action, data } = event

  try {
    switch (action) {
      case 'initPresets':
        return await initPresets(openid)
      case 'addItem':
        return await addItem(openid, data)
      case 'removeItem':
        return await removeItem(data)
      default:
        return { code: -1, message: '未知操作' }
    }
  } catch (e) {
    return { code: -1, message: e.message }
  }
}

async function initPresets(openid) {
  // 检查是否已初始化
  const existing = await db.collection('rewards_pool').where({
    ownerOpenid: openid
  }).count()

  if (existing.total > 0) {
    return { code: 0, message: '已初始化' }
  }

  // 批量插入预设奖励
  const presetRewards = [
    { content: '主人夸夸一次', category: '铜级', pointsCost: 50, type: 'reward', icon: '💬' },
    { content: '选择今天看什么电影', category: '铜级', pointsCost: 50, type: 'reward', icon: '🎬' },
    { content: '免除一次小任务', category: '铜级', pointsCost: 50, type: 'reward', icon: '🎫' },
    { content: '主人准备一顿爱心餐', category: '银级', pointsCost: 100, type: 'reward', icon: '🍳' },
    { content: '一起散步30分钟', category: '银级', pointsCost: 100, type: 'reward', icon: '🚶' },
    { content: '一起去想去的餐厅', category: '金级', pointsCost: 200, type: 'reward', icon: '🍽️' },
    { content: '主人准备一个小惊喜', category: '金级', pointsCost: 200, type: 'reward', icon: '🎁' },
    { content: '一起出去玩一天', category: '钻石级', pointsCost: 500, type: 'reward', icon: '✈️' },
    { content: '满足一个小愿望', category: '钻石级', pointsCost: 500, type: 'reward', icon: '⭐' }
  ]

  const presetPunishments = [
    { content: '做10个深蹲', category: '轻度', type: 'punishment', icon: '🏋️' },
    { content: '唱一首歌给主人听', category: '轻度', type: 'punishment', icon: '🎤' },
    { content: '说10遍"主人最棒了"', category: '轻度', type: 'punishment', icon: '📢' },
    { content: '明天多完成一个任务', category: '中度', type: 'punishment', icon: '📋' },
    { content: '写100字检讨', category: '中度', type: 'punishment', icon: '✏️' },
    { content: '给主人做一次按摩', category: '中度', type: 'punishment', icon: '💆' },
    { content: '周末大扫除', category: '重度', type: 'punishment', icon: '🧹' },
    { content: '给主人做三天早餐', category: '重度', type: 'punishment', icon: '🍳' }
  ]

  const allItems = [...presetRewards, ...presetPunishments].map(item => ({
    ...item,
    ownerOpenid: openid,
    active: true,
    createdAt: db.serverDate()
  }))

  // 逐条插入（云开发batch add有限制）
  for (const item of allItems) {
    await db.collection('rewards_pool').add({ data: item })
  }

  return { code: 0, message: '预设初始化完成', data: { count: allItems.length } }
}

async function addItem(openid, data) {
  const res = await db.collection('rewards_pool').add({
    data: {
      ...data,
      ownerOpenid: openid,
      active: true,
      createdAt: db.serverDate()
    }
  })
  return { code: 0, data: { id: res._id } }
}

async function removeItem(data) {
  const { id } = data
  await db.collection('rewards_pool').doc(id).update({
    data: { active: false }
  })
  return { code: 0, message: '已移除' }
}
