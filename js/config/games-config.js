/**
 * 互动小游戏配置
 */

// 真心话题库（情侣互动向）
export const TRUTH_QUESTIONS = [
  '说出你最喜欢主人的3个地方',
  '今天最想对主人说的一句话是什么？',
  '你觉得我们之间最甜蜜的回忆是哪一次？',
  '如果可以和主人去任何地方旅行，你想去哪？',
  '描述一下你心目中和主人的理想周末',
  '你最近偷偷想主人的时候在做什么？',
  '说出一件你一直想为主人做但还没做的事',
  '用三个词形容今天的心情',
  '你最喜欢主人做的哪道菜？',
  '如果只能带一样东西去荒岛，你会带什么？',
  '说出你们在一起最搞笑的一件事',
  '你觉得主人最可爱的瞬间是什么时候？',
  '形容一下第一次见到主人的感觉',
  '你偷偷为主人做过什么主人不知道的事？',
  '如果可以回到过去的一天，你会选哪天？'
]

// 大冒险题库（情侣互动向）
export const DARE_CHALLENGES = [
  '给主人发一条超甜的语音消息',
  '给主人唱一首歌（录音发送）',
  '拍一张此刻最美的自拍发给主人',
  '给主人写一段50字以内的小情书',
  '模仿一个主人的口头禅并录视频',
  '给主人做一顿爱心早餐（明天执行）',
  '立刻给主人打一个电话说"我想你了"',
  '画一幅主人的画像（不限水平）',
  '用最甜的声音叫一声"主人~"',
  '发一张你今天吃的饭的照片',
  '做一个可爱的表情并自拍',
  '用语音说出"主人我爱你"',
  '给主人列出今天的愿望清单',
  '模仿一只小狗的叫声发语音',
  '给主人发一个红包（金额随意）'
]

// 每日随机事件
export const RANDOM_EVENTS = [
  { text: '今天是特别乖巧日！所有任务积分翻倍~', effect: 'double_points', icon: '🌟', probability: 0.1 },
  { text: '幸运降临！免费获得一次转盘机会', effect: 'free_wheel', icon: '🎰', probability: 0.15 },
  { text: '主人心情好！额外奖励20积分', effect: 'bonus_points', value: 20, icon: '🎉', probability: 0.15 },
  { text: '今天是撒娇日，小源可以免除一个任务', effect: 'skip_task', icon: '🎀', probability: 0.1 },
  { text: '神秘宝箱！随机获得10-50积分', effect: 'random_points', icon: '📦', probability: 0.15 },
  { text: '亲密度UP！今天互动增加双倍亲密度', effect: 'double_affection', icon: '💕', probability: 0.1 },
  { text: '平静的一天，一切照常~', effect: 'none', icon: '☀️', probability: 0.25 }
]

// 默认转盘配置
export const DEFAULT_WHEEL_ITEMS = [
  { text: '主人夸夸', color: '#FF6B9D', points: 10 },
  { text: '做深蹲10个', color: '#C084FC', points: -5 },
  { text: '加20积分', color: '#4ADE80', points: 20 },
  { text: '唱一首歌', color: '#FB923C', points: 0 },
  { text: '加10积分', color: '#60A5FA', points: 10 },
  { text: '说"主人棒"', color: '#FBBF24', points: -5 },
  { text: '大奖50分', color: '#F43F5E', points: 50 },
  { text: '做俯卧撑5个', color: '#8B5CF6', points: -5 }
]

// 骰子特殊事件
export const DICE_SPECIAL_EVENTS = {
  DOUBLE_SIX: { text: '双六！大吉大利！奖励30积分~', points: 30 },
  DOUBLE_ONE: { text: '蛇眼...安慰奖5积分', points: 5 },
  DOUBLE_OTHER: { text: '豹子！主人和小源心意相通~ 奖励15积分', points: 15 }
}

// 游戏消耗配置
export const GAME_COSTS = {
  WHEEL_EXTRA: 20,           // 额外转盘消耗积分
  TRUTH_OR_DARE: 0,         // 真心话大冒险免费
  DICE: 0,                   // 骰子免费
  WHEEL_FREE_DAILY: 1        // 每日免费转盘次数
}

// 真心话大冒险评分
export const TOD_RATINGS = [
  { label: '完美完成', emoji: '⭐⭐⭐', points: 15 },
  { label: '不错哦', emoji: '⭐⭐', points: 10 },
  { label: '勉强及格', emoji: '⭐', points: 5 },
  { label: '没有完成', emoji: '💔', points: -5 }
]
