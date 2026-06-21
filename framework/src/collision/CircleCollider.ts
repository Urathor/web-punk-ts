import { Transform } from '@engine/entities/components/Transform'
import { Vector2  } from '@engine/math'
import { BaseCollider } from './BaseCollider'

/**
 * Circle collider defined by a centre offset and radius.
 * Supports both solid (pushback) and trigger (event-only) modes via `isTrigger`.
 * Works against other CircleColliders (circle vs circle) and BoxColliders (circle vs AABB).
 */
export class CircleCollider extends BaseCollider {
  /** Offset from the entity's world position to the circle centre. */
  offset: Vector2 = new Vector2(0, 0)
  radius: number  = 8

  /** Returns the world-space centre of the circle. */
  getWorldCenter(): Vector2 {
    const transform = this.entity.getComponent(Transform)
    const pos       = transform?.worldPosition ?? new Vector2(0, 0)
    return new Vector2(pos.x + this.offset.x, pos.y + this.offset.y)
  }
}
