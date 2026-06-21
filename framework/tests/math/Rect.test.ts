import { Rect, Vector2 } from '@engine/math'

describe('Rect', () => {
  it('computes right and bottom', () => {
    const r = new Rect(10, 20, 30, 40)
    expect(r.right).toBe(40)
    expect(r.bottom).toBe(60)
  })

  it('computes center', () => {
    expect(new Rect(0, 0, 10, 10).center).toEqual(new Vector2(5, 5))
  })

  describe('contains', () => {
    it('returns true for a point inside', () => {
      expect(new Rect(0, 0, 100, 100).contains(new Vector2(50, 50))).toBe(true)
    })
    it('returns false for a point outside', () => {
      expect(new Rect(0, 0, 100, 100).contains(new Vector2(101, 50))).toBe(false)
    })
  })

  describe('intersects', () => {
    it('returns true for overlapping rects', () => {
      expect(new Rect(0, 0, 10, 10).intersects(new Rect(5, 5, 10, 10))).toBe(true)
    })
    it('returns false for non-overlapping rects', () => {
      expect(new Rect(0, 0, 10, 10).intersects(new Rect(11, 0, 10, 10))).toBe(false)
    })
    it('returns false for touching edges (open interval)', () => {
      expect(new Rect(0, 0, 10, 10).intersects(new Rect(10, 0, 10, 10))).toBe(false)
    })
  })

  describe('intersection', () => {
    it('returns null when not overlapping', () => {
      expect(new Rect(0, 0, 5, 5).intersection(new Rect(10, 10, 5, 5))).toBeNull()
    })
    it('returns the correct overlap rect', () => {
      const overlap = new Rect(0, 0, 10, 10).intersection(new Rect(5, 5, 10, 10))
      expect(overlap).toEqual(new Rect(5, 5, 5, 5))
    })
    it('returns null for touching edges', () => {
      expect(new Rect(0, 0, 10, 10).intersection(new Rect(10, 0, 10, 10))).toBeNull()
    })
  })

  it('clone returns a new instance with equal values', () => {
    const r  = new Rect(1, 2, 3, 4)
    const r2 = r.clone()
    expect(r2).toEqual(r)
    expect(r2).not.toBe(r)
  })
})
