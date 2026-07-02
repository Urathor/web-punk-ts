import { UIButton, UITheme, UICanvas, UIManager, solid } from '@engine/ui'
import { Vector2 } from '@engine/math'
import { MockRenderer } from '../mocks/MockRenderer'
import { MockInputManager } from '../mocks/MockInputManager'

function makeTheme(): UITheme {
  const t = new UITheme()
  t.panel         = solid({ fill: '#223344' })
  t.buttonHover   = solid({ fill: '#445566' })
  t.buttonPressed = solid({ fill: '#112233' })
  t.colors.text   = '#eeeeee'
  t.fontFamily    = 'Tahoma'
  return t
}

describe('UIButton — composition', () => {
  it('exposes bgPanel/label as real children', () => {
    const input = new MockInputManager()
    const btn   = new UIButton(input)
    expect(btn.children).toContain(btn.bgPanel)
    expect(btn.children).toContain(btn.label)
  })

  it('label.text sets the caption (no more string label field)', () => {
    const btn = new UIButton(new MockInputManager())
    btn.label.text = 'Heal'
    expect(btn.label.text).toBe('Heal')
  })

  it('with no theme, bgPanel gets a reasonable default background', () => {
    const btn = new UIButton(new MockInputManager())
    btn.width = 40; btn.height = 12
    btn.update(0)
    expect(btn.bgPanel.background).not.toBeNull()
  })
})

describe('UIButton — theming', () => {
  it('a themed canvas backgrounds bgPanel via the panel token in the normal state', () => {
    const mgr    = new UIManager()
    const canvas = mgr.add(new UICanvas('hud'))
    const t      = makeTheme()
    mgr.setTheme(t)

    const btn = canvas.addElement(new UIButton(new MockInputManager()))
    btn.width = 40; btn.height = 12
    canvas.update(0)

    expect(btn.bgPanel.background).toBe(t.panel)
  })

  it('swaps to the buttonHover token while hovered', () => {
    const mgr    = new UIManager()
    const canvas = mgr.add(new UICanvas('hud'))
    const t      = makeTheme()
    mgr.setTheme(t)

    const input = new MockInputManager()
    const btn   = canvas.addElement(new UIButton(input))
    btn.width = 40; btn.height = 12

    input.mousePosition = new Vector2(5, 5)   // inside the button's bounds
    canvas.update(0)

    expect(btn.bgPanel.background).toBe(t.buttonHover)
    expect(btn.bgPanel.tint).toBeNull()   // dedicated art for the state — untinted
  })

  it('swaps to the buttonPressed token while pressed', () => {
    const mgr    = new UIManager()
    const canvas = mgr.add(new UICanvas('hud'))
    const t      = makeTheme()
    mgr.setTheme(t)

    const input = new MockInputManager()
    const btn   = canvas.addElement(new UIButton(input))
    btn.width = 40; btn.height = 12

    input.mousePosition = new Vector2(5, 5)
    input.press(0)
    canvas.update(0)

    expect(btn.bgPanel.background).toBe(t.buttonPressed)
  })

  it('an explicit hoverBackground/pressedBackground overrides the theme', () => {
    const t        = makeTheme()
    const explicit = solid({ fill: '#ff00ff' })
    const input    = new MockInputManager()
    const btn      = new UIButton(input)
    btn.hoverBackground = explicit
    btn.width = 40; btn.height = 12
    input.mousePosition = new Vector2(5, 5)
    t.applyTo(btn)
    btn.update(0)

    expect(btn.bgPanel.background).toBe(explicit)
  })

  it('an explicit background overrides the theme panel token in the normal state', () => {
    const t        = makeTheme()
    const explicit = solid({ fill: '#00ff00' })
    const btn      = new UIButton(new MockInputManager())
    btn.background = explicit
    btn.width = 40; btn.height = 12
    t.applyTo(btn)
    btn.update(0)

    expect(btn.bgPanel.background).toBe(explicit)
  })

  it('tints the default/base background on hover when no theme art is set for that state', () => {
    const input = new MockInputManager()
    const btn   = new UIButton(input)
    btn.width = 40; btn.height = 12
    input.mousePosition = new Vector2(5, 5)
    btn.update(0)

    expect(btn.bgPanel.tint).toBe(btn.hoverTint)
  })

  it('propagates theme font family/text colour to label, without an explicit override', () => {
    const mgr    = new UIManager()
    const canvas = mgr.add(new UICanvas('hud'))
    const t      = makeTheme()
    mgr.setTheme(t)

    const btn = canvas.addElement(new UIButton(new MockInputManager()))
    btn.width = 40; btn.height = 12
    canvas.update(0)

    expect(btn.label.font).toBe('Tahoma')
    expect(btn.label.color).toBe('#eeeeee')
  })

  it('an explicit textColor overrides the theme text colour', () => {
    const t   = makeTheme()
    const btn = new UIButton(new MockInputManager())
    btn.textColor = '#123456'
    t.applyTo(btn)
    btn.update(0)

    expect(btn.label.color).toBe('#123456')
  })
})

describe('UIButton — interaction', () => {
  it('fires onClick exactly once per press-then-release-while-hovered cycle', () => {
    const input = new MockInputManager()
    const btn   = new UIButton(input)
    btn.width = 40; btn.height = 12
    let clicks = 0
    btn.onClick = () => { clicks++ }

    input.mousePosition = new Vector2(5, 5)
    btn.update(0); input.endFrame()          // frame 1: hover only

    input.press(0)
    btn.update(0); input.endFrame()          // frame 2: press while hovered

    input.release(0)
    btn.update(0); input.endFrame()          // frame 3: release while hovered — fires

    expect(clicks).toBe(1)

    btn.update(0); input.endFrame()          // frame 4: no new press/release — no refire
    expect(clicks).toBe(1)
  })

  it('does not fire onClick when released outside the button', () => {
    const input = new MockInputManager()
    const btn   = new UIButton(input)
    btn.width = 40; btn.height = 12
    let clicks = 0
    btn.onClick = () => { clicks++ }

    input.mousePosition = new Vector2(5, 5)
    input.press(0)
    btn.update(0); input.endFrame()                // press while hovered

    input.mousePosition = new Vector2(500, 500)    // move outside before release
    input.release(0)
    btn.update(0); input.endFrame()

    expect(clicks).toBe(0)
  })
})

describe('UIButton — rendering', () => {
  it('renders rect and text calls via the generic child-render walk (bgPanel + label)', () => {
    const r      = new MockRenderer()
    const mgr    = new UIManager()
    const canvas = mgr.add(new UICanvas('hud'))
    const btn    = canvas.addElement(new UIButton(new MockInputManager()))
    btn.width = 40; btn.height = 12; btn.label.text = 'OK'
    canvas.update(0)
    canvas.render(r, 0)

    expect(r.countCalls('rect')).toBeGreaterThan(0)
    expect(r.countCalls('text')).toBeGreaterThan(0)
  })
})
