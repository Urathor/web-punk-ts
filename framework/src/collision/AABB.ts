import { Rect, Vector2 } from '@engine/math'

export enum CollisionFace { None, Top, Bottom, Left, Right }

export interface CollisionResult {
  overlaps:    boolean
  face:        CollisionFace
  penetration: Vector2
}

// ── Box vs Box ────────────────────────────────────────────────────────────────

/**
 * Tests two axis-aligned bounding boxes.
 * Returns penetration that pushes 'a' away from 'b'.
 */
export function testAABB(a: Rect, b: Rect): CollisionResult {
  const intersection = a.intersection(b)
  if (!intersection) {
    return { overlaps: false, face: CollisionFace.None, penetration: new Vector2(0, 0) }
  }

  const w = intersection.width
  const h = intersection.height

  let face:        CollisionFace
  let penetration: Vector2

  if (w < h) {
    const onRight = a.center.x > b.center.x   // 'a' is to the right of 'b'
    face        = onRight ? CollisionFace.Left  : CollisionFace.Right
    penetration = new Vector2(onRight ? w : -w, 0)
  } else {
    const onBottom = a.center.y > b.center.y  // 'a' is below 'b'
    face        = onBottom ? CollisionFace.Top : CollisionFace.Bottom
    penetration = new Vector2(0, onBottom ? h : -h)
  }

  return { overlaps: true, face, penetration }
}

// ── Circle vs Circle ──────────────────────────────────────────────────────────

/**
 * Tests two circles.
 * Returns penetration that pushes circle 'a' away from circle 'b'.
 */
export function testCircleCircle(
  centerA: Vector2, radiusA: number,
  centerB: Vector2, radiusB: number
): CollisionResult {
  const dx   = centerA.x - centerB.x
  const dy   = centerA.y - centerB.y
  const dist2 = dx * dx + dy * dy
  const sum   = radiusA + radiusB

  if (dist2 >= sum * sum) {
    return { overlaps: false, face: CollisionFace.None, penetration: new Vector2(0, 0) }
  }

  const dist    = Math.sqrt(dist2)
  const overlap = sum - dist

  if (dist < 1e-6) {
    // Degenerate: perfectly overlapping — push right arbitrarily
    return { overlaps: true, face: CollisionFace.Right, penetration: new Vector2(overlap, 0) }
  }

  // Direction from b to a — push 'a' away
  const nx = dx / dist
  const ny = dy / dist
  return {
    overlaps: true,
    face: normalToFace(nx, ny),
    penetration: new Vector2(nx * overlap, ny * overlap)
  }
}

// ── Circle vs Box ─────────────────────────────────────────────────────────────

/**
 * Tests a circle against an AABB.
 * Returns penetration that pushes the CIRCLE away from the box.
 */
export function testCircleBox(
  circleCenter: Vector2, circleRadius: number,
  box: Rect
): CollisionResult {
  const clampedX = Math.max(box.x, Math.min(circleCenter.x, box.right))
  const clampedY = Math.max(box.y, Math.min(circleCenter.y, box.bottom))
  const dx       = circleCenter.x - clampedX
  const dy       = circleCenter.y - clampedY
  const dist2    = dx * dx + dy * dy

  if (dist2 >= circleRadius * circleRadius) {
    return { overlaps: false, face: CollisionFace.None, penetration: new Vector2(0, 0) }
  }

  const overlap = circleRadius - Math.sqrt(dist2)

  if (dist2 < 1e-6) {
    // Circle centre is inside the box — eject along the shortest edge
    const toLeft   = circleCenter.x - box.x
    const toRight  = box.right  - circleCenter.x
    const toTop    = circleCenter.y - box.y
    const toBottom = box.bottom - circleCenter.y
    const min = Math.min(toLeft, toRight, toTop, toBottom)
    if (min === toLeft)   return { overlaps: true, face: CollisionFace.Left,   penetration: new Vector2(-(toLeft   + circleRadius), 0) }
    if (min === toRight)  return { overlaps: true, face: CollisionFace.Right,  penetration: new Vector2(  toRight  + circleRadius,  0) }
    if (min === toTop)    return { overlaps: true, face: CollisionFace.Top,    penetration: new Vector2(0, -(toTop   + circleRadius)) }
                          return { overlaps: true, face: CollisionFace.Bottom, penetration: new Vector2(0,   toBottom + circleRadius) }
  }

  const dist = Math.sqrt(dist2)
  const nx   = dx / dist
  const ny   = dy / dist
  return {
    overlaps: true,
    face: normalToFace(nx, ny),
    penetration: new Vector2(nx * overlap, ny * overlap)
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns the face label that best matches a push normal. */
function normalToFace(nx: number, ny: number): CollisionFace {
  if (Math.abs(nx) >= Math.abs(ny)) {
    return nx > 0 ? CollisionFace.Right : CollisionFace.Left
  }
  return ny > 0 ? CollisionFace.Bottom : CollisionFace.Top
}

/** Returns the face on the opposite side. */
export function inverseFace(face: CollisionFace): CollisionFace {
  switch (face) {
    case CollisionFace.Top:    return CollisionFace.Bottom
    case CollisionFace.Bottom: return CollisionFace.Top
    case CollisionFace.Left:   return CollisionFace.Right
    case CollisionFace.Right:  return CollisionFace.Left
    default:                   return CollisionFace.None
  }
}
