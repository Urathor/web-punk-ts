import { Transform } from '@engine/entities/components/Transform'
import { Vector2  } from '@engine/math'
import type { IRenderer } from '@engine/renderer'
import { BaseCollider } from './BaseCollider'

/**
 * Circle collider defined by a centre offset and radius.
 * Supports both solid (pushback) and trigger (event-only) modes via `isTrigger`.
 * Works against other CircleColliders (circle vs circle) and BoxColliders (circle vs AABB).
 */
export class CircleCollider extends BaseCollider {
  readonly shape = 'circle' as const

  /** Offset from the entity's world position to the circle centre. */
  offset: Vector2 = new Vector2(0, 0)
  radius: number  = 8

  /** Returns the world-space centre of the circle. */
  getWorldCenter(): Vector2 {
    const transform = this.entity.getComponent(Transform)
    const pos       = transform?.worldPosition ?? new Vector2(0, 0)
    return new Vector2(pos.x + this.offset.x, pos.y + this.offset.y)
  }

  containsPoint(point: Vector2): boolean {
    const c  = this.getWorldCenter()
    const dx = point.x - c.x
    const dy = point.y - c.y
    return dx * dx + dy * dy <= this.radius * this.radius
  }

  drawDebug(renderer: IRenderer, color: string): void {
    renderer.drawCircle(this.getWorldCenter(), this.radius, color, false)
  }
}
