import { UIElement       } from '../UIElement'
import type { IRenderer  } from '@engine/renderer'
import { Rect, Vector2   } from '@engine/math'
import { computeGridLayout } from './gridLayout'
import type { GridLayoutMode } from './gridLayout'

/**
 * A layout container: arranges its children (any `UIElement`, added via the inherited
 * `addChild`) into a row, column, or grid — computing each child's `offset` from
 * `mode`/`columns`/`rows`/`padding`/`cellSize`, removing manual anchor/offset math for
 * common layouts. Draws nothing itself; children render themselves via the generic
 * recursive child-render walk.
 *
 * Repurposed from the previous sprite/quantity inventory-cell widget (see
 * `PATCHNOTES.md`) — there is no back-compat shim for the old `GridCell`/`setCell` API.
 * Build an inventory-style UI from this layout container plus `UIImage`/`UIText`
 * children instead.
 */
export class UIGrid extends UIElement {
  mode: GridLayoutMode = 'grid'
  /** Number of columns in `'grid'` mode. Ignored in `'row'`/`'column'` mode. */
  columns: number = 4
  /** Optional explicit row count in `'grid'` mode — derived from child count
   *  (`Math.ceil(children.length / columns)`) when unset. Ignored in `'row'`/
   *  `'column'` mode. */
  rows?: number
  /** Fixed cell size (square) in logical pixels. `null` (default) sizes each
   *  row/column dynamically from its children's own `getBounds()`. */
  cellSize: number | null = null
  /** Gap between cells, and around the outer edge, in logical pixels. */
  padding: number = 2

  private _lastSignature:  string | null = null
  private _lastTotalWidth  = 0
  private _lastTotalHeight = 0

  update(_dt: number): void {
    const kids  = this.children
    const sizes = kids.map(c => c.getBounds())
    const sig   = this.buildSignature(sizes)
    if (sig === this._lastSignature) return
    this._lastSignature = sig

    const layout = computeGridLayout(sizes, {
      mode:     this.mode,
      columns:  this.columns,
      rows:     this.rows,
      cellSize: this.cellSize,
      padding:  this.padding,
    })
    kids.forEach((child, i) => {
      const o = layout.offsets[i]!
      child.offset = new Vector2(o.x, o.y)
    })
    this._lastTotalWidth  = layout.totalWidth
    this._lastTotalHeight = layout.totalHeight
  }

  /** Cheap "did anything change" signature — own layout knobs, child count, and each
   *  child's current size — so `update()` only recomputes/reassigns offsets when
   *  something actually changed (including a child auto-resizing itself, e.g. a
   *  `UIText` whose `.text` changed, since `getBounds()` reflects that immediately). */
  private buildSignature(sizes: { width: number; height: number }[]): string {
    const own = `${this.mode}|${this.columns}|${this.rows ?? ''}|${this.cellSize ?? ''}|${this.padding}`
    return `${own}|${sizes.map(s => `${s.width}x${s.height}`).join(',')}`
  }

  /** Auto-sizes from the computed layout unless an explicit `width`/`height` is set
   *  (the "explicit wins" convention used elsewhere, e.g. `UIText`). */
  getBounds(): Rect {
    const pos = this.getPosition()
    return new Rect(
      pos.x, pos.y,
      this.width  || this._lastTotalWidth,
      this.height || this._lastTotalHeight,
    )
  }

  render(_renderer: IRenderer, _interpolation: number): void {
    // no-op — this widget draws nothing itself; children render via the generic walk.
  }
}

