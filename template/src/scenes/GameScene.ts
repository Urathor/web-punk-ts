import type { IScene, IEngine, IRenderer } from 'webpunk.ts'
import { UICanvas, UIPanel, UIProgressBar, UIText, TextAlign, UIButton, UIGrid, UITheme, Anchor, solid, Vector2 } from 'webpunk.ts'

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
      fill: '#223044',   // base panel & button fill
      border: '#48597a',   // outlines / borders
      accent: '#5a9bd8',   // progress fill + grid-selection highlight
      text: '#ffffff',   // label text colour
      radius: 6,           // corner roundness in px
    }))
    const hud = engine.ui.add(new UICanvas('demo-hud', 100))
    
    // The cluster is anchored to screen centre. Each widget anchors to
    // Anchor.Center; its offset positions it relative to that point, so the
    // 150×70 panel is centred by offsetting it by half its size.
    // Themed container panel (nine-slice background supplied by the theme).
    const panel = hud.addElement(new UIPanel())
    panel.anchor = Anchor.Center
    panel.width = 175
    panel.height = 70
    panel.offset = new Vector2(-panel.width / 2, -panel.height / 2)

    const title = panel.addChild(new UIText())
    title.anchor = Anchor.TopCenter
    title.text = 'Themed HUD'
    title.textAlign = 'center' as TextAlign
    title.width = 150
    title.height = 8
    title.offset = new Vector2(-75, 16)

    // Themed progress bar (sprite track + fill come from the theme).
    const health = panel.addChild(new UIProgressBar())
    health.anchor = Anchor.Center
    health.width = 150
    health.height = 8
    health.offset = new Vector2(-health.width / 2, -12)
    health.value = 0.6
    health.showBorder = false;

    // Interactive themed buttons, laid out by a `UIGrid` in `'row'` mode instead
    // of manually-computed anchors/offsets — the grid positions each child for
    // you and grows/shrinks automatically if a button's size changes.
    const buttonRow = panel.addChild(new UIGrid())
    buttonRow.mode = 'row'
    buttonRow.padding = 6
    buttonRow.anchor = Anchor.MiddleLeft
    buttonRow.offset = new Vector2(16, 8)

    const heal = buttonRow.addChild(new UIButton(engine.input))
    heal.label.text = 'Heal 10%'
    heal.width = 66
    heal.height = 16
    heal.onClick = () => { health.value = Math.min(1, health.value + 0.1) }

    // Explicit background overrides the theme (precedence demo): this swatch
    // keeps the flat-rectangle colour look even while a theme is active.
    // Interactive themed button — hover/press reuse the theme's state tints.
    const damage = buttonRow.addChild(new UIButton(engine.input))
    damage.label.text = 'Damage 10%'
    damage.width = 66
    damage.height = 16
    damage.onClick = () => { health.value = Math.max(0, health.value - 0.1) }
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
