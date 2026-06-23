import { computeNineSlice } from '@engine/ui'

describe('computeNineSlice', () => {
  const src    = { x: 0, y: 0, width: 24, height: 24 }
  const insets = { left: 8, top: 8, right: 8, bottom: 8 }

  it('returns a single full-stretch pair when insets are zero', () => {
    const dst   = { x: 10, y: 20, width: 100, height: 50 }
    const pairs = computeNineSlice(src, { left: 0, top: 0, right: 0, bottom: 0 }, dst)
    expect(pairs).toHaveLength(1)
    expect(pairs[0]!.src).toEqual(src)
    expect(pairs[0]!.dst).toEqual(dst)
  })

  it('produces 9 patches with pixel-perfect corners', () => {
    const dst   = { x: 0, y: 0, width: 100, height: 60 }
    const pairs = computeNineSlice(src, insets, dst)
    expect(pairs).toHaveLength(9)
    // First pushed pair is the top-left corner.
    expect(pairs[0]!.src).toEqual({ x: 0, y: 0, width: 8, height: 8 })
    expect(pairs[0]!.dst).toEqual({ x: 0, y: 0, width: 8, height: 8 })
  })

  it('stretches the centre to fill the remainder', () => {
    const dst    = { x: 0, y: 0, width: 100, height: 60 }
    const pairs  = computeNineSlice(src, insets, dst)
    const centre = pairs[pairs.length - 1]!
    expect(centre.src).toEqual({ x: 8, y: 8, width: 8,  height: 8  })
    expect(centre.dst).toEqual({ x: 8, y: 8, width: 84, height: 44 })
  })

  it('clamps the middle bands to zero when the destination is smaller than the insets', () => {
    const dst   = { x: 0, y: 0, width: 10, height: 10 }   // < left + right (16)
    const pairs = computeNineSlice(src, insets, dst)
    expect(pairs).toHaveLength(4)                          // only the corners survive
    for (const p of pairs) {
      expect(p.dst.width).toBeGreaterThan(0)
      expect(p.dst.height).toBeGreaterThan(0)
    }
  })
})
