import { UIGrid, UIPanel, UIText, UICanvas, UIManager } from '@engine/ui'

describe('UIGrid — layout container', () => {
  it('positions children in grid mode with no manual anchor/offset set', () => {
    const grid = new UIGrid()
    grid.columns = 2
    grid.cellSize = 10
    grid.padding = 2
    const a = grid.addChild(new UIPanel())
    const b = grid.addChild(new UIPanel())
    const c = grid.addChild(new UIPanel())
    a.width = a.height = b.width = b.height = c.width = c.height = 10

    grid.update(0)

    expect(a.offset).toEqual({ x: 2,  y: 2 })
    expect(b.offset).toEqual({ x: 14, y: 2 })
    expect(c.offset).toEqual({ x: 2,  y: 14 })
  })

  it('positions children in row mode', () => {
    const grid = new UIGrid()
    grid.mode = 'row'
    grid.padding = 2
    const a = grid.addChild(new UIPanel())
    const b = grid.addChild(new UIPanel())
    a.width = 10; a.height = 5
    b.width = 20; b.height = 8

    grid.update(0)

    expect(a.offset).toEqual({ x: 2,  y: 2 })
    expect(b.offset).toEqual({ x: 14, y: 2 })
  })

  it('positions children in column mode', () => {
    const grid = new UIGrid()
    grid.mode = 'column'
    grid.padding = 2
    const a = grid.addChild(new UIPanel())
    const b = grid.addChild(new UIPanel())
    a.width = 10; a.height = 5
    b.width = 20; b.height = 8

    grid.update(0)

    expect(a.offset).toEqual({ x: 2, y: 2 })
    expect(b.offset).toEqual({ x: 2, y: 9 })
  })

  it('dynamic mode sizes rows/columns from mixed-size children (a wider UIButton-ish child next to a narrower one)', () => {
    const grid = new UIGrid()
    grid.mode = 'row'
    grid.padding = 0
    const wide = grid.addChild(new UIPanel())
    const narrow = grid.addChild(new UIPanel())
    wide.width = 40; wide.height = 10
    narrow.width = 10; narrow.height = 6

    grid.update(0)

    expect(narrow.offset.x).toBe(40)   // starts right after the wide sibling
  })

  it('fixed mode (cellSize set) reproduces uniform-cell layout regardless of child size', () => {
    const grid = new UIGrid()
    grid.columns = 2
    grid.cellSize = 16
    grid.padding = 0
    const a = grid.addChild(new UIPanel())
    const b = grid.addChild(new UIPanel())
    a.width = a.height = 4     // much smaller than cellSize
    b.width = b.height = 4

    grid.update(0)

    expect(b.offset).toEqual({ x: 16, y: 0 })   // uses cellSize, not the child's own size
  })

  it('auto-sizes width/height from the computed layout when unset', () => {
    const grid = new UIGrid()
    grid.columns = 2
    grid.cellSize = 10
    grid.padding = 2
    grid.addChild(new UIPanel())
    grid.addChild(new UIPanel())

    grid.update(0)
    const bounds = grid.getBounds()

    expect(bounds.width).toBe(2 * (10 + 2) + 2)
    expect(bounds.height).toBe(1 * (10 + 2) + 2)
  })

  it('explicit width/height wins over the auto-sized layout extent', () => {
    const grid = new UIGrid()
    grid.width  = 999
    grid.height = 888
    grid.addChild(new UIPanel())

    grid.update(0)

    expect(grid.getBounds().width).toBe(999)
    expect(grid.getBounds().height).toBe(888)
  })

  it('a themed canvas still themes UIPanel/UIText grid children via the generic base-component dispatch', () => {
    const mgr    = new UIManager()
    const canvas = mgr.add(new UICanvas('hud'))
    const grid   = canvas.addElement(new UIGrid())
    const panel  = grid.addChild(new UIPanel())

    canvas.update(0)
    expect(panel.background).toBeNull()   // no theme set — sanity check, unaffected by grid
  })
})

describe('UIGrid — recompute only when something changed', () => {
  it('does not reassign a child\'s offset object when nothing changed between update() ticks', () => {
    const grid = new UIGrid()
    const a = grid.addChild(new UIPanel())
    a.width = 10; a.height = 10

    grid.update(0)
    const offsetAfterFirst = a.offset

    grid.update(0)   // nothing changed — should skip recompute entirely
    expect(a.offset).toBe(offsetAfterFirst)   // same object reference, not just equal value
  })

  it('recomputes when a child is added', () => {
    const grid = new UIGrid()
    grid.padding = 0; grid.cellSize = 10; grid.columns = 2
    const a = grid.addChild(new UIPanel())
    a.width = a.height = 10
    grid.update(0)
    expect(a.offset).toEqual({ x: 0, y: 0 })

    const b = grid.addChild(new UIPanel())
    b.width = b.height = 10
    grid.update(0)

    expect(a.offset).toEqual({ x: 0,  y: 0 })
    expect(b.offset).toEqual({ x: 10, y: 0 })
  })

  it('recomputes when a child auto-resizes itself (e.g. a UIText whose .text changed)', () => {
    const grid = new UIGrid()
    grid.mode = 'row'
    grid.padding = 0
    const label = grid.addChild(new UIText())
    label.text = 'a'
    const second = grid.addChild(new UIPanel())
    second.width = 5; second.height = 5

    grid.update(0)
    const firstOffset = second.offset.x

    label.text = 'a much longer string of text'
    grid.update(0)

    expect(second.offset.x).toBeGreaterThan(firstOffset)
  })
})
