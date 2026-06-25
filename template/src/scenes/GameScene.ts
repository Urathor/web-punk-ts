import type { IScene, IEngine, IRenderer } from 'webpunk.ts'
import { UICanvas, UIPanel, UIProgressBar, UIText, UIButton, UITheme, Anchor, solid, Vector2 } from 'webpunk.ts'

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

    // --- Sprite UI theme demo (optional; safe to delete) ---------------------
    // Applies the built-in procedural skin so widgets render with nine-slice
    // sprite backgrounds instead of flat rectangles. Every widget below still
    // works without the theme — it just falls back to its colour fields.
    // Delete this block (and the engine.ui.remove call in onExit) to opt out.
    //
    // Recolour the whole skin here: every button / panel / bar tile is derived
    // from these few colours, so changing them restyles all widgets at once.
    // Edit the values (or delete any key to keep its default) to suit your game.
    engine.ui.setTheme(UITheme.createDefault({
      fill:   '#223044',   // base panel & button fill
      border: '#48597a',   // outlines / borders
      accent: '#5a9bd8',   // progress fill + grid-selection highlight
      text:   '#ffffff',   // label text colour
      radius: 6,           // corner roundness in px
    }))
    const hud = engine.ui.add(new UICanvas('demo-hud', 100))

    // The cluster is anchored to screen centre. Each widget anchors to
    // Anchor.Center; its offset positions it relative to that point, so the
    // 150×70 panel is centred by offsetting it by half its size.
    // Themed container panel (nine-slice background supplied by the theme).
    const panel  = hud.addElement(new UIPanel())
    panel.anchor = Anchor.Center
    panel.offset = new Vector2(-75, -35)
    panel.width  = 150
    panel.height = 70

    const title  = hud.addElement(new UIText())
    title.anchor = Anchor.Center
    title.text   = 'Themed HUD'
    title.offset = new Vector2(-67, -28)

    // Themed progress bar (sprite track + fill come from the theme).
    const health  = hud.addElement(new UIProgressBar())
    health.anchor = Anchor.Center
    health.offset = new Vector2(-67, -13)
    health.width  = 122
    health.height = 9
    health.value  = 0.6

    // Interactive themed button — hover/press reuse the theme's state tints.
    const heal   = hud.addElement(new UIButton(engine.input))
    heal.anchor  = Anchor.Center
    heal.label   = 'Heal +10%'
    heal.offset  = new Vector2(-67, 3)
    heal.width   = 78
    heal.height  = 16
    heal.onClick = () => { health.value = Math.min(1, health.value + 0.1) }

    // Explicit background overrides the theme (precedence demo): this swatch
    // keeps the flat-rectangle colour look even while a theme is active.
    const swatch      = hud.addElement(new UIPanel())
    swatch.anchor     = Anchor.Center
    swatch.offset     = new Vector2(19, 3)
    swatch.width      = 36
    swatch.height     = 16
    swatch.background = solid({ fill: '#2e7d46', border: '#8be0a4' })
    // -------------------------------------------------------------------------
  }

  onExit(): void {
    const engine = this._engine
    engine.ui.remove('demo-hud')
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
    const cx = renderer.logicalWidth / 2
    renderer.drawText(
      'GameScene — your game goes here!',
      { x: cx - 104, y: renderer.logicalHeight - 14 },
      { color: '#aaaaaa', size: 7 }
    )
  }
}
