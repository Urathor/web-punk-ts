import { Vector2 } from '@engine/math'
import type { BaseCollider } from './BaseCollider'
import type { BoxCollider } from './BoxCollider'
import type { CircleCollider } from './CircleCollider'
import {
  testAABB, testCircleCircle, testCircleBox, inverseFace,
  CollisionFace, type CollisionResult
} from './AABB'

type PairTester = (a: BaseCollider, b: BaseCollider) => CollisionResult

/**
 * Registry of collision tests keyed by `"shapeA:shapeB"` (matching
 * `BaseCollider.shape`). Adding a new collider shape means registering its
 * test function(s) here — `CollisionSystem` never needs to change (OCP).
 */
const PAIR_TESTERS: Record<string, PairTester> = {
  'box:box': (a, b) =>
    testAABB((a as BoxCollider).getWorldBounds(), (b as BoxCollider).getWorldBounds()),

  'circle:circle': (a, b) => {
    const ca = a as CircleCollider
    const cb = b as CircleCollider
    return testCircleCircle(ca.getWorldCenter(), ca.radius, cb.getWorldCenter(), cb.radius)
  },

  // testCircleBox returns penetration that pushes the circle (a) out of the box (b).
  'circle:box': (a, b) => {
    const ca = a as CircleCollider
    const cb = b as BoxCollider
    return testCircleBox(ca.getWorldCenter(), ca.radius, cb.getWorldBounds())
  },
}

let warnedMissingPair = false

/**
 * Dispatches to the correct intersection test for any pair of collider
 * shapes via the {@link PAIR_TESTERS} registry (checked both orderings).
 * Penetration always pushes `a` away from `b`.
 *
 * Unknown shape pairs are NOT silently treated as solid geometry — a
 * dev-mode warning is logged once so a missing registration is noticed
 * instead of causing colliders to silently stop colliding (LSP hazard).
 */
export function testColliderPair(a: BaseCollider, b: BaseCollider): CollisionResult {
  const direct = PAIR_TESTERS[`${a.shape}:${b.shape}`]
  if (direct) return direct(a, b)

  const reversed = PAIR_TESTERS[`${b.shape}:${a.shape}`]
  if (reversed) {
    const r = reversed(b, a)
    if (!r.overlaps) return r
    return {
      overlaps:    true,
      face:        inverseFace(r.face),
      penetration: new Vector2(-r.penetration.x, -r.penetration.y)
    }
  }

  if (process.env.NODE_ENV !== 'production' && !warnedMissingPair) {
    warnedMissingPair = true
    console.warn(
      `CollisionSystem: no collision test registered for shape pair "${a.shape}" vs "${b.shape}" — ` +
      `treating as non-overlapping. Register a tester in PAIR_TESTERS (collision/ColliderPairTests.ts).`
    )
  }
  return { overlaps: false, face: CollisionFace.None, penetration: new Vector2(0, 0) }
}
