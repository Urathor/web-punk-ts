import type { UIBackground, Tint } from './backgrounds'
import { generateNineSliceSprite } from './backgrounds'
import { blendHex                } from './tint'
import type { BitmapFont         } from './BitmapFont'

/** Fallback colours used to procedurally generate any {@link ThemeSkin} field left
 *  unset — the same derivation `UITheme.createDefault()` always used (lighter tint
 *  for hover, darker for pressed/track, `accent` for the progress fill). */
export interface ThemeSkinGenerateOptions {
  fill?:   string
  border?: string
  accent?: string
  /** Corner radius of the procedural rounded-rect tiles, in pixels. */
  radius?: number
}

export interface ThemeSkinOptions {
  /** Container/base look. Generated (a rounded-rect tile) when omitted. */
  panel?:         UIBackground
  /** Button's normal-state look. Defaults to `panel` when omitted. */
  button?:        UIBackground
  buttonHover?:   UIBackground
  buttonDown?:    UIBackground
  /** Colour overlay applied over `button` when no dedicated `buttonHover`/
   *  `buttonDown` art is set. Hover applies it at `strength`; pressed applies it at
   *  `1.5x strength` (capped at 1) — same colour/direction, different intensity, so
   *  hover/pressed stay visually distinct from one field. */
  buttonTint?:    Tint
  progressTrack?: UIBackground
  progressFill?:  UIBackground
  /** Optional per-skin font override. `UITheme`'s own `font`/`fontFamily` remain the
   *  baseline default for any skin that doesn't set these. */
  font?:          BitmapFont | null
  fontFamily?:    string
  generate?:      ThemeSkinGenerateOptions
}

/**
 * One matched bundle of widget-category backgrounds (+ optional font override) — a
 * single named entry in `UITheme.skins`. This is the *one* way to build a skin,
 * whether the art is hand-supplied `NineSliceBackground`s (via `nineSlice()`/
 * `generateNineSliceSprite()`), loaded from an atlas (`UITheme.load()`), or fully
 * procedural (`UITheme.createDefault()`) — everything funnels through this
 * constructor. Every field is optional; anything left unset is procedurally
 * generated from `generate` (or built-in defaults), so `new ThemeSkin()` alone
 * reproduces the default look.
 */
export class ThemeSkin {
  panel:         UIBackground
  button:        UIBackground
  buttonHover:   UIBackground
  buttonDown:    UIBackground
  buttonTint:    Tint
  progressTrack: UIBackground
  progressFill:  UIBackground
  font:          BitmapFont | null
  fontFamily:    string | null

  constructor(opts: ThemeSkinOptions = {}) {
    const gen    = opts.generate ?? {}
    const fill   = gen.fill   ?? '#223044'
    const border = gen.border ?? '#48597a'
    const accent = gen.accent ?? '#5a9bd8'
    const radius = gen.radius ?? 6

    // Whether the caller supplied their own button-ish art (a real sprite/nine-slice,
    // typically via `nineSlice()`). When they didn't provide dedicated hover/pressed
    // art either, the SAME sprite is reused for every state (rather than swapping in
    // an unrelated procedurally-generated tile) — `UIButton` then tints that one
    // sprite for feedback instead of art-swapping. Purely-procedural skins (no
    // explicit `panel`/`button`) keep today's distinct lighter/darker generated tiles
    // for hover/pressed, since there's no "caller's real art" to preserve.
    const hasOwnButtonArt = opts.panel !== undefined || opts.button !== undefined

    this.panel  = opts.panel  ?? generateNineSliceSprite({ fill, border, radius })
    this.button = opts.button ?? this.panel
    this.buttonHover = opts.buttonHover ?? (hasOwnButtonArt ? this.button : generateNineSliceSprite({
      fill:   blendHex(fill,   '#ffffff', 0.20),
      border: blendHex(border, '#ffffff', 0.20),
      radius,
    }))
    this.buttonDown = opts.buttonDown ?? (hasOwnButtonArt ? this.button : generateNineSliceSprite({
      fill: blendHex(fill, '#000000', 0.18),
      border,
      radius,
    }))
    this.buttonTint = opts.buttonTint ?? { color: '#000000', strength: 0.15 }
    this.progressTrack = opts.progressTrack ?? generateNineSliceSprite({
      fill: blendHex(fill, '#000000', 0.28),
      border,
      radius,
    })
    this.progressFill = opts.progressFill ?? generateNineSliceSprite({
      fill:   accent,
      border: blendHex(accent, '#ffffff', 0.25),
      radius,
    })
    this.font       = opts.font       ?? null
    this.fontFamily = opts.fontFamily ?? null
  }
}
