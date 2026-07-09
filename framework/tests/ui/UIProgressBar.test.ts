import { UIProgressBar, UITheme, UICanvas, UIManager, solid } from '@engine/ui'
import { MockRenderer } from '../mocks/MockRenderer'

function makeTheme(): UITheme {
  const t = new UITheme()
  t.skins.default.progressTrack = solid({ fill: '#111111' })
  t.skins.default.progressFill  = solid({ fill: '#22cc22' })
  return t
}

describe('UIProgressBar — composition', () => {
  it('exposes trackPanel/fillPanel as real children', () => {
    const bar = new UIProgressBar()
    expect(bar.children).toContain(bar.trackPanel)
    expect(bar.children).toContain(bar.fillPanel)
  })

  it('a themed canvas backgrounds trackPanel/fillPanel via progressTrack/progressFill', () => {
    const mgr    = new UIManager()
    const canvas = mgr.add(new UICanvas('hud'))
    const t      = makeTheme()
    mgr.setTheme(t)

    const bar = canvas.addElement(new UIProgressBar())
    bar.width = 40; bar.height = 8; bar.value = 0.5
    canvas.update(0)

    expect(bar.trackPanel.background).toBe(t.skins.default.progressTrack)
    expect(bar.fillPanel.background).toBe(t.skins.default.progressFill)
  })

  it('an explicit trackBackground/fillBackground overrides the theme', () => {
    const t         = makeTheme()
    const explicit1 = solid({ fill: '#ff00ff' })
    const explicit2 = solid({ fill: '#00ffff' })
    const bar       = new UIProgressBar()
    bar.trackBackground = explicit1
    bar.fillBackground  = explicit2
    bar.value = 0.5
    t.applyTo(bar)
    bar.update(0)

    expect(bar.trackPanel.background).toBe(explicit1)
    expect(bar.fillPanel.background).toBe(explicit2)
  })
})

describe('UIProgressBar — fill geometry', () => {
  it('fills the correct proportion horizontally', () => {
    const bar = new UIProgressBar()
    bar.width = 100; bar.height = 10
    bar.value = 0.3
    bar.fillMode = 'stretch'
    bar.update(0)

    expect(bar.fillPanel.visible).toBe(true)
    expect(bar.fillPanel.width).toBe(30)
    expect(bar.fillPanel.offset.x).toBe(0)
  })

  it('reversed fills from the far edge horizontally', () => {
    const bar = new UIProgressBar()
    bar.width = 100; bar.height = 10
    bar.value = 0.3
    bar.reversed  = true
    bar.fillMode  = 'stretch'
    bar.update(0)

    expect(bar.fillPanel.width).toBe(30)
    expect(bar.fillPanel.offset.x).toBe(70)
  })

  it('fills the correct proportion vertically', () => {
    const bar = new UIProgressBar()
    bar.width = 10; bar.height = 100
    bar.value = 0.4
    bar.orientation = 'vertical'
    bar.fillMode    = 'stretch'
    bar.update(0)

    expect(bar.fillPanel.height).toBe(40)
    expect(bar.fillPanel.offset.y).toBe(60)   // grows from the bottom by default
  })

  it('hides the fill panel entirely when value is 0', () => {
    const bar = new UIProgressBar()
    bar.width = 100; bar.height = 10
    bar.value = 0
    bar.update(0)

    expect(bar.fillPanel.visible).toBe(false)
  })
})

describe('UIProgressBar — fillMode: crop', () => {
  it('clips fillPanel\'s render to the current reveal rect', () => {
    const r      = new MockRenderer()
    const mgr    = new UIManager()
    const canvas = mgr.add(new UICanvas('hud'))
    const bar    = canvas.addElement(new UIProgressBar())
    bar.width = 100; bar.height = 10
    bar.value = 0.4
    bar.fillMode = 'crop'
    bar.fillBackground = solid({ fill: '#22cc22' })
    canvas.update(0)

    const pushClip = vi.spyOn(r, 'pushClip')
    const popClip  = vi.spyOn(r, 'popClip')
    canvas.render(r, 0)

    expect(pushClip).toHaveBeenCalledWith({ x: 0, y: 0, width: 40, height: 10 })
    expect(popClip).toHaveBeenCalledTimes(1)
    // fillPanel stays visible and renders itself (clipped) via the generic
    // child-render walk — right after trackPanel, before the border overlay — so it
    // isn't painted over by trackPanel's opaque background.
    expect(bar.fillPanel.visible).toBe(true)
    // The fill background itself is drawn at the bar's full bounds (undistorted),
    // with the clip revealing only the current proportion.
    const rectCall = r.drawCalls.find(c => c.type === 'rect')
    expect(rectCall?.args[0]).toEqual({ x: 0, y: 0, width: 100, height: 10 })
  })

  it('does not clip (or emit a second draw) once value reaches 0', () => {
    const r      = new MockRenderer()
    const mgr    = new UIManager()
    const canvas = mgr.add(new UICanvas('hud'))
    const bar    = canvas.addElement(new UIProgressBar())
    bar.width = 100; bar.height = 10
    bar.value = 0
    bar.fillMode = 'crop'
    bar.fillBackground = solid({ fill: '#22cc22' })
    canvas.update(0)

    const pushClip = vi.spyOn(r, 'pushClip')
    canvas.render(r, 0)
    expect(pushClip).not.toHaveBeenCalled()
  })
})

describe('UIProgressBar — border overlay', () => {
  it('renders on top even when the bar is completely full', () => {
    const mgr    = new UIManager()
    const canvas = mgr.add(new UICanvas('hud'))
    const bar    = canvas.addElement(new UIProgressBar())
    bar.width = 40; bar.height = 8; bar.value = 1
    bar.showBorder = true
    bar.fillMode = 'stretch'
    canvas.update(0)

    const r = new MockRenderer()
    canvas.render(r, 0)

    const rectCalls = r.drawCalls.filter(c => c.type === 'rect')
    const borderCallIndex = rectCalls.findIndex(c => c.args[1] === bar.borderColor && c.args[2] === false)
    const fillCallIndex   = rectCalls.findIndex(c => c.args[1] === bar.fillColor)
    expect(borderCallIndex).toBeGreaterThan(-1)
    expect(fillCallIndex).toBeGreaterThan(-1)
    expect(borderCallIndex).toBeGreaterThan(fillCallIndex)
  })

  it('showBorder = false hides the border overlay', () => {
    const mgr    = new UIManager()
    const canvas = mgr.add(new UICanvas('hud'))
    const bar    = canvas.addElement(new UIProgressBar())
    bar.width = 40; bar.height = 8; bar.value = 0.5
    bar.showBorder = false
    canvas.update(0)

    const r = new MockRenderer()
    canvas.render(r, 0)

    const borderCall = r.drawCalls.find(c => c.type === 'rect' && c.args[1] === bar.borderColor && c.args[2] === false)
    expect(borderCall).toBeUndefined()
  })
})

describe('UIProgressBar — optional label', () => {
  it('showLabel creates a centered UIText child that renders the given text', () => {
    const r   = new MockRenderer()
    const bar = new UIProgressBar()
    bar.width = 80; bar.height = 12
    bar.showLabel('50%')
    bar.update(0)
    bar.label!.render(r, 0)

    const call  = r.drawCalls.find(c => c.type === 'text')
    const [text, , style] = call!.args as [string, unknown, { align?: string }]
    expect(text).toBe('50%')
    expect(style.align).toBe('center')
    expect(bar.children).toContain(bar.label)
  })
})
