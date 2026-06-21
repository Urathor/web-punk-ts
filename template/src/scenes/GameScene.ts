import type { IScene    } from '@engine/engine/IScene'
import type { IEngine   } from '@engine/engine/IEngine'
import type { IRenderer } from '@engine/renderer'

/**
 * Main gameplay scene stub.
 * Replace the render() placeholder with your tilemap, entities, and camera setup.
 */
export class GameScene implements IScene {
  private _engine!: IEngine

  onEnter(engine: IEngine): void {
    this._engine = engine
    engine.camera.clearLayers()
    engine.camera.controller = null
    engine.events.clear()
    // TODO: preload assets, spawn entities, set up camera layers
  }

  onExit(): void {
    const engine = this._engine
    engine.events.clear()
    engine.camera.clearLayers()
    engine.camera.controller = null
    engine.collision.setTileMap(null as never)
  }

  onPause():  void {}
  onResume(): void {}
  fixedUpdate(_dt: number): void {}

  update(_dt: number): void {
    if (this._engine.actions.isActionPressed('cancel')) {
      // TODO: push a PauseScene or return to title
      void import('./TitleScene').then(({ TitleScene }) =>
        this._engine.replaceScene(new TitleScene())
      )
    }
  }

  render(renderer: IRenderer, _ip: number): void {
    const cx = renderer.logicalWidth  / 2
    const cy = renderer.logicalHeight / 2
    renderer.drawText(
      'GameScene — your game goes here!',
      { x: cx - 104, y: cy - 4 },
      { color: '#aaaaaa', size: 7 }
    )
  }
}
