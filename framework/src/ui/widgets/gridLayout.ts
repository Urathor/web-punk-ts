/** Layout arrangement for {@link UIGrid}. */
export type GridLayoutMode = 'row' | 'column' | 'grid'

export interface GridLayoutOptions {
  mode:     GridLayoutMode
  /** Number of columns in `'grid'` mode. Ignored in `'row'`/`'column'` mode. */
  columns:  number
  /** Optional explicit row count in `'grid'` mode — derived from child count
   *  (`Math.ceil(count / columns)`) when unset. Ignored in `'row'`/`'column'` mode. */
  rows?:    number | undefined
  /** Fixed cell size (square), or `null` to size each row/column dynamically from
   *  the corresponding child sizes. */
  cellSize: number | null
  /** Gap between cells, and around the outer edge, in logical pixels. */
  padding:  number
}

export interface GridLayoutResult {
  /** One offset per input size, in the same order. */
  offsets:     { x: number; y: number }[]
  totalWidth:  number
  totalHeight: number
}

/**
 * Pure layout function: given an ordered list of child sizes and the layout knobs,
 * produces an `{ x, y }` offset per child (row-major) plus the container's total
 * extent. Contains no `UIElement`/rendering dependencies — safe to unit test in
 * isolation from `UIGrid` itself.
 *
 * Dynamic sizing (`cellSize` unset): each column's width is the max width of the
 * children placed in it; each row's height is the max height of the children placed
 * in it (a simple table layout). Fixed sizing (`cellSize` set): every cell is exactly
 * `cellSize × cellSize`, reproducing the previous uniform-grid look.
 */
export function computeGridLayout(
  sizes: { width: number; height: number }[],
  opts:  GridLayoutOptions,
): GridLayoutResult {
  const { mode, padding, cellSize } = opts
  const n = sizes.length

  const columns = Math.max(1, mode === 'column' ? 1 : mode === 'row' ? n : opts.columns)
  const rows    = Math.max(1, mode === 'row'    ? 1 : mode === 'column' ? n : (opts.rows ?? Math.ceil(n / columns)))

  const rowOf = (i: number): number => mode === 'row' ? 0 : mode === 'column' ? i : Math.floor(i / columns)
  const colOf = (i: number): number => mode === 'row' ? i : mode === 'column' ? 0 : i % columns

  const colWidth  = new Array<number>(columns).fill(cellSize ?? 0)
  const rowHeight = new Array<number>(rows).fill(cellSize ?? 0)

  for (let i = 0; i < n; i++) {
    const w = cellSize ?? sizes[i]!.width
    const h = cellSize ?? sizes[i]!.height
    const c = colOf(i)
    const r = rowOf(i)
    if (w > colWidth[c]!)  colWidth[c]  = w
    if (h > rowHeight[r]!) rowHeight[r] = h
  }

  const colOffsetX = new Array<number>(columns)
  {
    let acc = padding
    for (let c = 0; c < columns; c++) { colOffsetX[c] = acc; acc += colWidth[c]! + padding }
  }
  const rowOffsetY = new Array<number>(rows)
  {
    let acc = padding
    for (let r = 0; r < rows; r++) { rowOffsetY[r] = acc; acc += rowHeight[r]! + padding }
  }

  const offsets = sizes.map((_, i) => ({ x: colOffsetX[colOf(i)]!, y: rowOffsetY[rowOf(i)]! }))

  const totalWidth  = padding + colWidth.reduce((sum, w) => sum + w + padding, 0)
  const totalHeight = padding + rowHeight.reduce((sum, h) => sum + h + padding, 0)

  return { offsets, totalWidth, totalHeight }
}
