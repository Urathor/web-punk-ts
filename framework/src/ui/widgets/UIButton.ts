import { UIElement              } from '../UIElement'
import type { IRenderer         } from '@engine/renderer'
import type { BitmapFont        } from '../BitmapFont'
import { UIPanel                 } from './UIPanel'
import { UIText                  } from './UIText'
import { SolidColorBackground    } from '../backgrounds'
import type { UIBackground, Tint } from '../backgrounds'
import type { IInputManager     } from '@engine/input'
import { DEFAULT_FONT_FAMILY     } from '@engine/constants'
import { Vector2                 } from '@engine/math'

/**
 * A clickable button, composed of a `UIPanel` background (`bgPanel`) and a `UIText`
 * label. Both are real children (`addChild`'d in the constructor, exposed as public
 * readonly fields) — set `button.label.text = 'Heal'` to change the caption, or read
 * `button.bgPanel` to tweak the background panel directly. `bgPanel`/`label` opt out
 * of the generic per-element theme dispatch (`themed = false`) since the button reads
 * `this.appliedTheme` directly in `update()` — this mirrors `UIProgressBar`'s
 * `trackPanel`/`fillPanel` pattern and is what lets a single state machine (hover/
 * pressed) drive which theme token (or tint) the background shows each frame.
 */
export class UIButton extends UIElement {
  readonly bgPanel: UIPanel
  readonly label:   UIText

  bitmapFont: BitmapFont | null = null
  fontSize:   number            = 8
  /** CSS font family for the label — used when no bitmapFont is set. */
  font:       string            = DEFAULT_FONT_FAMILY
  /** Overrides the theme/default text colour for every state when set (non-null). */
  textColor:  string | null     = null

  /** Optional per-state sprite/colour backgrounds. Missing states fall back to
   *  {@link UIElement.background} (or the theme's `panel` token, or a built-in
   *  default look), drawn with the matching state tint. */
  hoverBackground:   UIBackground | null = null
  pressedBackground: UIBackground | null = null
  hoverTint:   Tint = { color: '#ffffff', strength: 0.15 }
  pressedTint: Tint = { color: '#000000', strength: 0.20 }

  onClick?: () => void

  private _isHovered = false
  private _isPressed = false

  /** Fallback look when there's no explicit background, no theme, and no per-state
   *  sprite — preserves today's default button appearance. */
  private readonly _defaultBackground: UIBackground =
    new SolidColorBackground({ fill: '#334466', border: '#6688aa' })

  constructor(private readonly input: IInputManager) {
    super()
    this.bgPanel = this.addChild(new UIPanel())
    this.label   = this.addChild(new UIText())
    this.bgPanel.themed = false
    this.label.themed   = false
    this.label.textAlign = 'center'
    this.bgPanel.background = this._defaultBackground
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

    // No theme-dispatch code lives in UITheme for this widget — instead we read
    // `appliedTheme` directly here, resolve our own skin via `getSkin(this.skinName)`,
    // and forward the relevant values onto `bgPanel`/`label` each frame. An explicit
    // `background` always wins over the theme (mirrors the old "if (!el.background)"
    // gate in UITheme.applyTo).
    const theme = this.appliedTheme
    const skin  = theme?.getSkin(this.skinName) ?? null

    this.bgPanel.width  = this.width
    this.bgPanel.height = this.height

    const baseBg    = this.background        ?? skin?.button      ?? null
    const hoverBg   = this.hoverBackground   ?? skin?.buttonHover ?? null
    const pressedBg = this.pressedBackground ?? skin?.buttonDown  ?? null
    const hoverTint   = skin ? { ...skin.buttonTint }                                          : this.hoverTint
    const pressedTint = skin ? { ...skin.buttonTint, strength: Math.min(1, skin.buttonTint.strength * 1.5) } : this.pressedTint

    // Sprite/colour background path (state-aware). Falls back to the built-in default
    // look when neither an explicit background nor a theme is set.
    const stateBg = this._isPressed ? pressedBg : this._isHovered ? hoverBg : baseBg
    this.bgPanel.background = stateBg ?? baseBg ?? this._defaultBackground
    // Tint whenever the resolved state background is just the base art reused as-is
    // (no dedicated hover/pressed art was given — e.g. a skin built from a single
    // sprite, where `ThemeSkin` reuses `button` for every state) — so a one-sprite
    // skin still gets hover/pressed feedback via tint instead of looking static.
    // A genuinely distinct dedicated sprite for that state (explicitly authored,
    // different from the base) is drawn as-is, untinted.
    const isReusedBase = stateBg === baseBg
    this.bgPanel.tint = !isReusedBase ? null
                       : this._isPressed ? pressedTint
                       : this._isHovered ? hoverTint
                       : null

    this.label.width       = this.width
    this.label.offset      = new Vector2(0, Math.max(0, (this.height - this.label.fontSize) / 2))
    this.label.font        = skin?.fontFamily ?? theme?.fontFamily ?? this.font
    this.label.color       = this.textColor ?? skin?.textColor ?? theme?.colors.text ?? this.label.color
    this.label.bitmapFont  = this.bitmapFont ?? skin?.font ?? theme?.font ?? null
    this.label.fontSize    = this.fontSize
  }

  render(_renderer: IRenderer, _interpolation: number): void {
    // no-op — bgPanel/label render themselves via the generic child-render walk.
  }
}
