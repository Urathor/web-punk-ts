import type { IScene    } from '@engine/engine/IScene'
import type { IEngine   } from '@engine/engine/IEngine'
import type { IRenderer } from '@engine/renderer'

export class TitleScene implements IScene {
  private _engine!: IEngine
  private _blinkTimer = 0

  onEnter(engine: IEngine): void {
    this._engine = engine
    engine.camera.clearLayers()
    engine.camera.controller = null
  }

  onExit():   void {}
  onPause():  void {}
  onResume(): void {}
  fixedUpdate(_dt: number): void {}

  update(dt: number): void {
    this._blinkTimer = (this._blinkTimer + dt) % 1200

    if (
      this._engine.input.isKeyPressed('Enter') ||
      this._engine.input.isKeyPressed('Space')
    ) {
      void import('./GameScene').then(({ GameScene }) =>
        this._engine.replaceScene(new GameScene())
      )
    }
  }

  render(renderer: IRenderer, _ip: number): void {
    const cx = renderer.logicalWidth  / 2
    const cy = renderer.logicalHeight / 2

    renderer.clear('#111122')

    renderer.drawText('MY GAME', { x: cx - 30, y: cy - 40 }, { color: '#ffdd44', size: 12 })

    if (this._blinkTimer < 600) {
      renderer.drawText(
        'Press Enter to Start',
        { x: cx - 66, y: cy + 10 },
        { color: '#ffffff', size: 7 }
      )
    }

    renderer.drawText(
      'Arrow keys / WASD · Space · Esc',
      { x: cx - 100, y: renderer.logicalHeight - 20 },
      { color: '#444444', size: 6 }
    )
  }
}
