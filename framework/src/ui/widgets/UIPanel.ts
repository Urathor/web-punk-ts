import { UIElement       } from '../UIElement'
import type { IRenderer  } from '@engine/renderer'

export class UIPanel extends UIElement {
  fillColor:    string  = '#222222'
  borderColor:  string  = '#666666'
  borderWidth:  number  = 1
  showBorder:   boolean = true
  showFill:     boolean = true
  /** TODO: rounded corners are not yet implemented in CanvasRenderer */
  cornerRadius: number  = 0

  render(renderer: IRenderer, _interpolation: number): void {
    const bounds = this.getBounds()
    if (this.background) {
      this.background.draw(renderer, bounds)
      return
    }
    if (this.showFill)   renderer.drawRect(bounds, this.fillColor,   true)
    if (this.showBorder) renderer.drawRect(bounds, this.borderColor, false)
  }
}
