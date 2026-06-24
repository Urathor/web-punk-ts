import type { IScene, IEngine, IRenderer } from 'webpunk.ts'
import { FadeScene, Tween, Easing         } from 'webpunk.ts'

export class TitleScene implements IScene {
  private _engine!:    IEngine
  private _promptSize  = 7
  private _promptTween = new Tween({
    from:     7,
    to:       9,
    duration: 750,
    easing:   Easing.easeInOutQuad,
    pingPong: true,
    onUpdate: (v) => { this._promptSize = v },
  })

  onEnter(engine: IEngine): void {
    this._engine = engine
    engine.camera.clearLayers()
    engine.camera.controller = null
  }

  onExit():   void {}
  onPause():  void { this._promptTween.cancel() }
  onResume(): void { this._promptTween.reset()  }
  fixedUpdate(_dt: number): void {}

  update(dt: number): void {
    this._promptTween.tick(dt)

    if (
      this._engine.input.isKeyPressed('Enter') ||
      this._engine.input.isKeyPressed('Space')
    ) {
      this._engine.pushScene(new FadeScene(300, (eng) => {
        void import('./GameScene').then(({ GameScene }) =>
          eng.replaceSceneUnder(new GameScene())
        )
      }))
    }
  }

  render(renderer: IRenderer, _ip: number): void {
    const cx = renderer.logicalWidth  / 2
    const cy = renderer.logicalHeight / 2

    renderer.clear('#111122')

    renderer.drawText('MY GAME', { x: cx - 30, y: cy - 40 }, { color: '#ffdd44', size: 12 })

    renderer.drawText(
      'Press Enter to Start',
      { x: cx, y: cy + 10 },
      { color: '#ffffff', size: this._promptSize, align: 'center' }
    )

    renderer.drawText(
      'Arrow keys / WASD · Space · Esc',
      { x: cx - 100, y: renderer.logicalHeight - 20 },
      { color: '#444444', size: 6 }
    )
  }
}
