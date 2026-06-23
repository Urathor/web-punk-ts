import { Rect       } from '@engine/math'
import type { Sprite } from '@engine/animation/Sprite'
import type { Tint   } from './backgrounds/UIBackground'

/** Image kinds the renderer's `drawImage` accepts. */
export type DrawableImage = HTMLImageElement | HTMLCanvasElement

export interface TintedImage {
  image:   DrawableImage
  srcRect: Rect
}

export function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n
}

/** Stable cache key for a baked tint, distinguishing colour vs fade and strength. */
export function tintCacheKey(sprite: Sprite, tint: Tint): string {
  const s    = sprite.srcRect
  const mode = tint.color ?? 'fade'
  return `${sprite.texture.path}|${s.x},${s.y},${s.width},${s.height}|${mode}|${clamp01(tint.strength)}`
}

/** Linearly blend `base` toward `toward` by `amount` (0..1). Hex in, hex out. */
export function blendHex(base: string, toward: string, amount: number): string {
  const a  = clamp01(amount)
  const c1 = parseHex(base)
  const c2 = parseHex(toward)
  if (!c1 || !c2) return base
  const r = Math.round(c1.r + (c2.r - c1.r) * a)
  const g = Math.round(c1.g + (c2.g - c1.g) * a)
  const b = Math.round(c1.b + (c2.b - c1.b) * a)
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const t = hex.trim().replace(/^#/, '')
  if (/^[0-9a-f]{6}$/i.test(t)) {
    const n = parseInt(t, 16)
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
  }
  if (/^[0-9a-f]{3}$/i.test(t)) {
    const n = parseInt(t.replace(/(.)/g, '$1$1'), 16)
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
  }
  return null
}

function toHex(n: number): string {
  const c = Math.max(0, Math.min(255, Math.round(n))).toString(16)
  return c.length === 1 ? `0${c}` : c
}

// Cache: null marks "could not bake here" (e.g. no 2D context under jsdom) so we never
// re-attempt and callers transparently fall back to the untinted sprite.
const cache = new Map<string, TintedImage | null>()

/**
 * Return a tinted (or alpha-faded) copy of a sprite frame, baked once to an offscreen
 * canvas and cached. Drawn later through the normal `renderer.drawImage`, so the
 * renderer needs no tint support. Falls back to the untinted sprite if a 2D context is
 * unavailable.
 */
export function bakeTint(sprite: Sprite, tint: Tint): TintedImage {
  const key      = tintCacheKey(sprite, tint)
  const existing = cache.get(key)
  if (existing !== undefined) {
    return existing ?? { image: sprite.texture.image, srcRect: sprite.srcRect }
  }
  const baked = renderTint(sprite, tint)
  cache.set(key, baked)
  return baked ?? { image: sprite.texture.image, srcRect: sprite.srcRect }
}

function renderTint(sprite: Sprite, tint: Tint): TintedImage | null {
  const s = sprite.srcRect
  const w = Math.max(1, Math.round(s.width))
  const h = Math.max(1, Math.round(s.height))

  let canvas: HTMLCanvasElement
  try {
    canvas = document.createElement('canvas')
  } catch {
    return null
  }
  canvas.width  = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const strength = clamp01(tint.strength)
  if (tint.color) {
    ctx.drawImage(sprite.texture.image, s.x, s.y, s.width, s.height, 0, 0, w, h)
    ctx.globalCompositeOperation = 'source-atop'
    ctx.globalAlpha              = strength
    ctx.fillStyle                = tint.color
    ctx.fillRect(0, 0, w, h)
  } else {
    ctx.globalAlpha = clamp01(1 - strength)
    ctx.drawImage(sprite.texture.image, s.x, s.y, s.width, s.height, 0, 0, w, h)
  }
  return { image: canvas, srcRect: new Rect(0, 0, w, h) }
}
