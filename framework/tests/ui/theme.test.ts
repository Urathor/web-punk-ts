import { UITheme, UIPanel, UICanvas, UIManager, solid } from '@engine/ui'

function makeTheme(): UITheme {
  const t = new UITheme()
  t.panel = solid({ fill: '#abcdef' })
  return t
}

describe('UITheme.applyTo', () => {
  it('assigns a background to a themed panel', () => {
    const t = makeTheme()
    const p = new UIPanel()
    t.applyTo(p)
    expect(p.background).toBe(t.panel)
  })

  it('skips elements that opted out via themed = false', () => {
    const t = makeTheme()
    const p = new UIPanel()
    p.themed = false
    t.applyTo(p)
    expect(p.background).toBeNull()
  })

  it('never overrides an explicit background', () => {
    const t        = makeTheme()
    const p        = new UIPanel()
    const explicit = solid({ fill: '#111111' })
    p.background = explicit
    t.applyTo(p)
    expect(p.background).toBe(explicit)
  })
})

describe('theme resolution', () => {
  it('themes existing and future children via the manager', () => {
    const mgr    = new UIManager()
    const canvas = mgr.add(new UICanvas('hud'))
    const before = canvas.addElement(new UIPanel())
    const t      = makeTheme()

    mgr.setTheme(t)
    const after = canvas.addElement(new UIPanel())

    expect(before.background).toBe(t.panel)
    expect(after.background).toBe(t.panel)
  })

  it('per-canvas theme overrides the manager and survives later propagation', () => {
    const mgr         = new UIManager()
    const canvas      = mgr.add(new UICanvas('hud'))
    const canvasTheme = makeTheme()
    canvas.setTheme(canvasTheme)

    mgr.setTheme(makeTheme())            // must NOT clobber the explicit canvas theme
    const p = canvas.addElement(new UIPanel())

    expect(canvas.theme).toBe(canvasTheme)
    expect(p.background).toBe(canvasTheme.panel)
  })
})
