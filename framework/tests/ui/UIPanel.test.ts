import { UIPanel, SolidColorBackground, NineSliceBackground, solid } from '@engine/ui'
import type { Sprite } from '@engine/animation'
import { MockRenderer } from '../mocks/MockRenderer'

const bounds = { x: 0, y: 0, width: 40, height: 20 }

function fakeSprite(): Sprite {
  return {
    texture: { path: 'a', image: {} as unknown as HTMLImageElement },
    srcRect: { x: 0, y: 0, width: 24, height: 24 },
  } as unknown as Sprite
}

describe('UIPanel — showFill/showBorder (no background: plain colour fallback)', () => {
  it('draws both fill and border rects by default', () => {
    const r = new MockRenderer()
    const p = new UIPanel()
    p.width = 40; p.height = 20
    p.render(r, 0)
    expect(r.countCalls('rect')).toBe(2)
  })

  it('showFill = false skips the fill rect', () => {
    const r = new MockRenderer()
    const p = new UIPanel()
    p.width = 40; p.height = 20
    p.showFill = false
    p.render(r, 0)
    const fillCall = r.drawCalls.find(c => c.type === 'rect' && c.args[2] === true)
    expect(fillCall).toBeUndefined()
  })

  it('showBorder = false skips the border rect', () => {
    const r = new MockRenderer()
    const p = new UIPanel()
    p.width = 40; p.height = 20
    p.showBorder = false
    p.render(r, 0)
    const borderCall = r.drawCalls.find(c => c.type === 'rect' && c.args[2] === false)
    expect(borderCall).toBeUndefined()
  })
})

describe('UIPanel — showFill/showBorder now take effect with a SolidColorBackground assigned (regression fix)', () => {
  it('showFill = false hides the fill even though a background is set', () => {
    const r = new MockRenderer()
    const p = new UIPanel()
    p.width = 40; p.height = 20
    p.background = solid({ fill: '#223344', border: '#556677' })
    p.showFill = false
    p.render(r, 0)
    const fillCall = r.drawCalls.find(c => c.type === 'rect' && c.args[2] === true)
    expect(fillCall).toBeUndefined()
  })

  it('showBorder = false hides the border even though a background is set', () => {
    const r = new MockRenderer()
    const p = new UIPanel()
    p.width = 40; p.height = 20
    p.background = solid({ fill: '#223344', border: '#556677' })
    p.showBorder = false
    p.render(r, 0)
    const borderCall = r.drawCalls.find(c => c.type === 'rect' && c.args[2] === false)
    expect(borderCall).toBeUndefined()
  })

  it('writes its own flags onto the assigned SolidColorBackground each render (single source of truth)', () => {
    const r  = new MockRenderer()
    const p  = new UIPanel()
    const bg = new SolidColorBackground({ fill: '#223344' })
    p.width = 40; p.height = 20
    p.background = bg
    p.showFill   = false
    p.showBorder = true
    p.render(r, 0)
    expect(bg.showFill).toBe(false)
    expect(bg.showBorder).toBe(true)

    // Flipping the panel's flags and re-rendering updates the same background object.
    p.showFill = true
    p.render(r, 0)
    expect(bg.showFill).toBe(true)
  })

  it('a NineSliceBackground silently ignores showFill/showBorder (no separate fill/border layer to toggle)', () => {
    const r  = new MockRenderer()
    const p  = new UIPanel()
    p.width = 40; p.height = 20
    p.background = new NineSliceBackground(fakeSprite(), { left: 8, top: 8, right: 8, bottom: 8 })
    p.showFill   = false
    p.showBorder = false
    p.render(r, 0)
    // The sprite still draws its full nine-patch regardless of the flags.
    expect(r.countCalls('image')).toBe(9)
  })
})
