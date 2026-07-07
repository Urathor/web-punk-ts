import { Transform  } from '@engine/entities/components/Transform'
import { Rect, Vector2 } from '@engine/math'
import type { IRenderer } from '@engine/renderer'
import { BaseCollider } from './BaseCollider'

/**
 * Axis-aligned bounding-box collider.
 * Supports both solid (pushback) and trigger (event-only) modes via `isTrigger`.
 */
export class BoxCollider extends BaseCollider {
  readonly shape = 'box' as const

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

  containsPoint(point: Vector2): boolean {
    return this.getWorldBounds().contains(point)
  }

  drawDebug(renderer: IRenderer, color: string): void {
    renderer.drawRect(this.getWorldBounds(), color, false)
  }
}
