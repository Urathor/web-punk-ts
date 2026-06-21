import { Vector2 } from './Vector2'

export class Rect {
  constructor(
    public x:      number = 0,
    public y:      number = 0,
    public width:  number = 0,
    public height: number = 0
  ) {}

  get right():  number { return this.x + this.width  }
  get bottom(): number { return this.y + this.height }

  get center(): Vector2 {
    return new Vector2(this.x + this.width / 2, this.y + this.height / 2)
  }

  contains(point: { x: number; y: number }): boolean {
    return point.x >= this.x && point.x <= this.right &&
           point.y >= this.y && point.y <= this.bottom
  }

  intersects(other: { x: number; y: number; width: number; height: number }): boolean {
    return this.x < other.x + other.width  && this.right  > other.x &&
           this.y < other.y + other.height && this.bottom > other.y
  }

  /** Returns the overlap rectangle if intersecting, otherwise null. */
  intersection(other: Rect): Rect | null {
    const x = Math.max(this.x, other.x)
    const y = Math.max(this.y, other.y)
    const r = Math.min(this.right,  other.right)
    const b = Math.min(this.bottom, other.bottom)
    if (r <= x || b <= y) return null
    return new Rect(x, y, r - x, b - y)
  }

  clone(): Rect {
    return new Rect(this.x, this.y, this.width, this.height)
  }

  static fromCenter(center: { x: number; y: number }, width: number, height: number): Rect {
    return new Rect(center.x - width / 2, center.y - height / 2, width, height)
  }
}
