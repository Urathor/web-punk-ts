import { UIPanel, UIButton, UIProgressBar, UICanvas, UIManager } from '@engine/ui'
import { MockRenderer } from '../mocks/MockRenderer'
import { MockInputManager } from '../mocks/MockInputManager'

// With no theme and no background assigned, every widget must render exactly as before:
// solid-colour rectangles (and text), never sprite `image` calls.
describe('back-compat: the colour path is unchanged without a theme', () => {
  it('UIPanel emits rect calls and no image calls', () => {
    const r = new MockRenderer()
    const p = new UIPanel()
    p.width = 40; p.height = 20
    p.render(r, 0)
    expect(r.countCalls('rect')).toBeGreaterThan(0)
    expect(r.countCalls('image')).toBe(0)
  })

  it('UIButton emits rect calls and no image calls', () => {
    // UIButton is now composed of a UIPanel (bgPanel) and a UIText (label) child —
    // exercised via UICanvas, same pattern as UIProgressBar above.
    const r      = new MockRenderer()
    const mgr    = new UIManager()
    const canvas = mgr.add(new UICanvas('t'))
    const b      = canvas.addElement(new UIButton(new MockInputManager()))
    b.width = 40; b.height = 12; b.label.text = 'OK'
    canvas.update(0)
    canvas.render(r, 0)
    expect(r.countCalls('rect')).toBeGreaterThan(0)
    expect(r.countCalls('image')).toBe(0)
  })

  it('UIProgressBar emits rect calls and no image calls', () => {
    // UIProgressBar is now composed of UIPanel children (trackPanel/fillPanel/an
    // internal border overlay) — exercised the same way UICanvas does: update() to
    // sync their geometry, then render the whole subtree (bar + its children).
    const r    = new MockRenderer()
    const mgr    = new UIManager()
    const canvas = mgr.add(new UICanvas('t'))
    const bar    = canvas.addElement(new UIProgressBar())
    bar.width = 40; bar.height = 6; bar.value = 0.5
    canvas.update(0)
    canvas.render(r, 0)
    expect(r.countCalls('rect')).toBeGreaterThan(0)
    expect(r.countCalls('image')).toBe(0)
  })
})

