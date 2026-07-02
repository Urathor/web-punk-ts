import type { IRect } from '@engine/renderer'
import type { NineSliceInsets } from './UIBackground'

/** A source→destination rectangle mapping for a single nine-slice patch. */
export interface NineSlicePair { src: IRect; dst: IRect }

/**
 * Pure geometry for a nine-patch. Maps the source sprite's nine regions onto the
 * destination rect: corners keep their native size, edges stretch along one axis, and
 * the centre stretches both. Zero insets collapse to a single full-stretch pair (the
 * plain-stretch degenerate case). Pairs with a non-positive dimension are omitted, and
 * the middle bands are clamped to ≥ 0 when the destination is smaller than the insets.
 */
export function computeNineSlice(
  src:    IRect,
  insets: NineSliceInsets,
  dst:    IRect,
): NineSlicePair[] {
  const l = Math.max(0, insets.left)
  const t = Math.max(0, insets.top)
  const r = Math.max(0, insets.right)
  const b = Math.max(0, insets.bottom)

  // Zero insets → single full stretch.
  if (l === 0 && t === 0 && r === 0 && b === 0) {
    return [{ src: { ...src }, dst: { ...dst } }]
  }

  // Source band coordinates.
  const sxL = src.x
  const sxC = src.x + l
  const sxR = src.x + src.width  - r
  const syT = src.y
  const syC = src.y + t
  const syB = src.y + src.height - b
  const sCW = Math.max(0, src.width  - l - r)
  const sCH = Math.max(0, src.height - t - b)

  // Round destination to integer pixels to prevent sub-pixel seams
  const dx = Math.round(dst.x)
  const dy = Math.round(dst.y)
  const dw = Math.round(dst.width)
  const dh = Math.round(dst.height)

  let dl = Math.round(l)
  let dt = Math.round(t)
  let dr = Math.round(r)
  let db = Math.round(b)

  // When the destination is smaller than an axis's total inset span, the corners
  // would otherwise keep their native size and spill past the destination bounds
  // (e.g. a bar shorter than `top + bottom`). Scale that axis's insets down
  // proportionally so the corners shrink to fit instead — the same approach CSS
  // `border-image` uses for undersized boxes.
  if (dl + dr > dw) {
    const scale = dl + dr > 0 ? dw / (dl + dr) : 0
    dl = Math.round(dl * scale)
    dr = dw - dl
  }
  if (dt + db > dh) {
    const scale = dt + db > 0 ? dh / (dt + db) : 0
    dt = Math.round(dt * scale)
    db = dh - dt
  }

  // Destination band coordinates (middle clamped when dst < insets).
  const dCW = Math.max(0, dw - dl - dr)
  const dCH = Math.max(0, dh - dt - db)
  const dxL = dx
  const dxC = dx + dl
  const dxR = dx + dw - dr
  const dyT = dy
  const dyC = dy + dt
  const dyB = dy + dh - db

  const pairs: NineSlicePair[] = []
  const push = (
    sx: number, sy: number, sw: number, sh: number,
    dx: number, dy: number, dw: number, dh: number,
  ): void => {
    if (sw <= 0 || sh <= 0 || dw <= 0 || dh <= 0) return
    pairs.push({
      src: { x: sx, y: sy, width: sw, height: sh },
      dst: { x: dx, y: dy, width: dw, height: dh },
    })
  }

  // Corners.
  push(sxL, syT, l, t, dxL, dyT, dl, dt)       // top-left
  push(sxR, syT, r, t, dxR, dyT, dr, dt)       // top-right
  push(sxL, syB, l, b, dxL, dyB, dl, db)       // bottom-left
  push(sxR, syB, r, b, dxR, dyB, dr, db)       // bottom-right
  // Edges.
  push(sxC, syT, sCW, t, dxC, dyT, dCW, dt)    // top
  push(sxC, syB, sCW, b, dxC, dyB, dCW, db)    // bottom
  push(sxL, syC, l, sCH, dxL, dyC, dl, dCH)    // left
  push(sxR, syC, r, sCH, dxR, dyC, dr, dCH)    // right
  // Centre.
  push(sxC, syC, sCW, sCH, dxC, dyC, dCW, dCH)

  return pairs
}
