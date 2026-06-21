import { Vector2                    } from '@engine/math'
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from '@engine/constants'

export const enum Anchor {
  TopLeft,     TopCenter,    TopRight,
  MiddleLeft,  Center,       MiddleRight,
  BottomLeft,  BottomCenter, BottomRight
}

/** Returns the anchor point in logical pixels for the given canvas dimensions. */
export function resolveAnchor(
  anchor:        Anchor,
  canvasWidth  = LOGICAL_WIDTH,
  canvasHeight = LOGICAL_HEIGHT
): Vector2 {
  const cx = canvasWidth  / 2
  const cy = canvasHeight / 2

  switch (anchor) {
    case Anchor.TopLeft:      return new Vector2(0,           0)
    case Anchor.TopCenter:    return new Vector2(cx,          0)
    case Anchor.TopRight:     return new Vector2(canvasWidth, 0)
    case Anchor.MiddleLeft:   return new Vector2(0,           cy)
    case Anchor.Center:       return new Vector2(cx,          cy)
    case Anchor.MiddleRight:  return new Vector2(canvasWidth, cy)
    case Anchor.BottomLeft:   return new Vector2(0,           canvasHeight)
    case Anchor.BottomCenter: return new Vector2(cx,          canvasHeight)
    case Anchor.BottomRight:  return new Vector2(canvasWidth, canvasHeight)
  }
}
