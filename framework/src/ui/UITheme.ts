import { Rect                  } from '@engine/math'
import { DEFAULT_FONT_FAMILY    } from '@engine/constants'
import type { AssetLoader      } from '@engine/assets'
import { BitmapFont            } from './BitmapFont'
import { blendHex              } from './tint'
import { NineSliceBackground   } from './backgrounds'
import type { UIBackground, Tint, NineSliceInsets, NineSliceSource } from './backgrounds'
import type { UIElement        } from './UIElement'
import { UIPanel               } from './widgets/UIPanel'
import { UIText                } from './widgets/UIText'

export interface UIThemeColors {
  text:   string
  border: string
  fill:   string
}

/** A single themed region within an atlas, for {@link UITheme.load}. */
export interface UIThemeRegionData {
  /** `[x, y, width, height]` region in the atlas texture. */
  rect:   [number, number, number, number]
  insets: NineSliceInsets
}

/** JSON descriptor consumed by {@link UITheme.load}. */
export interface UIThemeData {
  /** Atlas texture path (loaded via the {@link AssetLoader}). */
  atlas:          string
  smoothing?:     boolean
  /** Optional `BitmapFont` JSON descriptor path. */
  font?:          string
  /** CSS font family for widgets' canvas-text fallback (when no BitmapFont). */
  fontFamily?:    string
  colors?:        Partial<UIThemeColors>
  panel?:         UIThemeRegionData
  buttonHover?:   UIThemeRegionData
  buttonPressed?: UIThemeRegionData
  progressTrack?: UIThemeRegionData
  progressFill?:  UIThemeRegionData
}

export interface UIThemeDefaultOptions {
  fill?:       string
  border?:     string
  accent?:     string
  text?:       string
  /** CSS font family applied to widgets' canvas-text fallback. */
  fontFamily?: string
  /** Corner radius of the procedural rounded-rect tiles, in pixels. */
  radius?:     number
  smoothing?:  boolean
}

/**
 * A thin skin that maps each widget kind (and button state) to a {@link UIBackground},
 * plus a default {@link BitmapFont} and fallback colour tokens. Applying a theme simply
 * assigns backgrounds onto widgets — there is no separate render path, and widgets with
 * no theme keep their colour fields, so the colour look remains the fallback.
 */
export class UITheme {
  smoothing = false
  font: BitmapFont | null = null
  /** CSS font family applied to text widgets' canvas-text fallback (when no BitmapFont). */
  fontFamily = DEFAULT_FONT_FAMILY
  colors: UIThemeColors = { text: '#ffffff', border: '#8899aa', fill: '#223044' }

  panel:         UIBackground | null = null
  buttonHover:   UIBackground | null = null
  buttonPressed: UIBackground | null = null
  buttonHoverTint:   Tint = { color: '#ffffff', strength: 0.15 }
  buttonPressedTint: Tint = { color: '#000000', strength: 0.20 }
  progressTrack: UIBackground | null = null
  progressFill:  UIBackground | null = null

  /**
   * Assign this theme's background/font to a widget. Only understands the two real
   * rendering primitives (`UIPanel`, `UIText`) — composite widgets (`UIButton`,
   * `UIProgressBar`, `UIGrid`, or any user-defined composite) are never special-cased
   * here. Instead, they read `this.appliedTheme` themselves (set below, on every
   * themed element) in their own `update()`/`render()`, and forward relevant values to
   * their own base-component children. This keeps `UITheme` decoupled from widget
   * kinds beyond the two primitives, so a custom composite widget built from
   * `UIPanel`/`UIText` children gets themed automatically with zero theme-side code.
   *
   * Skips elements that opt out (`themed === false`) or already have an explicit
   * `background` — so an explicit background always wins over the theme.
   */
  applyTo(el: UIElement): void {
    if (el.themed === false) return
    el.appliedTheme = this
    if (el.background) return

    if (el instanceof UIPanel) {
      el.background = this.panel
    } else if (el instanceof UIText) {
      el.color = this.colors.text
      el.font  = this.fontFamily
      if (this.font && !el.bitmapFont) el.bitmapFont = this.font
    }
  }

  /**
   * Applies this theme to `el`, then recursively to every descendant attached via
   * `addChild`. Used by `UICanvas` when a themed canvas gains a new top-level element,
   * and by `UIElement.addChild` to propagate an already-applied theme to late-added
   * children.
   */
  applyToSubtree(el: UIElement): void {
    this.applyTo(el)
    for (const child of el.children) this.applyToSubtree(child)
  }

  /**
   * Build a procedural rounded-rect skin baked to an offscreen canvas — no external
   * art. Looks better than flat rectangles out of the box and exercises the full
   * nine-slice pipeline. Falls back to a colour-only theme where no 2D canvas context
   * is available (e.g. headless tests), so widgets simply keep their colour fields.
   */
  static createDefault(opts: UIThemeDefaultOptions = {}): UITheme {
    const theme  = new UITheme()
    const fill   = opts.fill   ?? '#223044'
    const border = opts.border ?? '#48597a'
    const accent = opts.accent ?? '#5a9bd8'
    const text   = opts.text   ?? '#ffffff'
    theme.smoothing  = opts.smoothing ?? false
    theme.fontFamily = opts.fontFamily ?? DEFAULT_FONT_FAMILY
    theme.colors     = { text, border, fill }

    const TILE   = 24
    const radius = Math.max(0, Math.min(TILE / 2 - 1, opts.radius ?? 6))
    const inset  = Math.min(TILE / 2 - 1, radius + 2)
    const insets: NineSliceInsets = { left: inset, top: inset, right: inset, bottom: inset }

    const tiles: { fill: string; border: string; borderWidth?: number }[] = [
      { fill,                              border },                                   // 0 panel
      { fill: blendHex(fill, '#ffffff', 0.20), border: blendHex(border, '#ffffff', 0.20) }, // 1 button hover
      { fill: blendHex(fill, '#000000', 0.18), border },                              // 2 button pressed
      { fill: blendHex(fill, '#000000', 0.28), border },                              // 3 progress track
      { fill: accent, border: blendHex(accent, '#ffffff', 0.25) },                    // 4 progress fill
    ]

    let canvasEl: HTMLCanvasElement | null = null
    try { canvasEl = document.createElement('canvas') } catch { canvasEl = null }
    const ctx = canvasEl?.getContext('2d') ?? null
    if (!canvasEl || !ctx) return theme   // colour-only fallback

    const sheet = canvasEl
    sheet.width  = TILE
    sheet.height = TILE * tiles.length
    tiles.forEach((t, i) =>
      drawRoundedTile(ctx, 0, i * TILE, TILE, radius, t.fill, t.border, t.borderWidth ?? 1),
    )

    const region = (i: number): NineSliceSource =>
      ({ image: sheet, srcRect: new Rect(0, i * TILE, TILE, TILE) })

    theme.panel         = new NineSliceBackground(region(0), insets)
    theme.buttonHover   = new NineSliceBackground(region(1), insets)
    theme.buttonPressed = new NineSliceBackground(region(2), insets)
    theme.progressTrack = new NineSliceBackground(region(3), insets)
    theme.progressFill  = new NineSliceBackground(region(4), insets)
    return theme
  }

  /** Load a theme from a JSON descriptor + atlas texture. Mirrors {@link BitmapFont.load}. */
  static async load(path: string, assets: AssetLoader): Promise<UITheme> {
    const res  = await fetch(path)
    if (!res.ok) throw new Error(`UITheme: failed to load "${path}" (${res.status})`)
    const data  = await res.json() as UIThemeData
    const tex   = await assets.loadTexture(data.atlas)
    const theme = new UITheme()

    if (data.smoothing !== undefined) theme.smoothing = data.smoothing
    if (data.fontFamily) theme.fontFamily = data.fontFamily
    if (data.colors) {
      theme.colors = {
        text:   data.colors.text   ?? theme.colors.text,
        border: data.colors.border ?? theme.colors.border,
        fill:   data.colors.fill   ?? theme.colors.fill,
      }
    }
    if (data.font) theme.font = await BitmapFont.load(data.font, assets)

    const bg = (r?: UIThemeRegionData): NineSliceBackground | null =>
      r ? new NineSliceBackground({ texture: tex, srcRect: new Rect(...r.rect) }, r.insets) : null

    theme.panel         = bg(data.panel)
    theme.buttonHover   = bg(data.buttonHover)
    theme.buttonPressed = bg(data.buttonPressed)
    theme.progressTrack = bg(data.progressTrack)
    theme.progressFill  = bg(data.progressFill)
    return theme
  }
}

function drawRoundedTile(
  ctx:    CanvasRenderingContext2D,
  x:      number,
  y:      number,
  size:   number,
  radius: number,
  fill:   string,
  border: string,
  borderWidth: number,
): void {
  const o = borderWidth / 2
  ctx.beginPath()
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x + o, y + o, size - borderWidth, size - borderWidth, radius)
  } else {
    ctx.rect(x + o, y + o, size - borderWidth, size - borderWidth)
  }
  if (fill !== 'transparent') {
    ctx.fillStyle = fill
    ctx.fill()
  }
  ctx.lineWidth   = borderWidth
  ctx.strokeStyle = border
  ctx.stroke()
}
