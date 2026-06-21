import type { IScene    } from './IScene'
import type { IEngine   } from './IEngine'
import type { IRenderer } from '@engine/renderer'
import { Rect            } from '@engine/math'

export class LoadingScene implements IScene {
  /** 0–1, updated by SceneManager during preload. */
  progress = 0

  onEnter(_engine: IEngine): void {}
  onExit():   void {}
  onPause():  void {}
  onResume(): void {}
  fixedUpdate(_dt: number): void {}
  update(_dt: number): void {}

  render(renderer: IRenderer, _interpolation: number): void {
    const cx   = renderer.logicalWidth  / 2
    const cy   = renderer.logicalHeight / 2
    const barW = 200
    const barH = 12
    const bx   = cx - barW / 2
    const by   = cy - barH / 2

    renderer.drawText('Loading…', { x: bx, y: by - 12 }, { color: '#ffffff', size: 8 })
    renderer.drawRect(new Rect(bx, by, barW,                   barH), '#333333')
    renderer.drawRect(new Rect(bx, by, barW * this.progress,   barH), '#5599ff')
    renderer.drawRect(new Rect(bx, by, barW,                   barH), '#aaaaaa', false)
  }
}
