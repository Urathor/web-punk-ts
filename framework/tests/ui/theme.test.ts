import { UITheme, UIPanel, UICanvas, UIManager, UIText, UIButton, UIGrid, solid } from '@engine/ui'
import type { InputManager } from '@engine/input'
import { DEFAULT_FONT_FAMILY } from '@engine/constants'
import { MockRenderer } from '../mocks/MockRenderer'

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

describe('theme text styling', () => {
  it('propagates text colour and font family to a UIText', () => {
    const t = makeTheme()
    t.colors.text = '#ff0000'
    t.fontFamily  = 'Press Start 2P'
    const txt = new UIText()
    t.applyTo(txt)
    expect(txt.color).toBe('#ff0000')
    expect(txt.font).toBe('Press Start 2P')
  })

  it('propagates text colour and font family to a UIButton', () => {
    const t = makeTheme()
    t.colors.text = '#00ff00'
    t.fontFamily  = 'serif'
    const btn = new UIButton({} as unknown as InputManager)
    t.applyTo(btn)
    expect(btn.textColor).toBe('#00ff00')
    expect(btn.font).toBe('serif')
  })

  it('propagates text colour and font family to a UIGrid', () => {
    const t = makeTheme()
    t.colors.text = '#0000ff'
    t.fontFamily  = 'Tahoma'
    const grid = new UIGrid()
    t.applyTo(grid)
    expect(grid.textColor).toBe('#0000ff')
    expect(grid.font).toBe('Tahoma')
  })

  it('createDefault carries the text colour and font family through to widgets', () => {
    const t   = UITheme.createDefault({ text: '#abcdef', fontFamily: 'Courier New' })
    const txt = new UIText()
    t.applyTo(txt)
    expect(txt.color).toBe('#abcdef')
    expect(txt.font).toBe('Courier New')
  })
})

describe('widget font rendering', () => {
  it('UIText passes its font family to drawText', () => {
    const r   = new MockRenderer()
    const txt = new UIText()
    txt.text = 'hi'
    txt.font = 'Verdana'
    txt.render(r, 0)
    const call = r.drawCalls.find(c => c.type === 'text')
    expect((call?.args[2] as { font?: string }).font).toBe('Verdana')
  })

  it('UIButton passes its font family and textColor to drawText', () => {
    const r   = new MockRenderer()
    const btn = new UIButton({} as unknown as InputManager)
    btn.width = 40; btn.height = 12; btn.label = 'OK'
    btn.font = 'Arial'
    btn.textColor = '#123456'
    btn.render(r, 0)
    const call  = r.drawCalls.find(c => c.type === 'text')
    const style = call?.args[2] as { font?: string; color?: string }
    expect(style.font).toBe('Arial')
    expect(style.color).toBe('#123456')
  })

  it('UIButton falls back to per-state text colour when textColor is null', () => {
    const r   = new MockRenderer()
    const btn = new UIButton({} as unknown as InputManager)
    btn.width = 40; btn.height = 12; btn.label = 'OK'
    btn.normal.text = '#0a0b0c'
    btn.render(r, 0)
    const call = r.drawCalls.find(c => c.type === 'text')
    expect((call?.args[2] as { color?: string }).color).toBe('#0a0b0c')
  })
})

describe('default font family', () => {
  it('widgets default their font to DEFAULT_FONT_FAMILY', () => {
    expect(new UIText().font).toBe(DEFAULT_FONT_FAMILY)
    expect(new UIGrid().font).toBe(DEFAULT_FONT_FAMILY)
  })

  it('createDefault uses DEFAULT_FONT_FAMILY when no override is given', () => {
    expect(UITheme.createDefault().fontFamily).toBe(DEFAULT_FONT_FAMILY)
  })
})
