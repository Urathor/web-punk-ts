import type { EngineConfig } from './EngineConfig'
import type { IScene       } from './IScene'
import type { IEngine      } from './IEngine'
import type { IRenderer    } from '@engine/renderer'
import { GameLoop           } from './GameLoop'
import { SceneManager       } from './SceneManager'
import type { ISceneManager } from './ISceneManager'
import { FrameStats         } from './FrameStats'
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
import { Debugger, DebugController } from '@engine/debug'
import type { IDebugger } from '@engine/debug'

const DEBUG_OVERLAY_ENABLED = process.env.NODE_ENV !== 'production'

/**
 * Composition root: constructs and wires every engine subsystem, then
 * delegates each loop step to them. Engine deliberately owns no game-domain
 * behaviour itself — frame timing lives in {@link FrameStats}, and every
 * debug hotkey/overlay concern lives in {@link DebugController} (both
 * constructed here, both nullable so no consumer ever depends on a
 * concrete debug type).
 */
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

  private readonly loop:  GameLoop
  private readonly stats: FrameStats = new FrameStats()

  // Debug controller — instantiated only in DEV builds; null in production.
  private readonly debugController: DebugController | null

  constructor(config: EngineConfig) {
    this.renderer     = config.renderer
    const debuggerInstance: Debugger | null = DEBUG_OVERLAY_ENABLED ? new Debugger() : null
    this.debugger     = debuggerInstance
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

    this.debugController = debuggerInstance
      ? new DebugController(debuggerInstance, {
          renderer:  this.renderer,
          input:     this.input,
          collision: this.collision,
          camera:    this.camera,
          audio:     this.audio,
          events:    this.events,
        })
      : null

    this.loop = new GameLoop({
      fixedUpdate: (dt) => this.fixedUpdate(dt),
      update:      (dt) => this.update(dt),
      render:      (ip) => this.render(ip)
    })
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
    this.sceneManager.activeScene?.fixedUpdate?.(dt)
    this.collision.update()
  }

  private update(dt: number): void {
    this.stats.tick(dt)
    this.camera.update(dt)
    this.ui.update(dt)
    this.sceneManager.activeScene?.update(dt)
    this.debugController?.update()
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

    this.debugController?.render(
      this.stats.snapshot(),
      this.sceneManager.allScenes.map(s => s.constructor.name)
    )

    this.input.endFrame()
  }
}

