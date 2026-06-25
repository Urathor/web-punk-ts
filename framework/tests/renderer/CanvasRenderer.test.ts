import { describe, it, expect } from 'vitest'
import { CanvasRenderer } from '@engine/renderer'

interface CtxCall { method: string; args: unknown[] }

/**
 * jsdom has no real 2D context, so stub one that records draw calls. Covers the
 * methods CanvasRenderer touches during construction (setupScaling) and drawCircle.
 */
function makeFakeCanvas() {
  const calls: CtxCall[] = []
  const record = (method: string) => (...args: unknown[]): void => { calls.push({ method, args }) }
  const ctx = {
    fillStyle:             '',
    strokeStyle:           '',
    imageSmoothingEnabled: false,
    setTransform: record('setTransform'),
    beginPath:    record('beginPath'),
    arc:          record('arc'),
    fill:         record('fill'),
    stroke:       record('stroke'),
    fillRect:     record('fillRect'),
    strokeRect:   record('strokeRect'),
  }
  const canvas = {
    width:  0,
    height: 0,
    style:  {} as Record<string, string>,
    getContext: (type: string) => (type === '2d' ? ctx : null),
  }
  return { canvas: canvas as unknown as HTMLCanvasElement, ctx, calls }
}

describe('CanvasRenderer.drawCircle', () => {
  it('fills a circle by default: beginPath → arc → fill, with fillStyle set', () => {
    const { canvas, ctx, calls } = makeFakeCanvas()
    const renderer = new CanvasRenderer(canvas)
    calls.length = 0 // discard constructor/setupScaling calls

    renderer.drawCircle({ x: 10, y: 20 }, 5, '#ff0000') // fill defaults to true

    expect(calls.map(c => c.method)).toEqual(['beginPath', 'arc', 'fill'])
    expect(calls[1].args).toEqual([10, 20, 5, 0, Math.PI * 2])
    expect(ctx.fillStyle).toBe('#ff0000')
  })

  it('outlines a circle when fill = false: beginPath → arc → stroke, with strokeStyle set', () => {
    const { canvas, ctx, calls } = makeFakeCanvas()
    const renderer = new CanvasRenderer(canvas)
    calls.length = 0

    renderer.drawCircle({ x: 0, y: 0 }, 12, '#00ff00', false)

    expect(calls.map(c => c.method)).toEqual(['beginPath', 'arc', 'stroke'])
    expect(calls[1].args).toEqual([0, 0, 12, 0, Math.PI * 2])
    expect(ctx.strokeStyle).toBe('#00ff00')
  })
})
