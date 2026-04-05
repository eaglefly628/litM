/**
 * 任务数据模型
 */

import { TASK_STATUS } from '../config/tasks-config'

export class TaskModel {
  constructor(data = {}) {
    this.id = data.id || ''
    this.name = data.name || ''
    this.type = data.type || 'custom'
    this.status = data.status || TASK_STATUS.PENDING
    this.points = data.points || 10
    this.icon = data.icon || '📌'
    this.detail = data.detail || ''
    this.timeStart = data.timeStart || ''
    this.timeEnd = data.timeEnd || ''
    this.description = data.description || ''
    this.completedAt = data.completedAt || ''
    this.verifiedBy = data.verifiedBy || ''
  }

  get isDone() {
    return this.status === TASK_STATUS.DONE
  }

  get isPending() {
    return this.status === TASK_STATUS.PENDING
  }

  get isSubmitted() {
    return this.status === TASK_STATUS.SUBMITTED
  }

  get isMissed() {
    return this.status === TASK_STATUS.MISSED
  }

  submit(detail = '') {
    this.status = TASK_STATUS.SUBMITTED
    this.detail = detail
    this.completedAt = new Date().toISOString()
  }

  verify() {
    this.status = TASK_STATUS.DONE
    this.verifiedBy = 'owner'
  }

  miss() {
    this.status = TASK_STATUS.MISSED
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      status: this.status,
      points: this.points,
      icon: this.icon,
      detail: this.detail,
      timeStart: this.timeStart,
      timeEnd: this.timeEnd,
      completedAt: this.completedAt,
      verifiedBy: this.verifiedBy
    }
  }
}
