/**
 * 云函数 - notify
 * 消息通知：打卡提醒、任务确认通知
 * 注意：需要在微信公众平台配置订阅消息模板
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { action, data } = event

  try {
    switch (action) {
      case 'taskReminder':
        return await sendTaskReminder(data)
      case 'taskVerified':
        return await sendTaskVerified(data)
      case 'levelUp':
        return await sendLevelUp(data)
      default:
        return { code: -1, message: '未知操作' }
    }
  } catch (e) {
    return { code: -1, message: e.message }
  }
}

// 发送打卡提醒
async function sendTaskReminder(data) {
  const { toOpenid, taskName, deadline } = data

  try {
    await cloud.openapi.subscribeMessage.send({
      touser: toOpenid,
      templateId: '', // 需要在微信后台申请模板ID
      page: '',
      data: {
        thing1: { value: taskName },
        time2: { value: deadline },
        thing3: { value: '记得按时完成哦~' }
      }
    })
    return { code: 0, message: '提醒已发送' }
  } catch (e) {
    console.error('发送提醒失败:', e)
    return { code: -1, message: '发送失败: ' + e.message }
  }
}

// 发送任务确认通知
async function sendTaskVerified(data) {
  const { toOpenid, taskName, points } = data

  try {
    await cloud.openapi.subscribeMessage.send({
      touser: toOpenid,
      templateId: '', // 需要在微信后台申请模板ID
      page: '',
      data: {
        thing1: { value: taskName },
        number2: { value: points },
        thing3: { value: '主人已确认，积分到账啦~' }
      }
    })
    return { code: 0, message: '通知已发送' }
  } catch (e) {
    console.error('发送通知失败:', e)
    return { code: -1, message: '发送失败: ' + e.message }
  }
}

// 发送升级通知
async function sendLevelUp(data) {
  const { toOpenid, newLevel, newTitle } = data

  try {
    await cloud.openapi.subscribeMessage.send({
      touser: toOpenid,
      templateId: '', // 需要在微信后台申请模板ID
      page: '',
      data: {
        thing1: { value: `恭喜升到 Lv.${newLevel}！` },
        thing2: { value: `新称号: ${newTitle}` },
        thing3: { value: '继续加油哦~' }
      }
    })
    return { code: 0, message: '升级通知已发送' }
  } catch (e) {
    console.error('发送升级通知失败:', e)
    return { code: -1, message: '发送失败: ' + e.message }
  }
}
