import type { InputManager } from '@engine/input'
import { UIPanel, UIButton, UIProgressBar } from '@engine/ui'
import { MockRenderer } from '../mocks/MockRenderer'

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
    const r = new MockRenderer()
    const b = new UIButton({} as unknown as InputManager)
    b.width = 40; b.height = 12; b.label = 'OK'
    b.render(r, 0)
    expect(r.countCalls('rect')).toBeGreaterThan(0)
    expect(r.countCalls('image')).toBe(0)
  })

  it('UIProgressBar emits rect calls and no image calls', () => {
    const r   = new MockRenderer()
    const bar = new UIProgressBar()
    bar.width = 40; bar.height = 6; bar.value = 0.5
    bar.render(r, 0)
    expect(r.countCalls('rect')).toBeGreaterThan(0)
    expect(r.countCalls('image')).toBe(0)
  })
})
