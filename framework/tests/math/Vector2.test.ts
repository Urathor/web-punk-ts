import { Vector2 } from '@engine/math'

describe('Vector2', () => {
  describe('arithmetic', () => {
    it('adds two vectors', () => {
      expect(new Vector2(1, 2).add(new Vector2(3, 4))).toEqual(new Vector2(4, 6))
    })
    it('subtracts', () => {
      expect(new Vector2(5, 3).sub(new Vector2(2, 1))).toEqual(new Vector2(3, 2))
    })
    it('scales', () => {
      expect(new Vector2(2, 4).scale(3)).toEqual(new Vector2(6, 12))
    })
  })

  describe('magnitude', () => {
    it('computes magnitude of (3, 4) as 5', () => {
      expect(new Vector2(3, 4).magnitude).toBeCloseTo(5)
    })
    it('normalizes to unit length', () => {
      expect(new Vector2(3, 4).normalize().magnitude).toBeCloseTo(1)
    })
    it('returns ZERO for zero-vector normalize', () => {
      expect(new Vector2(0, 0).normalize()).toEqual(new Vector2(0, 0))
    })
  })

  describe('lerp', () => {
    it('returns start at t=0',      () => expect(new Vector2(0, 0).lerp(new Vector2(10, 0), 0)).toEqual(new Vector2(0,  0)))
    it('returns end at t=1',        () => expect(new Vector2(0, 0).lerp(new Vector2(10, 0), 1)).toEqual(new Vector2(10, 0)))
    it('returns midpoint at t=0.5', () => expect(new Vector2(0, 0).lerp(new Vector2(10, 0), 0.5)).toEqual(new Vector2(5, 0)))
  })

  it('dot product — perpendicular vectors = 0', () => {
    expect(new Vector2(1, 0).dot(new Vector2(0, 1))).toBe(0)
  })
  it('dot product — parallel unit vectors = 1', () => {
    expect(new Vector2(1, 0).dot(new Vector2(1, 0))).toBe(1)
  })

  it('clone returns a new instance with equal values', () => {
    const a = new Vector2(3, 7)
    const b = a.clone()
    expect(b).toEqual(a)
    expect(b).not.toBe(a)
  })

  it('equals returns true for same values', () => {
    expect(new Vector2(2, 4).equals(new Vector2(2, 4))).toBe(true)
  })
  it('equals returns false for different values', () => {
    expect(new Vector2(2, 4).equals(new Vector2(2, 5))).toBe(false)
  })
})
