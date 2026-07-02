import { UIElement           } from '../UIElement'
import type { IRenderer      } from '@engine/renderer'
import type { BitmapFont     } from '../BitmapFont'
import { DEFAULT_FONT_FAMILY } from '@engine/constants'
import { Rect                } from '@engine/math'

export type TextAlign = 'left' | 'center' | 'right'

// Lazily created, headless-safe 2D context used only to measure canvas-rendered text
// width for auto-sizing (see UIText.getBounds). Mirrors the pattern in
// UITheme.createDefault, which also probes for canvas support before using it.
let measureCtx: CanvasRenderingContext2D | null | undefined

function measureTextWidth(text: string, font: string, size: number): number {
  if (measureCtx === undefined) {
    try { measureCtx = document.createElement('canvas').getContext('2d') }
    catch { measureCtx = null }
  }
  if (!measureCtx) return text.length * size * 0.6   // headless fallback estimate
  measureCtx.font = `${size}px ${font}`
  return measureCtx.measureText(text).width
}

/**
 * A line of text. `width`/`height` default to `0` ("auto"): with no explicit `height`,
 * the font size (`fontSize`/`fontScale`) is used as-is; with an explicit `height`, the
 * effective font size is derived to fit it instead. Likewise, with no explicit `width`,
 * the text box auto-sizes to the measured text width — set `textAlign` to control how
 * the text sits within that box (or an explicit `width`) once it's wider than the text.
 */
export class UIText extends UIElement {
  text:       string            = ''
  color:      string            = '#ffffff'
  /** Font size in logical pixels — used when `height` is unset (`0`); see class doc. */
  fontSize:   number            = 8
  /** CSS font family — used when no bitmapFont is set. */
  font:       string            = DEFAULT_FONT_FAMILY
  bitmapFont: BitmapFont | null = null
  /** Bitmap-font scale — used when `height` is unset (`0`); see class doc. */
  fontScale:  number            = 1
  /** Horizontal alignment within the text's own box (`width`, or the measured text
   *  width when `width` is unset). */
  textAlign:  TextAlign          = 'left'

  /** Effective canvas-font size in logical pixels: fits `height` when it's explicitly
   *  set (nonzero), otherwise falls back to `fontSize`. */
  private get effectiveFontSize(): number {
    return this.height > 0 ? this.height : this.fontSize
  }

  /** Effective bitmap-font scale: fits `height` when it's explicitly set (nonzero) and
   *  a `bitmapFont` is assigned, otherwise falls back to `fontScale`. */
  private get effectiveFontScale(): number {
    if (this.height <= 0 || !this.bitmapFont) return this.fontScale
    const charHeight = this.bitmapFont.measureString('').height
    return charHeight > 0 ? this.height / charHeight : this.fontScale
  }

  private measure(): { width: number; height: number } {
    return this.bitmapFont
      ? this.bitmapFont.measureString(this.text, this.effectiveFontScale)
      : { width: measureTextWidth(this.text, this.font, this.effectiveFontSize), height: this.effectiveFontSize }
  }

  /** Bounding rectangle in logical pixels. Whichever of `width`/`height` is left at its
   *  default `0` ("auto") falls back to the measured text size on that axis. */
  getBounds(): Rect {
    const pos = this.getPosition()
    if (this.width > 0 && this.height > 0) return new Rect(pos.x, pos.y, this.width, this.height)
    const measured = this.measure()
    return new Rect(pos.x, pos.y, this.width || measured.width, this.height || measured.height)
  }

  render(renderer: IRenderer, _interpolation: number): void {
    const bounds  = this.getBounds()
    const anchorX = this.textAlign === 'center' ? bounds.x + bounds.width / 2
                  : this.textAlign === 'right'  ? bounds.right
                  : bounds.x

    if (this.bitmapFont) {
      const scale = this.effectiveFontScale
      let drawX = anchorX
      if (this.textAlign !== 'left') {
        const width = this.bitmapFont.measureString(this.text, scale).width
        drawX = this.textAlign === 'center' ? anchorX - width / 2 : anchorX - width
      }
      this.bitmapFont.drawString(renderer, this.text, drawX, bounds.y, scale)
    } else {
      renderer.drawText(this.text, { x: anchorX, y: bounds.y }, {
        color: this.color, size: this.effectiveFontSize, font: this.font, align: this.textAlign,
        baseline: 'top',
      })
    }
  }
}
