import { Rect                  } from '@engine/math'
import type { UIBackground     } from './UIBackground'
import type { NineSliceInsets  } from './UIBackground'
import { NineSliceBackground   } from './NineSliceBackground'
import { SolidColorBackground  } from './SolidColorBackground'

export interface GenerateNineSliceOptions {
  fill:         string
  border:       string
  borderWidth?: number
  /** Corner radius of the procedural rounded-rect tile, in pixels. */
  radius?:      number
  /** Tile size (square), in pixels. */
  size?:        number
}

/**
 * Bake a single procedural rounded-rect tile to its own offscreen canvas and wrap it
 * as a nine-slice background — no external art required. This is the single
 * generation primitive: `ThemeSkin`'s "no art supplied" fallback calls it once per
 * omitted slot, and it's exported for consumers who want to build their own custom
 * generated skins the same way.
 *
 * Falls back to a `SolidColorBackground` where no 2D canvas context is available
 * (e.g. headless tests), so callers always get a usable `UIBackground` back.
 */
export function generateNineSliceSprite(opts: GenerateNineSliceOptions): UIBackground {
  const size        = opts.size ?? 24
  const borderWidth = opts.borderWidth ?? 1
  const radius      = Math.max(0, Math.min(size / 2 - 1, opts.radius ?? 6))
  const inset       = Math.min(size / 2 - 1, radius + 2)

  let canvasEl: HTMLCanvasElement | null = null
  try { canvasEl = document.createElement('canvas') } catch { canvasEl = null }
  const ctx = canvasEl?.getContext('2d') ?? null
  if (!canvasEl || !ctx) {
    return new SolidColorBackground({ fill: opts.fill, border: opts.border, borderWidth })
  }

  canvasEl.width  = size
  canvasEl.height = size
  drawRoundedTile(ctx, 0, 0, size, radius, opts.fill, opts.border, borderWidth)

  const insets: NineSliceInsets = { left: inset, top: inset, right: inset, bottom: inset }
  return new NineSliceBackground({ image: canvasEl, srcRect: new Rect(0, 0, size, size) }, insets)
}

/** Draws one rounded (or square, if `roundRect` is unsupported) filled+outlined tile
 *  onto `ctx` at `(x, y)`. Shared by {@link generateNineSliceSprite} and any other
 *  procedural-tile generation in the UI theme system. */
export function drawRoundedTile(
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
