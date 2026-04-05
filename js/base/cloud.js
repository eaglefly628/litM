/**
 * 云开发管理器 - 封装微信云开发API
 */

export class CloudManager {
  constructor() {
    this.db = null
    this.initialized = false
  }

  async init() {
    try {
      wx.cloud.init({
        env: 'xiaoyuan-prod', // 云开发环境ID，部署时替换
        traceUser: true
      })
      this.db = wx.cloud.database()
      this.initialized = true
      console.log('云开发初始化成功')
    } catch (e) {
      console.error('云开发初始化失败:', e)
      // 离线模式兜底
      this.initialized = false
    }
  }

  // ========== 用户相关 ==========

  async login() {
    try {
      const res = await wx.cloud.callFunction({ name: 'login' })
      return res.result
    } catch (e) {
      console.error('登录失败:', e)
      return null
    }
  }

  async getUserInfo() {
    if (!this.db) return null
    try {
      const res = await this.db.collection('users').where({
        _openid: '{openid}'
      }).get()
      return res.data.length > 0 ? res.data[0] : null
    } catch (e) {
      console.error('获取用户信息失败:', e)
      return null
    }
  }

  async createUser(userData) {
    if (!this.db) return null
    try {
      const res = await this.db.collection('users').add({
        data: {
          ...userData,
          createdAt: this.db.serverDate()
        }
      })
      return res._id
    } catch (e) {
      console.error('创建用户失败:', e)
      return null
    }
  }

  async updateUser(userId, data) {
    if (!this.db) return false
    try {
      await this.db.collection('users').doc(userId).update({ data })
      return true
    } catch (e) {
      console.error('更新用户失败:', e)
      return false
    }
  }

  // ========== 配对相关 ==========

  async findUserByBindCode(code) {
    if (!this.db) return null
    try {
      const res = await this.db.collection('users').where({ bindCode: code }).get()
      return res.data.length > 0 ? res.data[0] : null
    } catch (e) {
      console.error('查找配对码失败:', e)
      return null
    }
  }

  async bindPartner(myId, partnerId) {
    if (!this.db) return false
    try {
      await this.db.collection('users').doc(myId).update({
        data: { partnerId }
      })
      return true
    } catch (e) {
      console.error('绑定失败:', e)
      return false
    }
  }

  async getPartnerInfo(partnerId) {
    if (!this.db) return null
    try {
      const res = await this.db.collection('users').where({
        _openid: partnerId
      }).get()
      return res.data.length > 0 ? res.data[0] : null
    } catch (e) {
      console.error('获取伴侣信息失败:', e)
      return null
    }
  }

  // ========== 宠物状态 ==========

  async getPetStatus() {
    if (!this.db) return null
    try {
      const res = await this.db.collection('pet_status').where({
        _openid: '{openid}'
      }).get()
      return res.data.length > 0 ? res.data[0] : null
    } catch (e) {
      console.error('获取宠物状态失败:', e)
      return null
    }
  }

  async createPetStatus(petData) {
    if (!this.db) return null
    try {
      const res = await this.db.collection('pet_status').add({
        data: {
          ...petData,
          createdAt: this.db.serverDate(),
          updatedAt: this.db.serverDate()
        }
      })
      return res._id
    } catch (e) {
      console.error('创建宠物状态失败:', e)
      return null
    }
  }

  async updatePetStatus(petId, data) {
    if (!this.db) return false
    try {
      await this.db.collection('pet_status').doc(petId).update({
        data: { ...data, updatedAt: this.db.serverDate() }
      })
      return true
    } catch (e) {
      console.error('更新宠物状态失败:', e)
      return false
    }
  }

  // ========== 每日任务 ==========

  async getDailyTasks(date) {
    if (!this.db) return null
    try {
      const res = await this.db.collection('daily_tasks').where({
        date,
        _openid: '{openid}'
      }).get()
      return res.data.length > 0 ? res.data[0] : null
    } catch (e) {
      console.error('获取每日任务失败:', e)
      return null
    }
  }

  async createDailyTasks(taskData) {
    if (!this.db) return null
    try {
      const res = await this.db.collection('daily_tasks').add({
        data: { ...taskData, createdAt: this.db.serverDate() }
      })
      return res._id
    } catch (e) {
      console.error('创建每日任务失败:', e)
      return null
    }
  }

  async updateDailyTasks(taskDocId, data) {
    if (!this.db) return false
    try {
      await this.db.collection('daily_tasks').doc(taskDocId).update({ data })
      return true
    } catch (e) {
      console.error('更新每日任务失败:', e)
      return false
    }
  }

  // ========== 自定义任务模板 ==========

  async getCustomTasks(ownerOpenid) {
    if (!this.db) return []
    try {
      const res = await this.db.collection('custom_tasks').where({
        ownerOpenid,
        active: true
      }).get()
      return res.data
    } catch (e) {
      console.error('获取自定义任务失败:', e)
      return []
    }
  }

  async addCustomTask(taskData) {
    if (!this.db) return null
    try {
      const res = await this.db.collection('custom_tasks').add({
        data: { ...taskData, active: true, createdAt: this.db.serverDate() }
      })
      return res._id
    } catch (e) {
      console.error('添加自定义任务失败:', e)
      return null
    }
  }

  // ========== 奖惩池 ==========

  async getRewardsPool(ownerOpenid) {
    if (!this.db) return []
    try {
      const res = await this.db.collection('rewards_pool').where({
        ownerOpenid,
        active: true
      }).get()
      return res.data
    } catch (e) {
      console.error('获取奖惩池失败:', e)
      return []
    }
  }

  async addReward(rewardData) {
    if (!this.db) return null
    try {
      const res = await this.db.collection('rewards_pool').add({
        data: { ...rewardData, active: true, createdAt: this.db.serverDate() }
      })
      return res._id
    } catch (e) {
      console.error('添加奖惩失败:', e)
      return null
    }
  }

  // ========== 游戏记录 ==========

  async addGameRecord(record) {
    if (!this.db) return null
    try {
      const res = await this.db.collection('game_records').add({
        data: { ...record, playedAt: this.db.serverDate() }
      })
      return res._id
    } catch (e) {
      console.error('添加游戏记录失败:', e)
      return null
    }
  }

  // ========== 成长日记 ==========

  async getDiary(date) {
    if (!this.db) return null
    try {
      const res = await this.db.collection('diary').where({
        date,
        _openid: '{openid}'
      }).get()
      return res.data.length > 0 ? res.data[0] : null
    } catch (e) {
      console.error('获取日记失败:', e)
      return null
    }
  }

  async saveDiary(diaryData) {
    if (!this.db) return null
    try {
      // 先查是否已有今日日记
      const existing = await this.getDiary(diaryData.date)
      if (existing) {
        await this.db.collection('diary').doc(existing._id).update({
          data: diaryData
        })
        return existing._id
      } else {
        const res = await this.db.collection('diary').add({
          data: { ...diaryData, createdAt: this.db.serverDate() }
        })
        return res._id
      }
    } catch (e) {
      console.error('保存日记失败:', e)
      return null
    }
  }

  async getDiaryList(limit = 30) {
    if (!this.db) return []
    try {
      const res = await this.db.collection('diary').where({
        _openid: '{openid}'
      }).orderBy('date', 'desc').limit(limit).get()
      return res.data
    } catch (e) {
      console.error('获取日记列表失败:', e)
      return []
    }
  }
}
