import { BaseComponent } from '@engine/entities/BaseComponent'
import { CollisionFace } from './AABB'

/**
 * Common base for BoxCollider and CircleCollider.
 * Defines layer/mask filtering, trigger flag, and shared callbacks.
 * CollisionSystem accepts any BaseCollider so Box and Circle interoperate.
 */
export abstract class BaseCollider extends BaseComponent {
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
}
