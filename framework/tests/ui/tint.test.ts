import type { Sprite } from '@engine/animation'
import { blendHex, tintCacheKey, clamp01 } from '@engine/ui/tint'

const sprite = {
  texture: { path: 'atlas.png', image: {} as unknown as HTMLImageElement },
  srcRect: { x: 0, y: 0, width: 16, height: 16 },
} as unknown as Sprite

describe('blendHex', () => {
  it('blends to the midpoint', () => {
    expect(blendHex('#000000', '#ffffff', 0.5)).toBe('#808080')
  })

  it('clamps the amount to [0, 1]', () => {
    expect(blendHex('#000000', '#ffffff', -1)).toBe('#000000')
    expect(blendHex('#000000', '#ffffff',  2)).toBe('#ffffff')
  })

  it('accepts 3-digit hex', () => {
    expect(blendHex('#000', '#fff', 0)).toBe('#000000')
  })
})

describe('tintCacheKey', () => {
  it('is stable for equal inputs', () => {
    expect(tintCacheKey(sprite, { color: '#fff', strength: 0.2 }))
      .toBe(tintCacheKey(sprite, { color: '#fff', strength: 0.2 }))
  })

  it('distinguishes colour vs fade and differing strengths', () => {
    const colour   = tintCacheKey(sprite, { color: '#fff', strength: 0.2 })
    const fade     = tintCacheKey(sprite, { strength: 0.2 })
    const stronger = tintCacheKey(sprite, { color: '#fff', strength: 0.5 })
    expect(colour).not.toBe(fade)
    expect(colour).not.toBe(stronger)
  })
})

describe('clamp01', () => {
  it('clamps to the unit range', () => {
    expect(clamp01(-0.2)).toBe(0)
    expect(clamp01(1.5)).toBe(1)
    expect(clamp01(0.3)).toBe(0.3)
  })
})
