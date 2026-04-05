/**
 * 用户数据模型
 */

export class UserModel {
  constructor(data = {}) {
    this._id = data._id || ''
    this._openid = data._openid || ''
    this.nickname = data.nickname || ''
    this.avatar = data.avatar || ''
    this.role = data.role || ''       // 'owner' | 'pet'
    this.bindCode = data.bindCode || ''
    this.partnerId = data.partnerId || ''
    this.createdAt = data.createdAt || null
  }

  get isOwner() {
    return this.role === 'owner'
  }

  get isPet() {
    return this.role === 'pet'
  }

  get isBound() {
    return !!this.partnerId
  }

  toJSON() {
    return {
      nickname: this.nickname,
      avatar: this.avatar,
      role: this.role,
      bindCode: this.bindCode,
      partnerId: this.partnerId
    }
  }
}
