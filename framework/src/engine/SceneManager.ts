import type { IScene  } from './IScene'
import type { IEngine } from './IEngine'
import { LoadingScene  } from './LoadingScene'

export class SceneManager {
  private readonly stack: IScene[] = []

  get activeScene(): IScene | undefined {
    return this.stack[this.stack.length - 1]
  }

  /** All scenes in the stack, bottom-first. Used by Engine to render every layer. */
  get allScenes(): readonly IScene[] {
    return this.stack
  }

  async push(scene: IScene, engine: IEngine): Promise<void> {
    this.activeScene?.onPause()
    if (scene.preload) {
      const loading = new LoadingScene()
      this.stack.push(loading)
      try {
        await scene.preload(engine, (p) => { loading.progress = p })
      } catch (err) {
        console.error('[SceneManager] preload failed:', err)
        this.stack.pop()  // remove loading scene
        this.activeScene?.onResume()
        return
      }
      this.stack.pop()
    }
    this.stack.push(scene)
    scene.onEnter(engine)
  }

  pop(): void {
    const scene = this.stack.pop()
    scene?.onExit()
    this.activeScene?.onResume()
  }

  async replace(scene: IScene, engine: IEngine): Promise<void> {
    const old = this.stack.pop()
    old?.onExit()
    if (scene.preload) {
      const loading = new LoadingScene()
      this.stack.push(loading)
      try {
        await scene.preload(engine, (p) => { loading.progress = p })
      } catch (err) {
        console.error('[SceneManager] preload failed:', err)
        this.stack.pop()  // remove loading scene
        return
      }
      this.stack.pop()
    }
    this.stack.push(scene)
    scene.onEnter(engine)
  }

  clear(): void {
    while (this.stack.length > 0) {
      this.stack.pop()?.onExit()
    }
  }

  /**
   * Replace the scene directly below the current top scene, keeping the top
   * scene (e.g. a FadeScene overlay) undisturbed.
   * Falls back to a normal replace when the stack has only one scene.
   */
  async replaceUnder(scene: IScene, engine: IEngine): Promise<void> {
    if (this.stack.length < 2) {
      return this.replace(scene, engine)
    }
    // Temporarily lift the top scene off the stack
    const topScene = this.stack.pop()!
    const old      = this.stack.pop()
    old?.onExit()
    if (scene.preload) {
      try {
        await scene.preload(engine, () => {})
      } catch (err) {
        console.error('[SceneManager] replaceUnder preload failed:', err)
        this.stack.push(topScene)
        return
      }
    }
    this.stack.push(scene)
    scene.onEnter(engine)
    this.stack.push(topScene)
  }
}
