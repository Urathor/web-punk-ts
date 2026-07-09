import { UITheme, ThemeSkin, UIPanel, UICanvas, UIManager, UIText, UIButton, UIElement, solid } from '@engine/ui'
import type { IRenderer } from '@engine/renderer'
import { DEFAULT_FONT_FAMILY } from '@engine/constants'
import { MockRenderer } from '../mocks/MockRenderer'
import { MockInputManager } from '../mocks/MockInputManager'

function makeTheme(): UITheme {
  const t = new UITheme()
  t.skins.default.panel = solid({ fill: '#abcdef' })
  return t
}

describe('UITheme.applyTo', () => {
  it('assigns a background to a themed panel', () => {
    const t = makeTheme()
    const p = new UIPanel()
    t.applyTo(p)
    expect(p.background).toBe(t.skins.default.panel)
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

    expect(before.background).toBe(t.skins.default.panel)
    expect(after.background).toBe(t.skins.default.panel)
  })

  it('per-canvas theme overrides the manager and survives later propagation', () => {
    const mgr         = new UIManager()
    const canvas      = mgr.add(new UICanvas('hud'))
    const canvasTheme = makeTheme()
    canvas.setTheme(canvasTheme)

    mgr.setTheme(makeTheme())            // must NOT clobber the explicit canvas theme
    const p = canvas.addElement(new UIPanel())

    expect(canvas.theme).toBe(canvasTheme)
    expect(p.background).toBe(canvasTheme.skins.default.panel)
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

  it('propagates text colour and font family to a UIButton (via update + render, no explicit override)', () => {
    const t = makeTheme()
    t.colors.text = '#00ff00'
    t.fontFamily  = 'serif'
    const r      = new MockRenderer()
    const mgr    = new UIManager()
    const canvas = mgr.add(new UICanvas('hud'))
    canvas.setTheme(t)
    const btn = canvas.addElement(new UIButton(new MockInputManager()))
    btn.width = 40; btn.height = 12; btn.label.text = 'OK'
    canvas.update(0)
    canvas.render(r, 0)
    const call  = r.drawCalls.find(c => c.type === 'text')
    const style = call?.args[2] as { font?: string; color?: string }
    expect(style.font).toBe('serif')
    expect(style.color).toBe('#00ff00')
  })

  it('createDefault carries the text colour and font family through to widgets', () => {
    const t   = UITheme.createDefault({ text: '#abcdef', fontFamily: 'Courier New' })
    const txt = new UIText()
    t.applyTo(txt)
    expect(txt.color).toBe('#abcdef')
    expect(txt.font).toBe('Courier New')
  })

  it('skin.textColor takes precedence over theme.colors.text', () => {
    const t = new UITheme()
    t.colors.text = '#ff0000'
    t.skins.default = new ThemeSkin({ textColor: '#00ff00' })
    const txt = new UIText()
    t.applyTo(txt)
    expect(txt.color).toBe('#00ff00')
  })

  it('skin.textColor drives UIButton label color over theme.colors.text', () => {
    const t = new UITheme()
    t.colors.text = '#ff0000'
    t.addSkin('special', new ThemeSkin({ textColor: '#0000ff' }))
    const r      = new MockRenderer()
    const mgr    = new UIManager()
    const canvas = mgr.add(new UICanvas('hud'))
    canvas.setTheme(t)
    const btn = canvas.addElement(new UIButton(new MockInputManager()))
    btn.skinName = 'special'
    btn.width = 40; btn.height = 12; btn.label.text = 'OK'
    canvas.update(0)
    canvas.render(r, 0)
    const call  = r.drawCalls.find(c => c.type === 'text')
    expect((call?.args[2] as { color?: string }).color).toBe('#0000ff')
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
    const r      = new MockRenderer()
    const mgr    = new UIManager()
    const canvas = mgr.add(new UICanvas('hud'))
    const btn = canvas.addElement(new UIButton(new MockInputManager()))
    btn.width = 40; btn.height = 12; btn.label.text = 'OK'
    btn.font = 'Arial'
    btn.textColor = '#123456'
    canvas.update(0)
    canvas.render(r, 0)
    const call  = r.drawCalls.find(c => c.type === 'text')
    const style = call?.args[2] as { font?: string; color?: string }
    expect(style.font).toBe('Arial')
    expect(style.color).toBe('#123456')
  })

  it('UIButton falls back to its default text colour when textColor is null', () => {
    const r      = new MockRenderer()
    const mgr    = new UIManager()
    const canvas = mgr.add(new UICanvas('hud'))
    const btn = canvas.addElement(new UIButton(new MockInputManager()))
    btn.width = 40; btn.height = 12; btn.label.text = 'OK'
    canvas.update(0)
    canvas.render(r, 0)
    const call = r.drawCalls.find(c => c.type === 'text')
    expect((call?.args[2] as { color?: string }).color).toBe('#ffffff')
  })
})

describe('default font family', () => {
  it('widgets default their font to DEFAULT_FONT_FAMILY', () => {
    expect(new UIText().font).toBe(DEFAULT_FONT_FAMILY)
  })

  it('createDefault uses DEFAULT_FONT_FAMILY when no override is given', () => {
    expect(UITheme.createDefault().fontFamily).toBe(DEFAULT_FONT_FAMILY)
  })
})

describe('composite widget theming (Stage 1 acceptance criteria)', () => {
  it('themes a custom UIElement subclass\'s UIPanel/UIText children with zero theme-side code', () => {
    class MyWidget extends UIElement {
      panel = this.addChild(new UIPanel())
      label = this.addChild(new UIText())
      render(renderer: IRenderer, interpolation: number): void {
        this.panel.render(renderer, interpolation)
        this.label.render(renderer, interpolation)
      }
    }

    const mgr    = new UIManager()
    const canvas = mgr.add(new UICanvas('hud'))
    const t      = makeTheme()
    t.colors.text = '#ff00ff'
    t.fontFamily  = 'monospace'
    mgr.setTheme(t)

    const widget = canvas.addElement(new MyWidget())

    expect(widget.panel.background).toBe(t.skins.default.panel)
    expect(widget.label.color).toBe('#ff00ff')
    expect(widget.label.font).toBe('monospace')
  })
})
