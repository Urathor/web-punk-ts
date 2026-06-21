import { UIElement           } from '../UIElement'
import type { IRenderer      } from '@engine/renderer'
import type { BitmapFont     } from '../BitmapFont'
import type { InputManager   } from '@engine/input'

export interface ButtonColors {
  fill:   string
  border: string
  text:   string
}

export class UIButton extends UIElement {
  label:      string            = ''
  bitmapFont: BitmapFont | null = null
  fontSize:   number            = 8

  normal:  ButtonColors = { fill: '#334466', border: '#6688aa', text: '#ffffff' }
  hover:   ButtonColors = { fill: '#4455aa', border: '#88aadd', text: '#ffffff' }
  pressed: ButtonColors = { fill: '#223355', border: '#446688', text: '#cccccc' }

  onClick?: () => void

  private _isHovered = false
  private _isPressed = false

  constructor(private readonly input: InputManager) {
    super()
  }

  update(_dt: number): void {
    const mouse  = this.input.mousePosition
    const bounds = this.getBounds()
    this._isHovered = bounds.contains(mouse)

    if (this._isHovered && this.input.isMousePressed(0)) {
      this._isPressed = true
    }
    if (this._isPressed && this.input.isMouseReleased(0)) {
      this._isPressed = false
      if (this._isHovered) this.onClick?.()
    }
    if (!this.input.isMouseHeld(0)) {
      this._isPressed = false
    }
  }

  render(renderer: IRenderer, _interpolation: number): void {
    const colors = this._isPressed ? this.pressed
                 : this._isHovered ? this.hover
                 : this.normal

    const bounds = this.getBounds()
    renderer.drawRect(bounds, colors.fill,   true)
    renderer.drawRect(bounds, colors.border, false)

    if (this.label) {
      const pos = this.getPosition()
      if (this.bitmapFont) {
        const m  = this.bitmapFont.measureString(this.label)
        const tx = pos.x + (bounds.width  - m.width)  / 2
        const ty = pos.y + (bounds.height - m.height) / 2
        this.bitmapFont.drawString(renderer, this.label, tx, ty)
      } else {
        renderer.drawText(
          this.label,
          { x: pos.x + bounds.width / 2 - this.label.length * 3, y: pos.y + bounds.height / 2 + 3 },
          { color: colors.text, size: this.fontSize }
        )
      }
    }
  }
}
