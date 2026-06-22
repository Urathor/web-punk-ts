import type { EngineConfig } from './EngineConfig'
import type { IScene       } from './IScene'
import type { IEngine      } from './IEngine'
import type { IRenderer    } from '@engine/renderer'
import { GameLoop           } from './GameLoop'
import { SceneManager       } from './SceneManager'
import { AssetLoader        } from '@engine/assets'
import { InputManager       } from '@engine/input'
import { ActionMap          } from '@engine/input'
import { Camera             } from '@engine/camera'
import { CollisionSystem    } from '@engine/collision'
import { BoxCollider        } from '@engine/collision'
import { AudioManager       } from '@engine/audio'
import { UIManager, setAnchorCanvasSize } from '@engine/ui'
import { EventEmitter       } from '@engine/events'
import type { GameEventMap  } from '@engine/events'
import { SaveManager        } from '@engine/save'
import { LocalStorageSaveProvider } from '@engine/save'
import { DebugOverlay       } from '@engine/debug'

export class Engine implements IEngine {
  readonly renderer:     IRenderer
  readonly debug:        boolean
  readonly sceneManager: SceneManager
  readonly assets:       AssetLoader
  readonly input:        InputManager
  readonly actions:      ActionMap
  readonly camera:       Camera
  readonly collision:    CollisionSystem
  readonly audio:        AudioManager
  readonly ui:           UIManager
  readonly events:       EventEmitter<GameEventMap>
  readonly save:         SaveManager

  private readonly loop: GameLoop

  private _fps          = 0
  private _frames       = 0
  private _fpsTimer     = 0
  private _lastFrameMs  = 0

  // Debug overlay — instantiated only in DEV builds; null in production.
  private readonly debugOverlay: DebugOverlay | null =
    import.meta.env.DEV ? new DebugOverlay() : null

  constructor(config: EngineConfig) {
    this.renderer     = config.renderer
    this.debug        = config.debug ?? false
    this.sceneManager = new SceneManager()
    this.assets       = new AssetLoader()
    this.input        = new InputManager(config.canvas, this.renderer)
    this.actions      = new ActionMap(this.input)
    this.camera       = new Camera()
    this.camera.viewport.width  = this.renderer.logicalWidth
    this.camera.viewport.height = this.renderer.logicalHeight
    setAnchorCanvasSize(this.renderer.logicalWidth, this.renderer.logicalHeight)
    this.collision    = new CollisionSystem()
    this.audio        = new AudioManager()
    this.ui           = new UIManager()
    this.events       = new EventEmitter<GameEventMap>()
    this.save         = new SaveManager(config.saveProvider ?? new LocalStorageSaveProvider())
    this.collision.setEventBus(this.events)

    this.loop = new GameLoop({
      fixedUpdate: (dt) => this.fixedUpdate(dt),
      update:      (dt) => this.update(dt),
      render:      (ip) => this.render(ip)
    })

    // Wire event logging to the debug overlay
    if (import.meta.env.DEV && this.debugOverlay) {
      this.events._emitHook = (e) => this.debugOverlay!.logEvent(e)
    }
  }

  /** Preload the initial scene then start the game loop. */
  async start(initialScene: IScene): Promise<void> {
    await this.sceneManager.push(initialScene, this)
    this.events.emit('engine:started', { timestamp: Date.now() })
    this.loop.start()
  }

  stop(): void {
    this.loop.stop()
    this.input.dispose()
    this.events.emit('engine:stopped', {})
  }

  // ── Scene stack convenience (fire-and-forget during loop) ─────────────────

  pushScene(scene: IScene): void         { void this.sceneManager.push(scene, this) }
  popScene():                 void       { this.sceneManager.pop(this) }
  replaceScene(scene: IScene): void      { void this.sceneManager.replace(scene, this) }
  replaceSceneUnder(scene: IScene): void { void this.sceneManager.replaceUnder(scene, this) }

  // ── Private loop steps ────────────────────────────────────────────────────

  private fixedUpdate(dt: number): void {
    this.sceneManager.activeScene?.fixedUpdate(dt)
    this.collision.update()
  }

  private update(dt: number): void {
    this._lastFrameMs = dt
    this._frames++
    this._fpsTimer += dt
    if (this._fpsTimer >= 1000) {
      this._fps     = this._frames
      this._frames  = 0
      this._fpsTimer -= 1000
    }
    this.camera.update(dt)
    this.ui.update(dt)
    this.sceneManager.activeScene?.update(dt)

    if (import.meta.env.DEV && this.debugOverlay) {
      if (this.input.isKeyPressed('Backquote')) this.debugOverlay.toggle()

      if (this.debugOverlay.visible && this.input.isMousePressed(0)) {
        const worldMouse = this.input.mousePosition.add(this.camera.position)
        for (const collider of this.collision.allColliders) {
          if (collider instanceof BoxCollider && collider.getWorldBounds().contains(worldMouse)) {
            this.debugOverlay.inspectEntity(collider.entity)
            break
          }
        }
      }
    }
  }

  private render(interpolation: number): void {
    this.renderer.clear()
    this.camera.render(this.renderer, interpolation)
    // Render every scene in the stack so overlays (pause menu) appear above
    // the game world without unloading it.
    for (const scene of this.sceneManager.allScenes) {
      scene.render(this.renderer, interpolation)
    }
    // UI renders last (always on top, no camera transform)
    this.ui.render(this.renderer, interpolation)

    if (import.meta.env.DEV) {
      if (this.debugOverlay) {
        const stats = {
          fps:           this._fps,
          frameTimeMs:   this._lastFrameMs,
          colliderCount: this.collision.allColliders.length,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          drawCalls:     (this.renderer as any).drawCallsLastFrame ?? 0,
          sceneStack:    this.sceneManager.allScenes.map(s => s.constructor.name),
        }
        this.debugOverlay.renderColliders(this.renderer, this.collision.allColliders, this.camera)
        this.debugOverlay.render(this.renderer, stats)
        this.debugOverlay.renderInspector(this.renderer)
        this.debugOverlay.renderEventMonitor(this.renderer)
        this.debugOverlay.renderInputState(this.renderer, this.input, this.actions)
        this.debugOverlay.renderAudioState(this.renderer, this.audio)
      } else {
        // Minimal FPS counter when overlay is disabled
        this.renderer.drawText(`FPS: ${this._fps}`, { x: 4, y: 10 }, { color: '#00ff88', size: 8 })
      }
    }

    this.input.endFrame()
  }
}

