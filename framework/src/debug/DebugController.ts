import type { IRenderer      } from '@engine/renderer'
import type { IInputManager  } from '@engine/input'
import type { ICamera        } from '@engine/camera'
import type { ICollisionSystem } from '@engine/collision'
import type { IAudioManager  } from '@engine/audio'
import type { IEventEmitter  } from '@engine/events'
import type { GameEventMap   } from '@engine/events'
import type { FrameStatsSnapshot } from '@engine/engine/FrameStats'
import { Debugger            } from './Debugger'
import { DebugOverlay, type DebugStats } from './DebugOverlay'

export interface DebugControllerDeps {
  renderer:   IRenderer
  input:      IInputManager
  collision:  ICollisionSystem
  camera:     ICamera
  audio:      IAudioManager
  events:     IEventEmitter<GameEventMap>
}

/**
 * Owns every dev-only debug behaviour that previously lived inline in
 * `Engine.update()`/`Engine.render()`: hotkey polling, mouse hit-testing,
 * event-log wiring, and the six-panel overlay render sequence.
 *
 * Only constructed when the debug overlay is enabled (see `Engine.ts`) — when
 * disabled, `Engine` simply holds a `null` reference and skips all of this
 * via `?.` calls, preserving the zero-cost-in-production behaviour.
 */
export class DebugController {
  private readonly overlay = new DebugOverlay()

  constructor(
    private readonly dbg: Debugger,
    private readonly deps: DebugControllerDeps
  ) {
    this.deps.events._emitHook = (e) => this.dbg.logEvent(e)

    window.addEventListener('wheel', (e) => {
      if (this.dbg.visible && this.dbg.expandedLog) {
        const maxLines = Math.floor((this.deps.renderer.logicalHeight / 2 - 12) / 8)
        this.dbg.scrollLog(e.deltaY > 0 ? 1 : -1, maxLines)
      }
    }, { passive: true })
  }

  /** Call once per variable-timestep update. */
  update(): void {
    const { input, collision, camera, renderer } = this.deps

    if (input.isKeyPressed('Backquote')) this.dbg.toggle()
    if (!this.dbg.visible) return

    if (input.isKeyPressed('KeyL')) this.dbg.toggleLogExpansion()
    if (input.isMousePressed(0)) {
      this.dbg.handleMouseClick(
        input.mousePosition,
        collision.allColliders,
        camera,
        renderer.logicalWidth,
        renderer.logicalHeight
      )
    }
  }

  /** Call once per render, after game/UI rendering. `sceneStack` is the scene-name stack for the metrics panel. */
  render(frame: FrameStatsSnapshot, sceneStack: string[]): void {
    const { renderer, collision, input, audio, camera } = this.deps

    if (!this.dbg.visible) {
      // Minimal FPS counter when the overlay is disabled/collapsed.
      renderer.drawText(`FPS: ${frame.fps}`, { x: 4, y: 10 }, { color: '#00ff88', size: 8 })
      return
    }

    const debugStats = renderer.getDebugStats?.()
    const stats: DebugStats = {
      fps:            frame.fps,
      frameTimeMs:    frame.frameTimeMs,
      colliderCount:  collision.allColliders.length,
      drawCalls:      debugStats?.gameDrawCalls ?? 0,
      debugDrawCalls: debugStats?.debugDrawCalls ?? 0,
      sceneStack,
    }

    if (renderer.setDebugMode) renderer.setDebugMode(true)
    this.overlay.renderColliders(renderer, collision.allColliders, camera, this.dbg)
    this.overlay.render(renderer, this.dbg, stats)
    this.overlay.renderInspector(renderer, this.dbg)
    this.overlay.renderEventMonitor(renderer, this.dbg)
    this.overlay.renderSystemPanel(renderer, this.dbg, input, audio)
    this.overlay.renderMessageLog(renderer, this.dbg)
    if (renderer.setDebugMode) renderer.setDebugMode(false)
  }
}
