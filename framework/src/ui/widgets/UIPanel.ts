import { UIElement       } from '../UIElement'
import type { IRenderer  } from '@engine/renderer'
import type { Tint       } from '../backgrounds'

/**
 * A filled/outlined rectangle, and the common choice as a container: use the
 * inherited `addChild()` to attach other widgets to it. Children anchor relative to
 * the panel's own bounds, so moving the panel (or changing its `width`/`height`)
 * moves/re-flows the whole group with it.
 */
export class UIPanel extends UIElement {
  fillColor:    string  = '#222222'
  borderColor:  string  = '#666666'
  borderWidth:  number  = 1
  showBorder:   boolean = true
  showFill:     boolean = true
  /** TODO: rounded corners are not yet implemented in CanvasRenderer */
  cornerRadius: number  = 0
  /** Colour overlay applied over `background` when set (ignored for the plain
   *  `fillColor`/`borderColor` fallback). Lets composite widgets (e.g. `UIButton`)
   *  drive hover/pressed feedback without swapping the background object itself. */
  tint: Tint | null = null

  render(renderer: IRenderer, _interpolation: number): void {
    const bounds = this.getBounds()

    // No theme-dispatch code lives in UITheme for this widget — instead we read
    // `appliedTheme` directly here, resolve our own skin via `getSkin(this.skinName)`,
    // and forward the relevant values onto `bgPanel`/`label` each frame. An explicit
    // `background` always wins over the theme (mirrors the old "if (!el.background)"
    // gate in UITheme.applyTo).
    const theme = this.appliedTheme
    const skin  = theme?.getSkin(this.skinName) ?? null
    this.background = this.background ?? skin?.panel ?? null

    if (this.background) {
      // Push this panel's own flags onto whatever background is assigned — so
      // showFill/showBorder take effect regardless of the background strategy —
      // without UIPanel needing to know the background's concrete type. A sprite
      // background (no separate fill/border layer) simply ignores these.
      this.background.showFill   = this.showFill
      this.background.showBorder = this.showBorder
      this.background.draw(renderer, bounds, this.tint ?? undefined)
      return
    }
    if (this.showFill)   renderer.drawRect(bounds, this.fillColor,   true)
    if (this.showBorder) renderer.drawRect(bounds, this.borderColor, false)
  }
}
