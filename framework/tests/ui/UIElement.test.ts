import { UIPanel, UIText, Anchor } from '@engine/ui'
import { Vector2 } from '@engine/math'
import { MockRenderer } from '../mocks/MockRenderer'

describe('UIElement parent/child nesting', () => {
  it('anchors a child relative to its parent bounds, not the whole canvas', () => {
    const panel = new UIPanel()
    panel.anchor = Anchor.TopLeft
    panel.offset = new Vector2(10, 10)
    panel.width  = 100
    panel.height = 50

    const label = panel.addChild(new UIText())
    label.anchor = Anchor.BottomRight

    // Panel's own bounds: (10, 10, 100, 50) -> bottom-right = (110, 60)
    const pos = label.getPosition()
    expect(pos.x).toBe(110)
    expect(pos.y).toBe(60)
  })

  it('moving the parent moves the whole subtree with it', () => {
    const panel = new UIPanel()
    panel.width = 40; panel.height = 20
    const child = panel.addChild(new UIText())
    child.anchor = Anchor.TopLeft

    const before = child.getPosition()
    panel.offset = new Vector2(50, 50)
    const after = child.getPosition()

    expect(after.x - before.x).toBe(50)
    expect(after.y - before.y).toBe(50)
  })

  it('supports nested containers (grandchild resolves through both ancestors)', () => {
    const outer = new UIPanel()
    outer.offset = new Vector2(20, 20)
    outer.width  = 100
    outer.height = 100

    const inner = outer.addChild(new UIPanel())
    inner.anchor = Anchor.TopLeft
    inner.width  = 40
    inner.height = 40

    const grandchild = inner.addChild(new UIText())
    grandchild.anchor = Anchor.BottomRight

    // outer bounds: (20,20,100,100) -> inner top-left = (20,20) -> inner bounds (20,20,40,40)
    // -> grandchild bottom-right = (60, 60)
    const pos = grandchild.getPosition()
    expect(pos.x).toBe(60)
    expect(pos.y).toBe(60)
  })

  it('addChild reparents an element already attached elsewhere', () => {
    const a = new UIPanel()
    const b = new UIPanel()
    const child = new UIText()

    a.addChild(child)
    expect(a.children).toContain(child)

    b.addChild(child)
    expect(a.children).not.toContain(child)
    expect(b.children).toContain(child)
    expect(child.parent).toBe(b)
  })

  it('removeChild detaches the element and clears its parent', () => {
    const panel = new UIPanel()
    const child = panel.addChild(new UIText())

    panel.removeChild(child)
    expect(panel.children).not.toContain(child)
    expect(child.parent).toBeNull()
  })

  it('throws when an element is added as its own child', () => {
    const panel = new UIPanel()
    expect(() => panel.addChild(panel)).toThrow()
  })

  it('a root element (no parent) still anchors against the whole logical canvas', () => {
    const label = new UIText()
    label.anchor = Anchor.TopLeft
    expect(label.getPosition()).toEqual(new Vector2(0, 0))
  })
})

describe('UICanvas recursion through child subtrees', () => {
  it('renders a panel and its children', () => {
    const r = new MockRenderer()
    const panel = new UIPanel()
    panel.width = 40; panel.height = 20
    const label = panel.addChild(new UIText())
    label.text = 'hi'

    panel.render(r, 0)
    label.render(r, 0)
    expect(r.countCalls('rect')).toBeGreaterThan(0)
    expect(r.countCalls('text')).toBeGreaterThan(0)
  })

  it('a hidden child is skipped when the tree is walked manually via visible flag', () => {
    const panel = new UIPanel()
    const child = panel.addChild(new UIText())
    child.visible = false
    expect(child.visible).toBe(false)
    expect(panel.children).toContain(child)
  })
})
