/**
 * 场景管理器 - 管理游戏中所有场景的切换和渲染
 */

export class SceneManager {
  constructor(game) {
    this.game = game
    this.scenes = {}
    this.currentScene = null
    this.currentSceneName = ''
    this.transitioning = false
  }

  register(name, scene) {
    this.scenes[name] = scene
  }

  switchTo(name, data = {}) {
    if (this.transitioning) return
    if (!this.scenes[name]) {
      console.error(`场景 "${name}" 未注册`)
      return
    }

    this.transitioning = true

    // 离开当前场景
    if (this.currentScene && this.currentScene.onLeave) {
      this.currentScene.onLeave()
    }

    this.currentSceneName = name
    this.currentScene = this.scenes[name]

    // 进入新场景
    if (this.currentScene.onEnter) {
      this.currentScene.onEnter(data)
    }

    this.transitioning = false
  }

  render(ctx) {
    if (this.currentScene && this.currentScene.render) {
      this.currentScene.render(ctx)
    }
  }

  onTouchStart(x, y) {
    if (this.currentScene && this.currentScene.onTouchStart) {
      this.currentScene.onTouchStart(x, y)
    }
  }

  onTouchEnd(x, y) {
    if (this.currentScene && this.currentScene.onTouchEnd) {
      this.currentScene.onTouchEnd(x, y)
    }
  }
}

/**
 * 场景基类
 */
export class Scene {
  constructor(game) {
    this.game = game
    this.buttons = []
    this.elements = []
  }

  onEnter(data) {}
  onLeave() {}
  render(ctx) {}
  onTouchStart(x, y) {}

  onTouchEnd(x, y) {
    // 检测按钮点击
    for (const btn of this.buttons) {
      if (btn.visible !== false && this.hitTest(x, y, btn)) {
        if (btn.onClick) btn.onClick()
        return
      }
    }
  }

  hitTest(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.width &&
           y >= rect.y && y <= rect.y + rect.height
  }
}
