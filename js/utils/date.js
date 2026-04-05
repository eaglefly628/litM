/**
 * 日期工具函数
 */

export function getToday() {
  const now = new Date()
  return formatDate(now)
}

export function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatTime(date) {
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

export function formatDateTime(date) {
  return `${formatDate(date)} ${formatTime(date)}`
}

export function isInTimeRange(startTime, endTime) {
  const now = new Date()
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const startMinutes = sh * 60 + sm
  const endMinutes = eh * 60 + em
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes
}

export function isBeforeTime(time) {
  const now = new Date()
  const [h, m] = time.split(':').map(Number)
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const targetMinutes = h * 60 + m
  return currentMinutes <= targetMinutes
}

export function getDaysBetween(date1, date2) {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diff = Math.abs(d2.getTime() - d1.getTime())
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function getWeekDay(date) {
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return '周' + days[new Date(date).getDay()]
}
