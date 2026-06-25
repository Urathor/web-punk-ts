import { UIElement           } from '../UIElement'
import type { IRenderer      } from '@engine/renderer'
import type { BitmapFont     } from '../BitmapFont'
import { DEFAULT_FONT_FAMILY } from '@engine/constants'

export class UIText extends UIElement {
  text:       string            = ''
  color:      string            = '#ffffff'
  /** Font size in logical pixels — used when no bitmapFont is set. */
  fontSize:   number            = 8
  /** CSS font family — used when no bitmapFont is set. */
  font:       string            = DEFAULT_FONT_FAMILY
  bitmapFont: BitmapFont | null = null
  fontScale:  number            = 1

  render(renderer: IRenderer, _interpolation: number): void {
    const pos = this.getPosition()
    if (this.bitmapFont) {
      this.bitmapFont.drawString(renderer, this.text, pos.x, pos.y, this.fontScale)
    } else {
      renderer.drawText(this.text, pos, { color: this.color, size: this.fontSize, font: this.font })
    }
  }
}
