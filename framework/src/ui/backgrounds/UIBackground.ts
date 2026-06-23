import type { IRenderer, IRect } from '@engine/renderer'

/** Visual state a widget can request from a background. `disabled` is reserved. */
export type UIWidgetState = 'normal' | 'hover' | 'pressed' | 'disabled'

/** Pixel insets that mark the non-stretching border of a nine-patch sprite. */
export interface NineSliceInsets {
  left:   number
  top:    number
  right:  number
  bottom: number
}

/**
 * A colour overlay (or, when `color` is omitted, an alpha fade) applied to a
 * background. Used for button hover/pressed feedback.
 */
export interface Tint {
  /** Overlay colour. When omitted, the tint is applied as an alpha fade instead. */
  color?:   string
  /** 0..1 — overlay opacity (with a colour) or fade amount (without). */
  strength: number
}

/**
 * A pluggable way to paint a widget's background rectangle. Implementations are the
 * "SolidColorBased vs SpriteBased" split done by composition: {@link SolidColorBackground}
 * draws rectangles (today's look); a nine-slice background draws sprites.
 */
export interface UIBackground {
  draw(renderer: IRenderer, bounds: IRect, tint?: Tint): void
}
