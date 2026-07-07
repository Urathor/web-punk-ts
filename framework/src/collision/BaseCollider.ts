import { BaseComponent } from '@engine/entities/BaseComponent'
import type { IRenderer } from '@engine/renderer'
import type { Vector2  } from '@engine/math'
import { CollisionFace } from './AABB'

/**
 * Common base for BoxCollider, CircleCollider, and any future collider shape.
 * Defines layer/mask filtering, trigger flag, shared callbacks, and the
 * polymorphic surface (`shape`, `containsPoint`, `drawDebug`) that lets
 * CollisionSystem/Debugger/DebugOverlay work with any shape without
 * `instanceof` chains — adding a new shape only means implementing this
 * class plus registering its pair tests in `ColliderPairTests.ts` (OCP).
 */
export abstract class BaseCollider extends BaseComponent {
  /** Discriminant used by the collision-test registry (e.g. 'box', 'circle'). */
  abstract readonly shape: string

  /** Bit flag — which collision layer this collider sits on. */
  layer:     number  = 0b00000001
  /** Bit mask — which layers this collider interacts with. */
  mask:      number  = 0b11111111
  /** true = fire events only, no positional pushback. */
  isTrigger: boolean = false
  /** true = resolveOverlap will not move this collider; only the other entity is pushed. */
  isStatic:  boolean = false

  onCollisionEnter?: (other: BaseCollider, face: CollisionFace) => void
  onCollisionStay?:  (other: BaseCollider) => void
  onCollisionExit?:  (other: BaseCollider) => void
  onTriggerEnter?:   (other: BaseCollider) => void
  onTriggerStay?:    (other: BaseCollider) => void
  onTriggerExit?:    (other: BaseCollider) => void

  /** Returns true if this collider's mask includes the other's layer. */
  shouldCollideWith(other: BaseCollider): boolean {
    return (this.mask & other.layer) !== 0
  }

  /** Returns true if the given world-space point lies within this collider's shape. */
  abstract containsPoint(point: Vector2): boolean

  /** Draws this collider's wireframe. Called with the camera transform already applied. */
  abstract drawDebug(renderer: IRenderer, color: string): void
}
