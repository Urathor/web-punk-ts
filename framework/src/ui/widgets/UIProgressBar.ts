import { UIElement          } from '../UIElement'
import type { IRenderer     } from '@engine/renderer'
import { UIPanel             } from './UIPanel'
import { UIText              } from './UIText'
import type { UIBackground  } from '../backgrounds'
import { Rect, Vector2       } from '@engine/math'

export type BarOrientation = 'horizontal' | 'vertical'

/**
 * A `UIPanel` that can clip its own render to a local-space sub-rect. Used by
 * `fillPanel` in `fillMode: 'crop'` so the revealed portion participates in the
 * generic recursive child-render walk at the correct z-order — right after
 * `trackPanel`, same as `fillMode: 'stretch'` — instead of a parent-level render
 * override. `UICanvas`'s render walk always calls a parent's own `render()` *before*
 * any of its children, so a `UIProgressBar`-level override drawing the clipped fill
 * would fire before `trackPanel` renders, and `trackPanel`'s opaque background would
 * then paint straight over it.
 */
class ClippedPanel extends UIPanel {
  /** Local-space (relative to this panel's own top-left) reveal rect, or `null` to
   *  render normally, unclipped. */
  clipRect: Rect | null = null

  render(renderer: IRenderer, interpolation: number): void {
    if (!this.clipRect) { super.render(renderer, interpolation); return }
    const pos = this.getPosition()
    renderer.pushClip(new Rect(
      pos.x + this.clipRect.x, pos.y + this.clipRect.y,
      this.clipRect.width,     this.clipRect.height,
    ))
    super.render(renderer, interpolation)
    renderer.popClip()
  }
}

/**
 * Composed of three `UIPanel` children (`trackPanel`, `fillPanel`, and an internal
 * border overlay) plus an optional `UIText` `label` — proving out the "compose from
 * base components, sync via `update()`" pattern (see `docs/ui-composition/`).
 * `trackPanel`/`fillPanel` opt out of the generic base-component theme walk
 * (`themed = false`) since they read the `progressTrack`/`progressFill` theme tokens
 * directly here instead of the generic `panel` token.
 */
export class UIProgressBar extends UIElement {
  /** Fill ratio 0.0–1.0 */
  value:           number         = 1.0
  orientation:     BarOrientation = 'horizontal'

  backgroundColor: string         = '#333333'
  fillColor:       string         = '#44cc44'
  borderColor:     string         = '#666666'
  showBorder:      boolean        = true

  /** Fill grows from the far end when true (e.g. right-to-left or top-to-bottom). */
  reversed:        boolean        = false

  /** Optional sprite/colour overrides — take priority over the theme's
   *  `progressTrack`/`progressFill` tokens when set. */
  trackBackground: UIBackground | null = null
  fillBackground:  UIBackground | null = null
  /** How the fill background fills as `value` changes (nine-slice only for `crop`). */
  fillMode: 'stretch' | 'crop' = 'crop'

  /** The bar's track (full-bounds base), exposed for direct customization. */
  readonly trackPanel: UIPanel
  /** The bar's fill (grows/shrinks with `value`), exposed for direct customization. */
  readonly fillPanel:  UIPanel
  /** Border-only overlay — a plain `UIPanel` added last so it always renders on top of
   *  `trackPanel`/`fillPanel`, even when the fill reaches 100%. Not part of the public
   *  API surface (no theme/sprite override beyond `borderColor`/`showBorder`). */
  private readonly borderPanel: UIPanel

  /** Optional centered caption over the bar — created on first {@link showLabel} call. */
  label: UIText | null = null

  constructor() {
    super()
    this.trackPanel  = this.addChild(new UIPanel())
    this.fillPanel   = this.addChild(new ClippedPanel())
    this.borderPanel = this.addChild(new UIPanel())

    this.trackPanel.themed  = false
    this.fillPanel.themed   = false
    this.borderPanel.themed = false

    this.trackPanel.showBorder = false
    this.fillPanel.showBorder  = false
    this.borderPanel.showFill  = false
  }

  /** Creates (on first call) and shows a centered text caption over the bar. Returns
   *  the `UIText` child for further customization (font, color, alignment, etc). */
  showLabel(text = ''): UIText {
    if (!this.label) {
      this.label = this.addChild(new UIText())
      this.label.textAlign = 'center'
    }
    this.label.text = text
    return this.label
  }

  update(_dt: number): void {
    const theme = this.appliedTheme
    const skin  = theme?.getSkin(this.skinName) ?? null
    const ratio = Math.max(0, Math.min(1, this.value))
    const fillPanel = this.fillPanel as ClippedPanel

    this.trackPanel.width      = this.width
    this.trackPanel.height     = this.height
    this.trackPanel.background = this.trackBackground ?? skin?.progressTrack ?? null
    this.trackPanel.fillColor  = this.backgroundColor

    this.borderPanel.width       = this.width
    this.borderPanel.height      = this.height
    this.borderPanel.visible     = this.showBorder
    this.borderPanel.borderColor = this.borderColor

    if (this.label) {
      this.label.width  = this.width
      this.label.offset = new Vector2(0, Math.max(0, (this.height - this.label.fontSize) / 2))
    }

    const fillBg = this.fillBackground ?? skin?.progressFill ?? null

    if (ratio <= 0) {
      fillPanel.visible  = false
      fillPanel.clipRect = null
      return
    }

    let fillRect: Rect
    if (this.orientation === 'horizontal') {
      const fillW = this.width * ratio
      fillRect = this.reversed
        ? new Rect(this.width - fillW, 0, fillW, this.height)
        : new Rect(0,                  0, fillW, this.height)
    } else {
      const fillH = this.height * ratio
      fillRect = this.reversed
        ? new Rect(0, 0,                   this.width, fillH)
        : new Rect(0, this.height - fillH, this.width, fillH)
    }

    if (this.fillMode === 'crop' && fillBg) {
      // Full-bounds background, revealed only up to `fillRect` via `clipRect` — the
      // sprite is clipped, not scaled, so nine-slice art stays crisp as `value` grows.
      fillPanel.visible    = true
      fillPanel.width      = this.width
      fillPanel.height     = this.height
      fillPanel.offset     = new Vector2(0, 0)
      fillPanel.background = fillBg
      fillPanel.clipRect   = fillRect
    } else {
      fillPanel.visible    = true
      fillPanel.width      = fillRect.width
      fillPanel.height     = fillRect.height
      fillPanel.offset     = new Vector2(fillRect.x, fillRect.y)
      fillPanel.background = fillBg
      fillPanel.fillColor  = this.fillColor
      fillPanel.clipRect   = null
    }
  }

  render(_renderer: IRenderer, _interpolation: number): void {
    // no-op — trackPanel/fillPanel/borderPanel/label all render themselves via the
    // generic child-render walk (fillPanel clips its own render in crop mode).
  }
}
