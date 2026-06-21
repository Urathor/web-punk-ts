import type { IScene    } from './IScene'
import type { IEngine   } from './IEngine'
import type { IRenderer } from '@engine/renderer'
import { Rect            } from '@engine/math'

export class LoadingScene implements IScene {
  /** 0–1, updated by SceneManager during preload. */
  progress = 0

  /** Smoothed display value that lerps toward `progress` each frame. */
  private _displayedProgress = 0

  onEnter(_engine: IEngine): void {}
  onExit():   void {}
  onPause():  void {}
  onResume(): void {}
  fixedUpdate(_dt: number): void {}

  update(dt: number): void {
    // Exponentially smooth the bar toward the reported progress so discrete
    // jumps (e.g. 0 → 0.4 → 0.8 → 1) animate rather than snap.
    const speed = dt / 120 // covers ~120 ms lag at most
    this._displayedProgress += (this.progress - this._displayedProgress) * Math.min(speed, 1)
  }

  render(renderer: IRenderer, _interpolation: number): void {
    const cx   = renderer.logicalWidth  / 2
    const cy   = renderer.logicalHeight / 2
    const barW = 200
    const barH = 12
    const bx   = cx - barW / 2
    const by   = cy - barH / 2

    renderer.drawText('Loading…', { x: bx, y: by - 12 }, { color: '#ffffff', size: 8 })
    renderer.drawRect(new Rect(bx, by, barW,                              barH), '#333333')
    renderer.drawRect(new Rect(bx, by, barW * this._displayedProgress,   barH), '#5599ff')
    renderer.drawRect(new Rect(bx, by, barW,                              barH), '#aaaaaa', false)
  }
}
