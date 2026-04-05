/**
 * 简易动画工具
 */

export class Tween {
  constructor(from, to, duration, easing = 'easeOutQuad') {
    this.from = from
    this.to = to
    this.duration = duration
    this.easing = easing
    this.startTime = Date.now()
    this.finished = false
  }

  get value() {
    const elapsed = Date.now() - this.startTime
    const progress = Math.min(1, elapsed / this.duration)

    if (progress >= 1) {
      this.finished = true
      return this.to
    }

    const easedProgress = easingFunctions[this.easing](progress)
    return this.from + (this.to - this.from) * easedProgress
  }
}

const easingFunctions = {
  linear: t => t,
  easeInQuad: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeOutCubic: t => (--t) * t * t + 1,
  easeOutBounce: t => {
    if (t < 1 / 2.75) return 7.5625 * t * t
    if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75
    if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375
  },
  easeOutElastic: t => {
    if (t === 0 || t === 1) return t
    return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
  }
}

/**
 * 浮动动画（用于宠物呼吸效果等）
 */
export class FloatAnimation {
  constructor(amplitude = 5, speed = 0.003) {
    this.amplitude = amplitude
    this.speed = speed
    this.offset = Math.random() * Math.PI * 2
  }

  get value() {
    return Math.sin(Date.now() * this.speed + this.offset) * this.amplitude
  }
}

/**
 * 粒子效果（用于升级、奖励等）
 */
export class ParticleSystem {
  constructor(x, y, count = 20, colors = ['#FF6B9D', '#C084FC', '#FBBF24', '#4ADE80']) {
    this.particles = []
    this.finished = false

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6 - 2,
        size: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        decay: Math.random() * 0.02 + 0.01
      })
    }
  }

  update() {
    let alive = false
    for (const p of this.particles) {
      if (p.life <= 0) continue
      alive = true
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.1 // 重力
      p.life -= p.decay
    }
    this.finished = !alive
  }

  render(ctx) {
    for (const p of this.particles) {
      if (p.life <= 0) continue
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }
}
