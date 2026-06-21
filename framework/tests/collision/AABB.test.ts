import { testAABB, CollisionFace } from '@engine/collision'
import { Rect } from '@engine/math'

describe('testAABB', () => {
  it('returns overlaps:false for separated rects', () => {
    const r = testAABB(new Rect(0, 0, 10, 10), new Rect(20, 0, 10, 10))
    expect(r.overlaps).toBe(false)
    expect(r.face).toBe(CollisionFace.None)
  })

  it('returns overlaps:true for overlapping rects', () => {
    const r = testAABB(new Rect(0, 0, 10, 10), new Rect(5, 0, 10, 10))
    expect(r.overlaps).toBe(true)
  })

  it('detects Left face when A overlaps from the right', () => {
    // A is to the right and overlapping B's right side — push A left
    const r = testAABB(new Rect(8, 0, 10, 10), new Rect(0, 0, 10, 10))
    expect(r.face).toBe(CollisionFace.Left)
  })

  it('detects Right face when A overlaps from the left', () => {
    const r = testAABB(new Rect(0, 0, 10, 10), new Rect(5, 0, 10, 10))
    expect(r.face).toBe(CollisionFace.Right)
  })

  it('detects Top face when A overlaps from below', () => {
    const r = testAABB(new Rect(0, 8, 10, 10), new Rect(0, 0, 10, 10))
    expect(r.face).toBe(CollisionFace.Top)
  })

  it('detects Bottom face when A overlaps from above', () => {
    const r = testAABB(new Rect(0, 0, 10, 10), new Rect(0, 5, 10, 10))
    expect(r.face).toBe(CollisionFace.Bottom)
  })

  it('penetration resolves the overlap', () => {
    const a = new Rect(5, 0, 10, 10)
    const b = new Rect(0, 0, 10, 10)
    const r = testAABB(a, b)
    const resolved = new Rect(a.x + r.penetration.x, a.y + r.penetration.y, a.width, a.height)
    expect(resolved.intersects(b)).toBe(false)
  })

  it('returns zero penetration for non-overlapping rects', () => {
    const r = testAABB(new Rect(0, 0, 5, 5), new Rect(10, 0, 5, 5))
    expect(r.penetration.x).toBe(0)
    expect(r.penetration.y).toBe(0)
  })
})
