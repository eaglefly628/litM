const { createApp, ref, reactive, computed, onMounted, watch, nextTick } = Vue

const app = createApp({
  setup() {
    // ===== State =====
    const user = ref(null)
    const pet = ref({ level: 1, exp: 0, points: 100, total_points: 100, mood: 'happy', affection: 50, title: '初来乍到的小狗', streak: 0 })
    const currentPage = ref('home')
    const showRegister = ref(false)
    const errorMsg = ref('')
    const toast = ref(null)
    const today = ref(new Date().toISOString().split('T')[0])

    // Login
    const loginForm = reactive({ username: '', password: '' })
    const registerForm = reactive({ username: '', password: '', nickname: '', role: 'pet' })
    const bindCodeInput = ref('')

    // Tasks
    const tasks = ref([])
    const todayCompleted = ref(0)
    const todayTotal = ref(0)

    // Games
    const gameMode = ref(null)
    const wheelSpinning = ref(false)
    const wheelResult = ref(null)
    const wheelAngle = ref(0)
    const wheelItems = ref([])
    const diceValues = ref([0, 0])
    const diceRolling = ref(false)
    const diceResult = ref(null)
    const diceEmojis = { 1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅' }
    const todType = ref(null)
    const todQuestion = ref('')
    const todShowRating = ref(false)
    const randomEvent = ref(null)

    // Shop
    const shopTab = ref('rewards')
    const shopRewards = ref([])
    const shopPunishments = ref([])
    const shopPoints = ref(0)

    // Diary
    const diaryMood = ref('')
    const diaryMeals = reactive({ breakfast: '', lunch: '', dinner: '' })
    const diaryHighlights = ref('')
    const diaryComment = ref('')
    const showDiaryHistory = ref(false)
    const diaryHistory = ref([])

    const moods = [
      { emoji: '😊', label: '开心' }, { emoji: '🥰', label: '甜蜜' },
      { emoji: '😌', label: '平静' }, { emoji: '😐', label: '一般' },
      { emoji: '😢', label: '难过' }, { emoji: '😤', label: '生气' }
    ]

    // ===== Computed =====
    const petEmoji = computed(() => {
      const l = pet.value.level
      if (l >= 30) return '🐕'
      if (l >= 20) return '🦮'
      if (l >= 10) return '🐩'
      return '🐶'
    })
    const moodEmoji = computed(() => {
      const m = pet.value.mood
      return m === 'happy' ? '😊' : m === 'normal' ? '😐' : '😢'
    })
    const expForNext = computed(() => Math.floor(50 * Math.pow(1.15, pet.value.level - 1)))
    const expProgress = computed(() => Math.min(100, (pet.value.exp / expForNext.value) * 100))

    // ===== API =====
    async function api(url, data) {
      const opts = data ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) } : {}
      const res = await fetch('/api' + url, opts)
      return await res.json()
    }

    function showToast(message, type = 'info') {
      toast.value = { message, type }
      setTimeout(() => toast.value = null, 2500)
    }

    // ===== Auth =====
    async function checkLogin() {
      const res = await api('/auth/me')
      if (res.code === 0 && res.data.user) {
        user.value = res.data.user
        if (res.data.petStatus) pet.value = res.data.petStatus
        if (!user.value.partnerId) currentPage.value = 'bind'
        loadTasks()
      }
    }

    async function login() {
      errorMsg.value = ''
      const res = await api('/auth/login', loginForm)
      if (res.code === 0) {
        showToast('登录成功！', 'success')
        await checkLogin()
      } else {
        errorMsg.value = res.message
      }
    }

    async function register() {
      errorMsg.value = ''
      if (!registerForm.role) { errorMsg.value = '请选择角色'; return }
      const res = await api('/auth/register', registerForm)
      if (res.code === 0) {
        showToast('注册成功！', 'success')
        await checkLogin()
      } else {
        errorMsg.value = res.message
      }
    }

    async function bind() {
      errorMsg.value = ''
      const res = await api('/auth/bind', { code: bindCodeInput.value })
      if (res.code === 0) {
        showToast('配对成功！🎉', 'success')
        await checkLogin()
        currentPage.value = 'home'
      } else {
        errorMsg.value = res.message
      }
    }

    // ===== Tasks =====
    async function loadTasks() {
      const res = await api('/tasks/today')
      if (res.code === 0) {
        tasks.value = res.data.tasks
        todayCompleted.value = res.data.completed
        todayTotal.value = res.data.total
      }
    }

    async function checkinTask(taskId) {
      const detail = prompt('记录一下吧~（如吃了什么）')
      if (detail === null) return
      const res = await api('/tasks/checkin', { taskId, detail })
      if (res.code === 0) {
        showToast('打卡成功！等待主人确认~', 'success')
        loadTasks()
      } else {
        showToast(res.message, 'error')
      }
    }

    async function verifyTask(taskId) {
      const res = await api('/tasks/verify', { taskId })
      if (res.code === 0) {
        showToast(`确认成功！+${res.data.points}积分`, 'success')
        loadTasks()
        await checkLogin()
      } else {
        showToast(res.message, 'error')
      }
    }

    async function createTask() {
      const name = prompt('输入任务名称')
      if (!name) return
      const pointsStr = prompt('积分值（默认15）')
      const points = parseInt(pointsStr) || 15
      const res = await api('/tasks/custom', { name, points, recurring: false })
      if (res.code === 0) {
        showToast('任务创建成功！', 'success')
        loadTasks()
      }
    }

    function goTasks() {
      currentPage.value = 'tasks'
      loadTasks()
    }

    // ===== Games =====
    async function spinWheel() {
      if (wheelSpinning.value) return
      wheelSpinning.value = true
      wheelResult.value = null

      const res = await api('/games/wheel', {})
      if (res.code === 0) {
        const result = res.data.result
        wheelItems.value = res.data.items || []

        // 找到结果的索引
        const items = res.data.items || []
        const idx = items.findIndex(i => i.text === result.text)
        const slotAngle = 360 / items.length
        const targetAngle = idx >= 0 ? idx * slotAngle + slotAngle / 2 : 0
        const spins = (3 + Math.floor(Math.random() * 3)) * 360
        const finalAngle = wheelAngle.value + spins + (360 - targetAngle)

        animateWheel(wheelAngle.value, finalAngle, 3000, () => {
          wheelAngle.value = finalAngle % 360
          wheelSpinning.value = false
          wheelResult.value = result
          refreshPet()
        })
      }
    }

    function animateWheel(from, to, duration, cb) {
      const start = performance.now()
      function tick(now) {
        const elapsed = now - start
        const progress = Math.min(1, elapsed / duration)
        const ease = 1 - Math.pow(1 - progress, 3)
        const current = from + (to - from) * ease
        drawWheel(current)
        if (progress < 1) {
          requestAnimationFrame(tick)
        } else {
          cb()
        }
      }
      requestAnimationFrame(tick)
    }

    function drawWheel(angle) {
      const canvas = document.querySelector('[data-ref="wheelCanvas"]') || document.querySelector('canvas')
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      const cx = 140, cy = 140, r = 130
      const items = wheelItems.value.length ? wheelItems.value : [
        { text: '主人夸夸', color: '#FF6B9D' }, { text: '做深蹲10个', color: '#C084FC' },
        { text: '加20积分', color: '#4ADE80' }, { text: '唱一首歌', color: '#FB923C' },
        { text: '加10积分', color: '#60A5FA' }, { text: '说"主人棒"', color: '#FBBF24' },
        { text: '大奖50分', color: '#F43F5E' }, { text: '做俯卧撑5个', color: '#8B5CF6' }
      ]
      const slotAngle = (Math.PI * 2) / items.length

      ctx.clearRect(0, 0, 280, 280)
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate((angle * Math.PI) / 180)

      items.forEach((item, i) => {
        const start = i * slotAngle
        const end = start + slotAngle
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.arc(0, 0, r, start, end)
        ctx.closePath()
        ctx.fillStyle = item.color
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.save()
        ctx.rotate(start + slotAngle / 2)
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 12px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(item.text, r * 0.65, 4)
        ctx.restore()
      })
      ctx.restore()
    }

    async function rollDice() {
      if (diceRolling.value) return
      diceRolling.value = true
      diceResult.value = null

      let count = 0
      const interval = setInterval(() => {
        diceValues.value = [Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)]
        count++
        if (count >= 15) {
          clearInterval(interval)
          finishDice()
        }
      }, 100)
    }

    async function finishDice() {
      const res = await api('/games/dice', {})
      if (res.code === 0) {
        diceValues.value = [res.data.ownerDice, res.data.petDice]
        diceResult.value = res.data
        diceRolling.value = false
        if (res.data.points) refreshPet()
      }
    }

    async function pickTod(type) {
      const res = await api('/games/tod', { type })
      if (res.code === 0) {
        todType.value = res.data.type
        todQuestion.value = res.data.question
        todShowRating.value = false
      }
    }

    async function rateTod(points) {
      await api('/games/tod/rate', { points, question: todQuestion.value })
      showToast(points > 0 ? `+${points}积分！` : `${points}积分`, points > 0 ? 'success' : 'error')
      todQuestion.value = ''
      todType.value = null
      todShowRating.value = false
      refreshPet()
    }

    async function playRandomEvent() {
      gameMode.value = 'event'
      const res = await api('/games/random-event', {})
      if (res.code === 0) {
        randomEvent.value = res.data
        refreshPet()
      }
    }

    // ===== Shop =====
    async function loadShop() {
      const res = await api('/shop/list')
      if (res.code === 0) {
        shopRewards.value = res.data.rewards
        shopPunishments.value = res.data.punishments
        shopPoints.value = res.data.currentPoints
      }
    }

    async function redeemReward(item) {
      if (!confirm(`确定要用 ${item.points_cost} 积分兑换「${item.content}」吗？`)) return
      const res = await api('/shop/redeem', { rewardId: item.id })
      if (res.code === 0) {
        showToast(res.message, 'success')
        loadShop()
        refreshPet()
      } else {
        showToast(res.message, 'error')
      }
    }

    async function addShopItem() {
      const content = prompt(`输入${shopTab.value === 'rewards' ? '奖励' : '惩罚'}内容`)
      if (!content) return
      const type = shopTab.value === 'rewards' ? 'reward' : 'punishment'
      const pointsCost = type === 'reward' ? (parseInt(prompt('需要多少积分兑换？(默认50)')) || 50) : 0
      const res = await api('/shop/add', { type, content, pointsCost })
      if (res.code === 0) {
        showToast('添加成功！', 'success')
        loadShop()
      }
    }

    async function removeShopItem(id) {
      if (!confirm('确定删除？')) return
      await api('/shop/remove', { id })
      loadShop()
    }

    function goShop() {
      currentPage.value = 'shop'
      loadShop()
    }

    function categoryClass(category) {
      const map = { '铜级': 'badge-bronze', '银级': 'badge-silver', '金级': 'badge-gold', '钻石级': 'badge-diamond', '轻度': 'badge-light', '中度': 'badge-medium', '重度': 'badge-heavy' }
      return map[category] || 'badge-gray'
    }

    // ===== Diary =====
    async function loadDiary() {
      const res = await api('/diary/today')
      if (res.code === 0 && res.data) {
        diaryMood.value = res.data.mood || ''
        diaryMeals.breakfast = res.data.meal_breakfast || ''
        diaryMeals.lunch = res.data.meal_lunch || ''
        diaryMeals.dinner = res.data.meal_dinner || ''
        diaryHighlights.value = res.data.highlights || ''
        diaryComment.value = res.data.owner_comment || ''
      }
    }

    async function saveMood(mood) {
      diaryMood.value = mood
      await api('/diary/mood', { mood })
      showToast('心情已记录~', 'success')
    }

    async function saveMeal(meal, content) {
      diaryMeals[meal] = content
      await api('/diary/meal', { meal, content })
    }

    async function writeDiary() {
      const text = prompt('记录今天的点滴...')
      if (!text) return
      await api('/diary/write', { highlights: text })
      diaryHighlights.value = text
      showToast('日记已保存~', 'success')
    }

    async function writeComment() {
      const text = prompt('给小源写一句话吧~')
      if (!text) return
      await api('/diary/comment', { comment: text })
      diaryComment.value = text
      showToast('留言已保存~', 'success')
    }

    async function loadDiaryHistory() {
      const res = await api('/diary/history')
      if (res.code === 0) diaryHistory.value = res.data
    }

    function goDiary() {
      currentPage.value = 'diary'
      showDiaryHistory.value = false
      loadDiary()
    }

    function getMoodEmoji(label) {
      const m = moods.find(x => x.label === label)
      return m ? m.emoji : '😐'
    }

    // ===== Helpers =====
    async function refreshPet() {
      const res = await api('/auth/me')
      if (res.code === 0 && res.data.petStatus) {
        pet.value = res.data.petStatus
      }
    }

    // ===== Init =====
    onMounted(() => {
      checkLogin()
    })

    // 监听游戏页面切换时初始化转盘
    watch([gameMode], () => {
      if (gameMode.value === 'wheel') {
        nextTick(() => {
          fetch('/api/games/wheel/items').then(r => r.json()).then(res => {
            if (res.code === 0) wheelItems.value = res.data
            drawWheel(wheelAngle.value)
          })
        })
      }
    })

    return {
      user, pet, currentPage, showRegister, errorMsg, toast, today,
      loginForm, registerForm, bindCodeInput,
      tasks, todayCompleted, todayTotal,
      gameMode, wheelSpinning, wheelResult, diceValues, diceRolling, diceResult, diceEmojis,
      todType, todQuestion, todShowRating, randomEvent,
      shopTab, shopRewards, shopPunishments, shopPoints,
      diaryMood, diaryMeals, diaryHighlights, diaryComment, showDiaryHistory, diaryHistory, moods,
      petEmoji, moodEmoji, expForNext, expProgress,
      login, register, bind,
      checkinTask, verifyTask, createTask, goTasks, loadTasks,
      spinWheel, rollDice, pickTod, rateTod, playRandomEvent,
      redeemReward, addShopItem, removeShopItem, goShop, categoryClass, loadShop,
      saveMood, saveMeal, writeDiary, writeComment, loadDiaryHistory, goDiary, getMoodEmoji
    }
  }
})

app.mount('#app')
