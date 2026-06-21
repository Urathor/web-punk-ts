export class Vector2 {
  constructor(public x: number = 0, public y: number = 0) {}

  add(other: Vector2): Vector2 {
    return new Vector2(this.x + other.x, this.y + other.y)
  }

  sub(other: Vector2): Vector2 {
    return new Vector2(this.x - other.x, this.y - other.y)
  }

  scale(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar)
  }

  get magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

  normalize(): Vector2 {
    const mag = this.magnitude
    if (mag === 0) return new Vector2(0, 0)
    return new Vector2(this.x / mag, this.y / mag)
  }

  dot(other: Vector2): number {
    return this.x * other.x + this.y * other.y
  }

  lerp(target: Vector2, t: number): Vector2 {
    return new Vector2(
      this.x + (target.x - this.x) * t,
      this.y + (target.y - this.y) * t
    )
  }

  clone(): Vector2 {
    return new Vector2(this.x, this.y)
  }

  equals(other: Vector2): boolean {
    return this.x === other.x && this.y === other.y
  }

  toString(): string {
    return `Vector2(${this.x}, ${this.y})`
  }

  static readonly ZERO  = new Vector2(0, 0)
  static readonly ONE   = new Vector2(1, 1)
  static readonly UP    = new Vector2(0, -1)
  static readonly DOWN  = new Vector2(0,  1)
  static readonly LEFT  = new Vector2(-1, 0)
  static readonly RIGHT = new Vector2(1,  0)
}
