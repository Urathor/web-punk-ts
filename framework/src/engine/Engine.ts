import type { EngineConfig } from './EngineConfig'
import type { IScene       } from './IScene'
import type { IEngine      } from './IEngine'
import type { IRenderer    } from '@engine/renderer'
import { GameLoop           } from './GameLoop'
import { SceneManager       } from './SceneManager'
import type { ISceneManager } from './ISceneManager'
import { AssetLoader        } from '@engine/assets'
import type { IAssetLoader  } from '@engine/assets'
import { InputManager       } from '@engine/input'
import type { IInputManager } from '@engine/input'
import { ActionMap          } from '@engine/input'
import type { IActionMap    } from '@engine/input'
import { Camera             } from '@engine/camera'
import type { ICamera       } from '@engine/camera'
import { CollisionSystem    } from '@engine/collision'
import type { ICollisionSystem } from '@engine/collision'
import { BoxCollider        } from '@engine/collision'
import { AudioManager       } from '@engine/audio'
import type { IAudioManager } from '@engine/audio'
import { UIManager, setAnchorCanvasSize } from '@engine/ui'
import type { IUIManager    } from '@engine/ui'
import { EventEmitter       } from '@engine/events'
import type { IEventEmitter } from '@engine/events'
import type { GameEventMap  } from '@engine/events'
import { SaveManager        } from '@engine/save'
import type { ISaveManager  } from '@engine/save'
import { LocalStorageSaveProvider } from '@engine/save'
import { DebugOverlay, Debugger } from '@engine/debug'
import type { IDebugger } from '@engine/debug'

const DEBUG_OVERLAY_ENABLED = process.env.NODE_ENV !== 'production'

export class Engine implements IEngine {
  readonly renderer:     IRenderer
  readonly debugger:     IDebugger | null
  readonly sceneManager: ISceneManager
  readonly assets:       IAssetLoader
  readonly input:        IInputManager
  readonly actions:      IActionMap
  readonly camera:       ICamera
  readonly collision:    ICollisionSystem
  readonly audio:        IAudioManager
  readonly ui:           IUIManager
  readonly events:       IEventEmitter<GameEventMap>
  readonly save:         ISaveManager

  private readonly loop: GameLoop

  private _fps          = 0
  private _frames       = 0
  private _fpsTimer     = 0
  private _lastFrameMs  = 0

  // Debug overlay — instantiated only in DEV builds; null in production.
  private readonly debugOverlay: DebugOverlay | null =
    DEBUG_OVERLAY_ENABLED ? new DebugOverlay() : null

  constructor(config: EngineConfig) {
    this.renderer     = config.renderer
    this.debugger     = DEBUG_OVERLAY_ENABLED ? new Debugger() : null
    this.sceneManager = new SceneManager()
    this.assets       = new AssetLoader()
    this.assets.setDebugger(this.debugger)
    this.input        = new InputManager(config.canvas, this.renderer)
    this.actions      = new ActionMap(this.input)
    this.camera       = new Camera()
    this.camera.viewport.width  = this.renderer.logicalWidth
    this.camera.viewport.height = this.renderer.logicalHeight
    setAnchorCanvasSize(this.renderer.logicalWidth, this.renderer.logicalHeight)
    this.collision    = new CollisionSystem()
    this.audio        = new AudioManager()
    this.audio.setDebugger(this.debugger)
    this.ui           = new UIManager()
    this.events       = new EventEmitter<GameEventMap>()
    this.save         = new SaveManager(config.saveProvider ?? new LocalStorageSaveProvider())
    this.save.setDebugger(this.debugger)
    this.collision.setEventBus(this.events)

    this.loop = new GameLoop({
      fixedUpdate: (dt) => this.fixedUpdate(dt),
      update:      (dt) => this.update(dt),
      render:      (ip) => this.render(ip)
    })

    // Wire event logging to the debug overlay
    if (DEBUG_OVERLAY_ENABLED && this.debugger) {
      this.events._emitHook = (e) => (this.debugger as Debugger).logEvent(e)
      
      window.addEventListener('wheel', (e) => {
        const dbg = this.debugger as Debugger
        if (dbg.visible && dbg.expandedLog) {
          const maxLines = Math.floor((this.renderer.logicalHeight / 2 - 12) / 8)
          dbg.scrollLog(e.deltaY > 0 ? 1 : -1, maxLines)
        }
      }, { passive: true })
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

    if (DEBUG_OVERLAY_ENABLED && this.debugger) {
      const dbg = this.debugger as Debugger
      if (this.input.isKeyPressed('Backquote')) dbg.toggle()

      if (dbg.visible) {
        if (this.input.isKeyPressed('KeyL')) {
          dbg.toggleLogExpansion()
        }
        if (this.input.isMousePressed(0)) {
          dbg.handleMouseClick(
            this.input.mousePosition,
            this.collision.allColliders,
            this.camera,
            this.renderer.logicalWidth,
            this.renderer.logicalHeight
          )
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

    if (DEBUG_OVERLAY_ENABLED) {
      const dbg = this.debugger as Debugger
      if (dbg && dbg.visible && this.debugOverlay) {
        const stats = {
          fps:           this._fps,
          frameTimeMs:   this._lastFrameMs,
          colliderCount: this.collision.allColliders.length,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          drawCalls:     (this.renderer as any).gameDrawCallsLastFrame ?? 0,
          debugDrawCalls: (this.renderer as any).debugDrawCallsLastFrame ?? 0,
          sceneStack:    this.sceneManager.allScenes.map(s => s.constructor.name),
        }
        if (this.renderer.setDebugMode) {
          this.renderer.setDebugMode(true)
        }
        this.debugOverlay.renderColliders(this.renderer, this.collision.allColliders, this.camera, dbg)
        this.debugOverlay.render(this.renderer, dbg, stats)
        this.debugOverlay.renderInspector(this.renderer, dbg)
        this.debugOverlay.renderEventMonitor(this.renderer, dbg)
        this.debugOverlay.renderSystemPanel(this.renderer, dbg, this.input, this.audio)
        this.debugOverlay.renderMessageLog(this.renderer, dbg)
        if (this.renderer.setDebugMode) {
          this.renderer.setDebugMode(false)
        }
      } else {
        // Minimal FPS counter when overlay is disabled
        this.renderer.drawText(`FPS: ${this._fps}`, { x: 4, y: 10 }, { color: '#00ff88', size: 8 })
      }
    }

    this.input.endFrame()
  }
}

