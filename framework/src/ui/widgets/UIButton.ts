import { UIElement              } from '../UIElement'
import type { IRenderer         } from '@engine/renderer'
import type { BitmapFont        } from '../BitmapFont'
import type { UIBackground, Tint } from '../backgrounds'
import type { InputManager      } from '@engine/input'
import { DEFAULT_FONT_FAMILY     } from '@engine/constants'

export interface ButtonColors {
  fill:   string
  border: string
  text:   string
}

export class UIButton extends UIElement {
  label:      string            = ''
  bitmapFont: BitmapFont | null = null
  fontSize:   number            = 8
  /** CSS font family for the label — used when no bitmapFont is set. */
  font:       string            = DEFAULT_FONT_FAMILY
  /** Overrides the per-state {@link ButtonColors.text} for every state when set
   *  (non-null). Used by the label's `drawText` fallback; ignored for bitmap fonts. */
  textColor:  string | null     = null

  normal:  ButtonColors = { fill: '#334466', border: '#6688aa', text: '#ffffff' }
  hover:   ButtonColors = { fill: '#4455aa', border: '#88aadd', text: '#ffffff' }
  pressed: ButtonColors = { fill: '#223355', border: '#446688', text: '#cccccc' }

  /** Optional per-state sprite/colour backgrounds. Missing states fall back to
   *  {@link UIElement.background} drawn with the matching state tint. */
  hoverBackground:   UIBackground | null = null
  pressedBackground: UIBackground | null = null
  hoverTint:   Tint = { color: '#ffffff', strength: 0.15 }
  pressedTint: Tint = { color: '#000000', strength: 0.20 }

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

    // Sprite/colour background path (state-aware). Falls through to ButtonColors when
    // no background is assigned, so the existing look is preserved.
    const stateBg = this._isPressed ? this.pressedBackground
                  : this._isHovered ? this.hoverBackground
                  : this.background
    const bg = stateBg ?? this.background
    if (bg) {
      // Tint only when the state had no explicit background and we fell back to base.
      const tint = stateBg            ? undefined
                 : this._isPressed    ? this.pressedTint
                 : this._isHovered    ? this.hoverTint
                 : undefined
      bg.draw(renderer, bounds, tint)
    } else {
      renderer.drawRect(bounds, colors.fill,   true)
      renderer.drawRect(bounds, colors.border, false)
    }

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
          { x: pos.x + bounds.width / 2, y: pos.y + bounds.height / 2 + this.fontSize * 0.375 },
          { color: this.textColor ?? colors.text, size: this.fontSize, font: this.font, align: 'center' }
        )
      }
    }
  }
}
