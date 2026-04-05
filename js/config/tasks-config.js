/**
 * 预设任务配置
 */

export const PRESET_TASKS = [
  {
    id: 'breakfast',
    name: '按时吃早饭',
    type: 'meal',
    points: 10,
    icon: '🥣',
    timeStart: '07:00',
    timeEnd: '09:00',
    description: '早上7-9点之间完成早餐打卡'
  },
  {
    id: 'lunch',
    name: '按时吃午饭',
    type: 'meal',
    points: 10,
    icon: '🍱',
    timeStart: '11:30',
    timeEnd: '13:30',
    description: '中午11:30-13:30之间完成午餐打卡'
  },
  {
    id: 'dinner',
    name: '按时吃晚饭',
    type: 'meal',
    points: 10,
    icon: '🍽️',
    timeStart: '17:30',
    timeEnd: '19:30',
    description: '下午17:30-19:30之间完成晚餐打卡'
  },
  {
    id: 'sleep',
    name: '按时睡觉',
    type: 'sleep',
    points: 15,
    icon: '😴',
    timeEnd: '23:00',
    description: '23:00之前上床睡觉'
  },
  {
    id: 'water',
    name: '喝够8杯水',
    type: 'health',
    points: 5,
    icon: '💧',
    description: '今天喝够8杯水'
  },
  {
    id: 'exercise',
    name: '运动30分钟',
    type: 'exercise',
    points: 20,
    icon: '🏃',
    description: '完成至少30分钟的运动'
  },
  {
    id: 'mood',
    name: '心情记录',
    type: 'mood',
    points: 5,
    icon: '📝',
    description: '记录今天的心情和感受'
  }
]

// 任务状态
export const TASK_STATUS = {
  PENDING: 'pending',       // 待完成
  SUBMITTED: 'submitted',   // 已提交，待主人确认
  DONE: 'done',            // 已完成
  MISSED: 'missed'         // 已过期未完成
}

// 惩罚规则
export const PENALTY_RULES = {
  MISS_TASK_RATIO: 0.5,     // 未完成扣对应分数的50%
  STREAK_BREAK_AFFECTION: -10, // 连续3天未打卡扣亲密度
  STREAK_BREAK_DAYS: 3
}
