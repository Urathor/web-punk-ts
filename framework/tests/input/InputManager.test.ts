import { InputManager } from '@engine/input'

function makeCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width  = 320
  c.height = 240
  vi.spyOn(c, 'getBoundingClientRect').mockReturnValue(
    { left: 0, top: 0, width: 320, height: 240, right: 320, bottom: 240, x: 0, y: 0, toJSON: () => '' } as DOMRect
  )
  return c
}

describe('InputManager', () => {
  let input: InputManager

  beforeEach(() => { input = new InputManager(makeCanvas()) })
  afterEach(()  => { input.dispose() })

  describe('keyboard state machine', () => {
    it('isKeyPressed is true on the first frame after keydown', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }))
      expect(input.isKeyPressed('Space')).toBe(true)
    })

    it('isKeyHeld is true on the first frame — JustPressed counts as held', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }))
      expect(input.isKeyHeld('Space')).toBe(true)  // JustPressed ⊂ Held
    })

    it('isKeyPressed becomes false after endFrame()', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }))
      input.endFrame()
      expect(input.isKeyPressed('Space')).toBe(false)
    })

    it('isKeyHeld is true after first endFrame()', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }))
      input.endFrame()
      expect(input.isKeyHeld('Space')).toBe(true)
    })

    it('isKeyReleased is true on first frame after keyup', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }))
      input.endFrame()
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', bubbles: true }))
      expect(input.isKeyReleased('Space')).toBe(true)
    })

    it('isKeyHeld becomes false after keyup + endFrame', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }))
      input.endFrame()
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', bubbles: true }))
      input.endFrame()
      expect(input.isKeyHeld('Space')).toBe(false)
    })

    it('isKeyReleased becomes false the frame after the release', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }))
      input.endFrame()
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', bubbles: true }))
      input.endFrame()   // clears the JustReleased state
      expect(input.isKeyReleased('Space')).toBe(false)
    })

    it('unknown key returns false for all states', () => {
      expect(input.isKeyPressed('F99')).toBe(false)
      expect(input.isKeyHeld('F99')).toBe(false)
      expect(input.isKeyReleased('F99')).toBe(false)
    })
  })
})
