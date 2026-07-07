import type { IScene    } from './IScene'
import type { IEngine   } from './IEngine'
import type { IRenderer } from '@engine/renderer'
import { Tween, Easing  } from '@engine/tween'

/**
 * Full-screen fade-to-black transition scene.
 *
 * Push this scene on top of the stack. It fades the display to black over
 * `halfDurationMs`, calls `onMidpoint` (which should swap the scene below via
 * `engine.replaceSceneUnder(...)`), then fades back to transparent and pops itself.
 *
 * Usage:
 * ```typescript
 * engine.pushScene(new FadeScene(300, (eng) => {
 *   eng.replaceSceneUnder(new DungeonScene({ health: 6, chestCollected: false }))
 * }))
 * ```
 */
export class FadeScene implements IScene {
  private _engine!:       IEngine
  private _alpha          = 0
  private _midpointFired  = false
  private readonly _half:       number
  private readonly _onMidpoint: (engine: IEngine) => void
  private _tween:         Tween

  constructor(halfDurationMs: number, onMidpoint: (engine: IEngine) => void) {
    this._half       = halfDurationMs
    this._onMidpoint = onMidpoint
    this._tween      = new Tween({
      from:     0,
      to:       1,
      duration: halfDurationMs,
      easing:   Easing.easeInOutQuad,
      onUpdate: (v) => { this._alpha = v },
      onComplete: () => this._handleMidpoint(),
    })
  }

  onEnter(engine: IEngine): void {
    this._engine = engine
  }

  update(dt: number): void {
    this._tween.tick(dt)
  }

  private _handleMidpoint(): void {
    if (this._midpointFired) return
    this._midpointFired = true
    this._onMidpoint(this._engine)
    // Swap to fade-out tween
    this._tween = new Tween({
      from:     1,
      to:       0,
      duration: this._half,
      easing:   Easing.easeInOutQuad,
      onUpdate: (v) => { this._alpha = v },
      onComplete: () => { this._engine.popScene() },
    })
  }

  render(renderer: IRenderer, _ip: number): void {
    renderer.drawRect(
      { x: 0, y: 0, width: renderer.logicalWidth, height: renderer.logicalHeight },
      `rgba(0,0,0,${this._alpha.toFixed(3)})`
    )
  }
}
