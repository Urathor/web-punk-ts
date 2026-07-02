import { Vector2, Rect                } from '@engine/math'
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from '@engine/constants'

// NOTE: a plain `enum` (not `const enum`) so the published .d.ts is safe to
// consume under `isolatedModules` / `verbatimModuleSyntax`.
export enum Anchor {
  TopLeft,     TopCenter,    TopRight,
  MiddleLeft,  Center,       MiddleRight,
  BottomLeft,  BottomCenter, BottomRight
}

// Current logical canvas size used to resolve anchors when explicit dimensions
// are not supplied. Starts at the default logical resolution and is updated by
// the Engine from the renderer's logical size (see setAnchorCanvasSize).
let defaultWidth  = LOGICAL_WIDTH
let defaultHeight = LOGICAL_HEIGHT

/**
 * Set the logical canvas size used by {@link resolveAnchor} when it is called
 * without explicit dimensions. The Engine calls this once with the renderer's
 * logical resolution so UI anchored via the defaults follows a custom resolution.
 */
export function setAnchorCanvasSize(width: number, height: number): void {
  defaultWidth  = width
  defaultHeight = height
}

/**
 * Returns the anchor point within an arbitrary rectangle, in `bounds`' own coordinate
 * space. Used to resolve a `UIElement`'s anchor relative to its parent's bounds instead
 * of the whole logical canvas — see {@link resolveAnchor} for the canvas-root case.
 */
export function resolveAnchorInRect(anchor: Anchor, bounds: Rect): Vector2 {
  const { x, y, right, bottom } = bounds
  const { x: cx, y: cy }        = bounds.center

  switch (anchor) {
    case Anchor.TopLeft:      return new Vector2(x,     y)
    case Anchor.TopCenter:    return new Vector2(cx,    y)
    case Anchor.TopRight:     return new Vector2(right, y)
    case Anchor.MiddleLeft:   return new Vector2(x,     cy)
    case Anchor.Center:       return new Vector2(cx,    cy)
    case Anchor.MiddleRight:  return new Vector2(right, cy)
    case Anchor.BottomLeft:   return new Vector2(x,     bottom)
    case Anchor.BottomCenter: return new Vector2(cx,    bottom)
    case Anchor.BottomRight:  return new Vector2(right, bottom)
  }
}

/** Returns the anchor point in logical pixels for the given canvas dimensions. */
export function resolveAnchor(
  anchor:        Anchor,
  canvasWidth  = defaultWidth,
  canvasHeight = defaultHeight
): Vector2 {
  return resolveAnchorInRect(anchor, new Rect(0, 0, canvasWidth, canvasHeight))
}
