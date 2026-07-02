import { UIText } from '@engine/ui'
import { BitmapFont } from '@engine/ui'
import type { Texture } from '@engine/assets'
import { MockRenderer } from '../mocks/MockRenderer'

function makeBitmapFont(charWidth = 6, charHeight = 8): BitmapFont {
  return new BitmapFont({
    texture:     {} as Texture,
    charWidth,
    charHeight,
    chars:       'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    charsPerRow: 13,
  })
}

describe('UIText — auto-sizing', () => {
  it('falls back to fontSize when height is unset (0)', () => {
    const t = new UIText()
    t.fontSize = 12
    t.text = 'hi'
    expect(t.getBounds().height).toBe(12)
  })

  it('derives the effective font size from height when height is explicitly set', () => {
    const t = new UIText()
    t.fontSize = 8
    t.height   = 20
    t.text     = 'hi'
    const r = new MockRenderer()
    t.render(r, 0)
    const call  = r.drawCalls.find(c => c.type === 'text')
    const style = call?.args[2] as { size: number }
    expect(style.size).toBe(20)
    expect(t.getBounds().height).toBe(20)
  })

  it('auto-sizes width to the measured text when width is unset (0)', () => {
    const t = new UIText()
    t.text = 'hello'
    expect(t.getBounds().width).toBeGreaterThan(0)
  })

  it('keeps an explicit width regardless of text length', () => {
    const t = new UIText()
    t.width = 100
    t.text  = 'x'
    expect(t.getBounds().width).toBe(100)
  })

  it('keeps an explicit height and does not fall back to fontSize', () => {
    const t = new UIText()
    t.height   = 30
    t.fontSize = 8
    expect(t.getBounds().height).toBe(30)
  })
})

describe('UIText — textAlign (canvas path)', () => {
  it('defaults to left alignment at the box origin', () => {
    const t = new UIText()
    t.width = 100
    t.text  = 'hi'
    const r = new MockRenderer()
    t.render(r, 0)
    const call  = r.drawCalls.find(c => c.type === 'text')
    const pos   = call?.args[1] as { x: number }
    const style = call?.args[2] as { align?: string }
    expect(pos.x).toBe(t.getPosition().x)
    expect(style.align).toBe('left')
  })

  it('centers within an explicit width', () => {
    const t = new UIText()
    t.width = 100
    t.text  = 'hi'
    t.textAlign = 'center'
    const r = new MockRenderer()
    t.render(r, 0)
    const call = r.drawCalls.find(c => c.type === 'text')
    const pos  = call?.args[1] as { x: number }
    expect(pos.x).toBe(t.getPosition().x + 50)
  })

  it('right-aligns to the far edge of an explicit width', () => {
    const t = new UIText()
    t.width = 100
    t.text  = 'hi'
    t.textAlign = 'right'
    const r = new MockRenderer()
    t.render(r, 0)
    const call = r.drawCalls.find(c => c.type === 'text')
    const pos  = call?.args[1] as { x: number }
    expect(pos.x).toBe(t.getPosition().x + 100)
  })
})

describe('UIText — textAlign (bitmap font path)', () => {
  it('left-aligns at the box origin by default', () => {
    const t = new UIText()
    t.bitmapFont = makeBitmapFont()
    t.width = 100
    t.text  = 'AB'
    const r = new MockRenderer()
    t.render(r, 0)
    const firstImage = r.drawCalls.find(c => c.type === 'image')
    const dst = firstImage?.args[2] as { x: number }
    expect(dst.x).toBe(t.getPosition().x)
  })

  it('centers text within an explicit width', () => {
    const t = new UIText()
    t.bitmapFont = makeBitmapFont(6, 8)   // charWidth 6
    t.width = 100
    t.text  = 'AB'                          // measured width = 2 * 6 = 12
    t.textAlign = 'center'
    const r = new MockRenderer()
    t.render(r, 0)
    const firstImage = r.drawCalls.find(c => c.type === 'image')
    const dst = firstImage?.args[2] as { x: number }
    // box center = pos.x + 50; text width = 12 -> starts at center - 6
    expect(dst.x).toBe(t.getPosition().x + 50 - 6)
  })

  it('derives the bitmap-font scale from an explicit height', () => {
    const t = new UIText()
    t.bitmapFont = makeBitmapFont(6, 8)   // charHeight 8
    t.height = 16                          // -> scale should be 2
    t.text   = 'A'
    const r = new MockRenderer()
    t.render(r, 0)
    const firstImage = r.drawCalls.find(c => c.type === 'image')
    const dst = firstImage?.args[2] as { width: number; height: number }
    expect(dst.height).toBe(16)
    expect(dst.width).toBe(12)   // charWidth 6 * scale 2
  })
})
