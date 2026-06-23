import type { IRenderer, IRect } from '@engine/renderer'
import type { UIBackground, Tint } from './UIBackground'
import { blendHex } from '../tint'

export interface SolidColorOptions {
  fill?:        string
  border?:      string
  borderWidth?: number
  showFill?:    boolean
  showBorder?:  boolean
}

/**
 * The "SolidColorBased" strategy — paints today's filled/outlined rectangle. A tint
 * blends the fill/border colours (toward the tint colour, or toward black for a
 * colourless fade) so buttons get hover/pressed feedback without sprites.
 */
export class SolidColorBackground implements UIBackground {
  fill:        string
  border:      string
  borderWidth: number
  showFill:    boolean
  showBorder:  boolean

  constructor(opts: SolidColorOptions = {}) {
    this.fill        = opts.fill        ?? '#222222'
    this.border      = opts.border      ?? '#666666'
    this.borderWidth = opts.borderWidth ?? 1
    this.showFill    = opts.showFill    ?? true
    this.showBorder  = opts.showBorder  ?? true
  }

  draw(renderer: IRenderer, bounds: IRect, tint?: Tint): void {
    let fill   = this.fill
    let border = this.border
    if (tint) {
      const toward = tint.color ?? '#000000'
      fill   = blendHex(fill,   toward, tint.strength)
      border = blendHex(border, toward, tint.strength)
    }
    if (this.showFill)   renderer.drawRect(bounds, fill,   true)
    if (this.showBorder) renderer.drawRect(bounds, border, false)
  }
}
