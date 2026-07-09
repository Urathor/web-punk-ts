import { generateNineSliceSprite, NineSliceBackground, SolidColorBackground } from '@engine/ui'
import { MockRenderer } from '../mocks/MockRenderer'

interface CtxCall { method: string; args: unknown[] }

/** jsdom has no real 2D context. Stub one (mirrors tests/renderer/CanvasRenderer.test.ts)
 *  so we can exercise the "canvas available" branch of generateNineSliceSprite. */
function stubWorkingCanvas(): { calls: CtxCall[]; restore: () => void } {
  const calls: CtxCall[] = []
  const record = (method: string) => (...args: unknown[]): void => { calls.push({ method, args }) }
  const ctx = {
    fillStyle: '', strokeStyle: '', lineWidth: 0,
    beginPath: record('beginPath'),
    rect:      record('rect'),
    fill:      record('fill'),
    stroke:    record('stroke'),
  }
  const canvas = { width: 0, height: 0, getContext: (type: string) => (type === '2d' ? ctx : null) }
  const original = document.createElement.bind(document)
  const spy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    return tag === 'canvas' ? (canvas as unknown as HTMLCanvasElement) : original(tag)
  })
  return { calls, restore: () => spy.mockRestore() }
}

describe('generateNineSliceSprite', () => {
  it('bakes a NineSliceBackground with insets derived from radius, when a 2D context is available', () => {
    const { calls, restore } = stubWorkingCanvas()
    try {
      const bg = generateNineSliceSprite({ fill: '#223044', border: '#48597a', radius: 6 })
      expect(bg).toBeInstanceOf(NineSliceBackground)
      const nine = bg as NineSliceBackground
      expect(nine.insets).toEqual({ left: 8, top: 8, right: 8, bottom: 8 })   // min(24/2-1, 6+2) = 8
      expect(calls.some(c => c.method === 'fill')).toBe(true)
      expect(calls.some(c => c.method === 'stroke')).toBe(true)
    } finally {
      restore()
    }
  })

  it('draws 9 image patches when rendered (real nine-slice, not a flat stretch)', () => {
    const { restore } = stubWorkingCanvas()
    try {
      const bg = generateNineSliceSprite({ fill: '#223044', border: '#48597a', radius: 6 })
      const r   = new MockRenderer()
      bg.draw(r, { x: 0, y: 0, width: 100, height: 60 })
      expect(r.countCalls('image')).toBe(9)
    } finally {
      restore()
    }
  })

  it('falls back to a SolidColorBackground when no 2D canvas context is available (e.g. headless)', () => {
    // No stubbing here — jsdom genuinely has no working 2D context, so this exercises
    // the real fallback path used throughout the test suite.
    const bg = generateNineSliceSprite({ fill: '#111111', border: '#222222', borderWidth: 2 })
    expect(bg).toBeInstanceOf(SolidColorBackground)
    const solidBg = bg as SolidColorBackground
    expect(solidBg.fill).toBe('#111111')
    expect(solidBg.border).toBe('#222222')
    expect(solidBg.borderWidth).toBe(2)
  })
})
