/**
 * 本地缓存管理器 - 封装wx本地存储
 */

export class StorageManager {
  constructor() {
    this.prefix = 'xy_' // 小源前缀，避免key冲突
  }

  get(key) {
    try {
      return wx.getStorageSync(this.prefix + key)
    } catch (e) {
      console.error('读取缓存失败:', key, e)
      return null
    }
  }

  set(key, value) {
    try {
      wx.setStorageSync(this.prefix + key, value)
      return true
    } catch (e) {
      console.error('写入缓存失败:', key, e)
      return false
    }
  }

  remove(key) {
    try {
      wx.removeStorageSync(this.prefix + key)
      return true
    } catch (e) {
      console.error('删除缓存失败:', key, e)
      return false
    }
  }

  clear() {
    try {
      wx.clearStorageSync()
      return true
    } catch (e) {
      console.error('清空缓存失败:', e)
      return false
    }
  }
}
