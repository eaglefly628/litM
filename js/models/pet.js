/**
 * 宠物状态数据模型
 */

import { getExpForLevel, getTitleForLevel } from '../config/levels-config'

export class PetModel {
  constructor(data = {}) {
    this._id = data._id || ''
    this.petOpenid = data.petOpenid || ''
    this.level = data.level || 1
    this.exp = data.exp || 0
    this.points = data.points || 100
    this.totalPoints = data.totalPoints || 100
    this.mood = data.mood || 'happy'
    this.affection = data.affection || 50
    this.title = data.title || '初来乍到的小狗'
    this.appearance = data.appearance || 'default'
    this.streak = data.streak || 0
    this.lastCheckIn = data.lastCheckIn || ''
    this.updatedAt = data.updatedAt || null
  }

  get expForNextLevel() {
    return getExpForLevel(this.level)
  }

  get expProgress() {
    return this.exp / this.expForNextLevel
  }

  addExp(amount) {
    this.exp += amount
    let leveledUp = false

    while (this.exp >= this.expForNextLevel) {
      this.exp -= this.expForNextLevel
      this.level++
      leveledUp = true
    }

    if (leveledUp) {
      const titleInfo = getTitleForLevel(this.level)
      this.title = titleInfo.title
    }

    return leveledUp
  }

  addPoints(amount) {
    this.points = Math.max(0, this.points + amount)
    if (amount > 0) {
      this.totalPoints += amount
    }
  }

  updateMood() {
    if (this.affection >= 80) {
      this.mood = 'happy'
    } else if (this.affection >= 40) {
      this.mood = 'normal'
    } else {
      this.mood = 'sad'
    }
  }

  toJSON() {
    return {
      level: this.level,
      exp: this.exp,
      points: this.points,
      totalPoints: this.totalPoints,
      mood: this.mood,
      affection: this.affection,
      title: this.title,
      appearance: this.appearance,
      streak: this.streak,
      lastCheckIn: this.lastCheckIn
    }
  }
}
