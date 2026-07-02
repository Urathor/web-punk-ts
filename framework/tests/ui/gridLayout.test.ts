import { computeGridLayout } from '@engine/ui/widgets/gridLayout'

describe('computeGridLayout — grid mode', () => {
  it('lays out a uniform fixed-size grid identically to the old cellSize-based layout', () => {
    const sizes = Array.from({ length: 5 }, () => ({ width: 10, height: 10 }))
    const { offsets, totalWidth, totalHeight } = computeGridLayout(sizes, {
      mode: 'grid', columns: 3, cellSize: 18, padding: 2,
    })

    // 5 children, 3 columns → 2 rows (ceil(5/3))
    expect(offsets).toEqual([
      { x: 2,  y: 2  }, { x: 22, y: 2  }, { x: 42, y: 2  },
      { x: 2,  y: 22 }, { x: 22, y: 22 },
    ])
    expect(totalWidth).toBe(3 * (18 + 2) + 2)
    expect(totalHeight).toBe(2 * (18 + 2) + 2)
  })

  it('sizes each row/column dynamically from mixed-size children (cellSize unset)', () => {
    const sizes = [
      { width: 20, height: 8 },   // row 0, col 0
      { width: 10, height: 30 },  // row 0, col 1 — tallest in row 0
      { width: 40, height: 6 },   // row 1, col 0 — widest in col 0
    ]
    const { offsets, totalWidth, totalHeight } = computeGridLayout(sizes, {
      mode: 'grid', columns: 2, cellSize: null, padding: 2,
    })

    // col widths: [40, 10]; row heights: [30, 6]
    expect(offsets[0]).toEqual({ x: 2,  y: 2 })
    expect(offsets[1]).toEqual({ x: 44, y: 2 })   // 2 + 40 + 2
    expect(offsets[2]).toEqual({ x: 2,  y: 34 })  // 2 + 30 + 2
    expect(totalWidth).toBe(2 + 40 + 2 + 10 + 2)
    expect(totalHeight).toBe(2 + 30 + 2 + 6 + 2)
  })

  it('derives row count from an explicit columns value when rows is unset', () => {
    const sizes = Array.from({ length: 7 }, () => ({ width: 4, height: 4 }))
    const { offsets } = computeGridLayout(sizes, { mode: 'grid', columns: 3, cellSize: 4, padding: 0 })
    // 7 children / 3 columns → row indices 0,0,0,1,1,1,2
    expect(offsets.map(o => o.y)).toEqual([0, 0, 0, 4, 4, 4, 8])
  })

  it('honours an explicit rows override for the container extent', () => {
    const sizes = Array.from({ length: 2 }, () => ({ width: 4, height: 4 }))
    const { totalHeight } = computeGridLayout(sizes, { mode: 'grid', columns: 2, rows: 3, cellSize: 4, padding: 0 })
    expect(totalHeight).toBe(3 * 4)   // 3 explicit rows, not ceil(2/2)=1
  })
})

describe('computeGridLayout — row/column mode', () => {
  it('lays children out left-to-right in row mode, sized to each child', () => {
    const sizes = [{ width: 10, height: 5 }, { width: 20, height: 8 }, { width: 5, height: 5 }]
    const { offsets, totalWidth, totalHeight } = computeGridLayout(sizes, {
      mode: 'row', columns: 4 /* ignored */, cellSize: null, padding: 2,
    })
    expect(offsets).toEqual([{ x: 2, y: 2 }, { x: 14, y: 2 }, { x: 36, y: 2 }])
    expect(totalWidth).toBe(2 + 10 + 2 + 20 + 2 + 5 + 2)
    expect(totalHeight).toBe(2 + 8 + 2)   // single row, height = tallest child
  })

  it('lays children out top-to-bottom in column mode, sized to each child', () => {
    const sizes = [{ width: 10, height: 5 }, { width: 20, height: 8 }]
    const { offsets, totalWidth, totalHeight } = computeGridLayout(sizes, {
      mode: 'column', columns: 4, cellSize: null, padding: 2,
    })
    expect(offsets).toEqual([{ x: 2, y: 2 }, { x: 2, y: 9 }])
    expect(totalWidth).toBe(2 + 20 + 2)   // single column, width = widest child
    expect(totalHeight).toBe(2 + 5 + 2 + 8 + 2)
  })

  it('handles an empty child list without throwing', () => {
    const { offsets, totalWidth, totalHeight } = computeGridLayout([], {
      mode: 'grid', columns: 4, cellSize: null, padding: 2,
    })
    expect(offsets).toEqual([])
    expect(totalWidth).toBeGreaterThan(0)
    expect(totalHeight).toBeGreaterThan(0)
  })
})
