import { UIElement          } from '../UIElement'
import type { IRenderer     } from '@engine/renderer'
import { NineSliceBackground } from '../backgrounds'
import type { UIBackground  } from '../backgrounds'
import { Rect                } from '@engine/math'

export type BarOrientation = 'horizontal' | 'vertical'

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

  /** Optional sprite/colour backgrounds. When null, the colour fields are used. */
  trackBackground: UIBackground | null = null
  fillBackground:  UIBackground | null = null
  /** How the fill background fills as `value` changes (nine-slice only for `crop`). */
  fillMode: 'stretch' | 'crop' = 'stretch'

  render(renderer: IRenderer, _interpolation: number): void {
    const pos    = this.getPosition()
    const bounds = new Rect(pos.x, pos.y, this.width, this.height)
    const ratio  = Math.max(0, Math.min(1, this.value))

    if (this.trackBackground) this.trackBackground.draw(renderer, bounds)
    else                      renderer.drawRect(bounds, this.backgroundColor, true)

    if (ratio > 0) {
      let fillRect: Rect
      if (this.orientation === 'horizontal') {
        const fillW = this.width * ratio
        fillRect = this.reversed
          ? new Rect(bounds.right - fillW, bounds.y, fillW, this.height)
          : new Rect(bounds.x,             bounds.y, fillW, this.height)
      } else {
        const fillH = this.height * ratio
        fillRect = this.reversed
          ? new Rect(bounds.x, bounds.y,              this.width, fillH)
          : new Rect(bounds.x, bounds.bottom - fillH, this.width, fillH)
      }

      if (this.fillBackground) {
        if (this.fillMode === 'crop' && this.fillBackground instanceof NineSliceBackground) {
          const axis = this.orientation === 'horizontal' ? 'x' : 'y'
          this.fillBackground.drawCropped(renderer, bounds, ratio, axis, this.reversed)
        } else {
          this.fillBackground.draw(renderer, fillRect)
        }
      } else {
        renderer.drawRect(fillRect, this.fillColor, true)
      }
    }

    if (this.showBorder) renderer.drawRect(bounds, this.borderColor, false)
  }
}
