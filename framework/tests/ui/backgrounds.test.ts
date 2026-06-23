import type { Sprite } from '@engine/animation'
import { SolidColorBackground, NineSliceBackground, nineSlice, solid } from '@engine/ui'
import { MockRenderer } from '../mocks/MockRenderer'

const bounds = { x: 0, y: 0, width: 100, height: 60 }

function fakeSprite(): Sprite {
  return {
    texture: { path: 'a', image: {} as unknown as HTMLImageElement },
    srcRect: { x: 0, y: 0, width: 24, height: 24 },
  } as unknown as Sprite
}

describe('SolidColorBackground', () => {
  it('emits only rect draw calls', () => {
    const r = new MockRenderer()
    solid({ fill: '#123456' }).draw(r, bounds)
    expect(r.countCalls('rect')).toBeGreaterThan(0)
    expect(r.countCalls('image')).toBe(0)
  })

  it('blends the fill toward black for a colourless (fade) tint', () => {
    const r  = new MockRenderer()
    const bg = new SolidColorBackground({ fill: '#ffffff', showBorder: false })
    bg.draw(r, bounds, { strength: 0.5 })
    const call = r.drawCalls.find(c => c.type === 'rect')!
    expect(call.args[1]).toBe('#808080')
  })
})

describe('NineSliceBackground', () => {
  it('emits 9 image draw calls for a bordered patch', () => {
    const r  = new MockRenderer()
    nineSlice(fakeSprite(), { left: 8, top: 8, right: 8, bottom: 8 }).draw(r, bounds)
    expect(r.countCalls('image')).toBe(9)
    expect(r.countCalls('rect')).toBe(0)
  })

  it('emits a single image draw call for zero insets', () => {
    const r = new MockRenderer()
    nineSlice(fakeSprite(), { left: 0, top: 0, right: 0, bottom: 0 }).draw(r, bounds)
    expect(r.countCalls('image')).toBe(1)
  })

  it('accepts a raw canvas/image source (no Texture required)', () => {
    const r  = new MockRenderer()
    const bg = new NineSliceBackground(
      { image: {} as unknown as HTMLCanvasElement, srcRect: { x: 0, y: 0, width: 24, height: 24 } },
      { left: 8, top: 8, right: 8, bottom: 8 },
    )
    bg.draw(r, bounds)
    expect(r.countCalls('image')).toBe(9)
  })
})
