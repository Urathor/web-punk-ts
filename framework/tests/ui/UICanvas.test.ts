import { UICanvas, UIPanel, UIText, UITheme, solid } from '@engine/ui'
import { MockRenderer } from '../mocks/MockRenderer'

describe('UICanvas recurses into child subtrees', () => {
  it('update() calls update on nested children automatically', () => {
    const canvas = new UICanvas('hud')
    const panel  = canvas.addElement(new UIPanel())
    const child  = panel.addChild(new UIText())

    let ticks = 0
    child.update = () => { ticks++ }

    canvas.update(0.016)
    expect(ticks).toBe(1)
  })

  it('skips an invisible child during update()', () => {
    const canvas = new UICanvas('hud')
    const panel  = canvas.addElement(new UIPanel())
    const child  = panel.addChild(new UIText())
    child.visible = false

    let ticks = 0
    child.update = () => { ticks++ }

    canvas.update(0.016)
    expect(ticks).toBe(0)
  })

  it('render() draws a panel and its nested child', () => {
    const canvas = new UICanvas('hud')
    const r      = new MockRenderer()
    const panel  = canvas.addElement(new UIPanel())
    panel.width = 40; panel.height = 20
    const child = panel.addChild(new UIText())
    child.text  = 'hi'

    canvas.render(r, 0)
    expect(r.countCalls('rect')).toBeGreaterThan(0)
    expect(r.countCalls('text')).toBeGreaterThan(0)
  })

  it('applies a theme to children added before the panel joins the canvas', () => {
    const canvas = new UICanvas('hud')
    const theme  = new UITheme()
    theme.skins.default.panel = solid({ fill: '#abcdef' })

    const panel = new UIPanel()
    const nested = panel.addChild(new UIPanel())

    canvas.setTheme(theme)
    canvas.addElement(panel)

    expect(panel.background).toBe(theme.skins.default.panel)
    expect(nested.background).toBe(theme.skins.default.panel)
  })

  it('applies the theme to a child added AFTER its parent already joined a themed canvas', () => {
    // Regression test: the common pattern is `canvas.addElement(panel)` first, then
    // `panel.addChild(...)` afterward — the child must still pick up the theme.
    const canvas = new UICanvas('hud')
    const theme  = new UITheme()
    theme.skins.default.panel = solid({ fill: '#abcdef' })
    canvas.setTheme(theme)

    const panel = canvas.addElement(new UIPanel())
    const child = panel.addChild(new UIPanel())
    const grandchild = child.addChild(new UIPanel())

    expect(child.background).toBe(theme.skins.default.panel)
    expect(grandchild.background).toBe(theme.skins.default.panel)
  })
})
