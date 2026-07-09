import { Rect                  } from '@engine/math'
import { DEFAULT_FONT_FAMILY    } from '@engine/constants'
import type { AssetLoader      } from '@engine/assets'
import { BitmapFont            } from './BitmapFont'
import { NineSliceBackground   } from './backgrounds'
import type { NineSliceInsets  } from './backgrounds'
import type { UIElement        } from './UIElement'
import { UIPanel               } from './widgets/UIPanel'
import { UIText                } from './widgets/UIText'
import { ThemeSkin              } from './ThemeSkin'
import type { ThemeSkinOptions, ThemeSkinGenerateOptions } from './ThemeSkin'

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

/** JSON descriptor consumed by {@link UITheme.load}. Describes the theme's `'default'`
 *  skin — call {@link UITheme.addSkin} in code to register additional named skins. */
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
  button?:        UIThemeRegionData
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
 * A thin skin *registry* that maps each widget kind (and button state) to a
 * {@link ThemeSkin} bundle, keyed by name, plus a default {@link BitmapFont} and
 * fallback colour tokens shared by every skin. Applying a theme assigns a resolved
 * skin's backgrounds onto widgets — there is no separate render path, and widgets
 * with no theme keep their colour fields, so the colour look remains the fallback.
 *
 * A widget opts into a specific skin via its own `skinName` (default `'default'`),
 * so one theme can hold multiple interchangeable looks (e.g. `'default'`, `'wood'`,
 * `'dialog'`) and different widgets can each pick whichever they want.
 */
export class UITheme {
  smoothing = false
  font: BitmapFont | null = null
  /** CSS font family applied to text widgets' canvas-text fallback (when no BitmapFont). */
  fontFamily = DEFAULT_FONT_FAMILY
  colors: UIThemeColors = { text: '#ffffff', border: '#8899aa', fill: '#223044' }

  /** Named skin bundles. Always has a `'default'` entry — seeded with a procedurally
   *  generated look, exactly like `UITheme.createDefault()` produces. The `default`
   *  key is a required, statically-known property (not just an index signature entry)
   *  so `theme.skins.default` is always a `ThemeSkin`, never `undefined`. */
  skins: { default: ThemeSkin; [name: string]: ThemeSkin } = { default: new ThemeSkin() }

  /** Register (or replace) a named skin. */
  addSkin(name: string, skin: ThemeSkin): void {
    this.skins[name] = skin
  }

  /** Resolve a widget's chosen skin by name, falling back to `'default'` when the
   *  name isn't registered. */
  getSkin(name: string): ThemeSkin {
    return this.skins[name] ?? this.skins.default
  }

  /**
   * Assign this theme's background/font to a widget. Only understands the two real
   * rendering primitives (`UIPanel`, `UIText`) — composite widgets (`UIButton`,
   * `UIProgressBar`, `UIGrid`, or any user-defined composite) are never special-cased
   * here. Instead, they read `this.appliedTheme` themselves (set below, on every
   * themed element) in their own `update()`/`render()`, resolve their own skin via
   * `this.getSkin(this.skinName)`, and forward relevant values to their own
   * base-component children. This keeps `UITheme` decoupled from widget kinds beyond
   * the two primitives, so a custom composite widget built from `UIPanel`/`UIText`
   * children gets themed automatically with zero theme-side code.
   *
   * Skips elements that opt out (`themed === false`) or already have an explicit
   * `background` — so an explicit background always wins over the theme.
   */
  applyTo(el: UIElement): void {
    if (el.themed === false) return
    el.appliedTheme = this
    if (el.background) return

    const skin = this.getSkin(el.skinName)
    if (el instanceof UIPanel) {
      el.background = skin.panel
    } else if (el instanceof UIText) {
      el.color = this.colors.text
      el.font  = skin.fontFamily ?? this.fontFamily
      const font = skin.font ?? this.font
      if (font && !el.bitmapFont) el.bitmapFont = font
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
    const generate: ThemeSkinGenerateOptions = { fill, border, accent }
    if (opts.radius !== undefined) generate.radius = opts.radius
    theme.skins.default = new ThemeSkin({ generate })
    return theme
  }

  /** Load a theme from a JSON descriptor + atlas texture, registered as the
   *  `'default'` skin. Mirrors {@link BitmapFont.load}. */
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

    const bg = (r?: UIThemeRegionData): NineSliceBackground | undefined =>
      r ? new NineSliceBackground({ texture: tex, srcRect: new Rect(...r.rect) }, r.insets) : undefined

    const panel         = bg(data.panel)
    const button        = bg(data.button)
    const buttonHover   = bg(data.buttonHover)
    const buttonDown    = bg(data.buttonPressed)
    const progressTrack = bg(data.progressTrack)
    const progressFill  = bg(data.progressFill)

    const skinOpts: ThemeSkinOptions = {}
    if (panel)         skinOpts.panel         = panel
    if (button)        skinOpts.button        = button
    if (buttonHover)   skinOpts.buttonHover    = buttonHover
    if (buttonDown)    skinOpts.buttonDown     = buttonDown
    if (progressTrack) skinOpts.progressTrack = progressTrack
    if (progressFill)  skinOpts.progressFill  = progressFill
    theme.skins.default = new ThemeSkin(skinOpts)
    return theme
  }
}
