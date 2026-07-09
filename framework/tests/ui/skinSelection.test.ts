import { UITheme, ThemeSkin, UIPanel, UIButton, UIProgressBar, UICanvas, UIManager, solid } from '@engine/ui'
import { MockInputManager } from '../mocks/MockInputManager'

function makeMultiSkinTheme(): UITheme {
  const t = new UITheme()
  t.skins.default.panel = solid({ fill: '#111111' })
  t.addSkin('wood', new ThemeSkin({
    panel:         solid({ fill: '#654321' }),
    buttonHover:   solid({ fill: '#765432' }),
    buttonDown:    solid({ fill: '#543210' }),
    progressTrack: solid({ fill: '#332211' }),
    progressFill:  solid({ fill: '#aa8866' }),
  }))
  return t
}

describe('UITheme.getSkin', () => {
  it('resolves a registered skin by name', () => {
    const t    = makeMultiSkinTheme()
    const wood = new ThemeSkin()
    t.addSkin('wood', wood)
    expect(t.getSkin('wood')).toBe(wood)
  })

  it('falls back to the default skin for an unregistered name', () => {
    const t = makeMultiSkinTheme()
    expect(t.getSkin('does-not-exist')).toBe(t.skins.default)
  })
})

describe('skinName — per-widget skin selection', () => {
  it('a UIPanel with no skinName set uses the default skin', () => {
    const t = makeMultiSkinTheme()
    const p = new UIPanel()
    t.applyTo(p)
    expect(p.background).toBe(t.skins.default.panel)
  })

  it('a UIPanel with skinName = "wood" uses the wood skin instead', () => {
    const t = makeMultiSkinTheme()
    const p = new UIPanel()
    p.skinName = 'wood'
    t.applyTo(p)
    expect(p.background).toBe(t.getSkin('wood').panel)
  })

  it('two panels on the same theme can each pick a different skin independently', () => {
    const mgr    = new UIManager()
    const canvas = mgr.add(new UICanvas('hud'))
    const t      = makeMultiSkinTheme()
    mgr.setTheme(t)

    // skinName must be set before the element is themed (addElement applies the theme
    // immediately, resolving `background` once) — same ordering constraint as
    // `themed = false`/an explicit `background` today.
    const woodPanel = new UIPanel()
    woodPanel.skinName = 'wood'

    const defaultPanel = canvas.addElement(new UIPanel())
    canvas.addElement(woodPanel)

    expect(defaultPanel.background).toBe(t.skins.default.panel)
    expect(woodPanel.background).toBe(t.getSkin('wood').panel)
  })

  it('UIButton resolves its skin via skinName, independent of other widgets', () => {
    const mgr    = new UIManager()
    const canvas = mgr.add(new UICanvas('hud'))
    const t      = makeMultiSkinTheme()
    mgr.setTheme(t)

    const btn = canvas.addElement(new UIButton(new MockInputManager()))
    btn.skinName = 'wood'
    btn.width = 40; btn.height = 12
    canvas.update(0)

    expect(btn.bgPanel.background).toBe(t.getSkin('wood').button)
  })

  it('UIProgressBar resolves its skin via skinName, independent of other widgets', () => {
    const mgr    = new UIManager()
    const canvas = mgr.add(new UICanvas('hud'))
    const t      = makeMultiSkinTheme()
    mgr.setTheme(t)

    const bar = canvas.addElement(new UIProgressBar())
    bar.skinName = 'wood'
    bar.width = 40; bar.height = 8; bar.value = 0.5
    canvas.update(0)

    expect(bar.trackPanel.background).toBe(t.getSkin('wood').progressTrack)
    expect(bar.fillPanel.background).toBe(t.getSkin('wood').progressFill)
  })
})
