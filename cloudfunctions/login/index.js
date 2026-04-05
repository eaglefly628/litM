/**
 * 云函数 - login
 * 获取用户openid，自动创建或返回用户记录
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const appid = wxContext.APPID

  try {
    // 查找已有用户
    const userRes = await db.collection('users').where({
      _openid: openid
    }).get()

    if (userRes.data.length > 0) {
      const user = userRes.data[0]

      // 查找宠物状态
      let petStatus = null
      const petRes = await db.collection('pet_status').where({
        petOpenid: user.role === 'pet' ? openid : user.partnerId
      }).get()

      if (petRes.data.length > 0) {
        petStatus = petRes.data[0]
      }

      return {
        code: 0,
        message: '登录成功',
        data: {
          openid,
          user,
          petStatus,
          isNew: false
        }
      }
    }

    // 新用户
    return {
      code: 0,
      message: '新用户',
      data: {
        openid,
        user: null,
        petStatus: null,
        isNew: true
      }
    }
  } catch (e) {
    return {
      code: -1,
      message: '登录失败: ' + e.message,
      data: null
    }
  }
}
