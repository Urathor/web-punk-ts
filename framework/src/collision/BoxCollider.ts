import { Transform  } from '@engine/entities/components/Transform'
import { Rect, Vector2 } from '@engine/math'
import { BaseCollider } from './BaseCollider'

/**
 * Axis-aligned bounding-box collider.
 * Supports both solid (pushback) and trigger (event-only) modes via `isTrigger`.
 */
export class BoxCollider extends BaseCollider {
  /** Top-left offset from the entity's world position. */
  offset: Vector2 = new Vector2(0, 0)
  width:  number  = 16
  height: number  = 16

  /** Returns the world-space AABB for this frame. */
  getWorldBounds(): Rect {
    const transform = this.entity.getComponent(Transform)
    const pos       = transform?.worldPosition ?? new Vector2(0, 0)
    return new Rect(
      pos.x + this.offset.x,
      pos.y + this.offset.y,
      this.width,
      this.height
    )
  }
}
