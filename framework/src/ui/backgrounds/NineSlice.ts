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

  // Destination band coordinates (middle clamped when dst < insets).
  const dCW = Math.max(0, dst.width  - l - r)
  const dCH = Math.max(0, dst.height - t - b)
  const dxL = dst.x
  const dxC = dst.x + l
  const dxR = dst.x + dst.width  - r
  const dyT = dst.y
  const dyC = dst.y + t
  const dyB = dst.y + dst.height - b

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
  push(sxL, syT, l, t, dxL, dyT, l, t)         // top-left
  push(sxR, syT, r, t, dxR, dyT, r, t)         // top-right
  push(sxL, syB, l, b, dxL, dyB, l, b)         // bottom-left
  push(sxR, syB, r, b, dxR, dyB, r, b)         // bottom-right
  // Edges.
  push(sxC, syT, sCW, t, dxC, dyT, dCW, t)     // top
  push(sxC, syB, sCW, b, dxC, dyB, dCW, b)     // bottom
  push(sxL, syC, l, sCH, dxL, dyC, l, dCH)     // left
  push(sxR, syC, r, sCH, dxR, dyC, r, dCH)     // right
  // Centre.
  push(sxC, syC, sCW, sCH, dxC, dyC, dCW, dCH)

  return pairs
}
