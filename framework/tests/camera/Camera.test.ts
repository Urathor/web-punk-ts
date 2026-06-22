import { Camera } from '@engine/camera'
import { MockRenderer } from '../mocks/MockRenderer'

describe('Camera viewport rendering', () => {
  it('full-screen viewport: world layer uses no clip and the negative camera offset', () => {
    const r   = new MockRenderer()          // 320×240, matches the default viewport
    const cam = new Camera()
    cam.position.x = 10
    cam.position.y = 20

    let seenTransforms: { offsetX: number; offsetY: number }[] = []
    let seenClips: unknown[] = []
    cam.addWorldLayer('world', 0, (rr) => {
      seenTransforms = [...(rr as MockRenderer).transforms]
      seenClips      = [...(rr as MockRenderer).clips]
    })

    cam.render(r, 0)

    expect(seenClips.length).toBe(0)
    expect(seenTransforms).toEqual([{ offsetX: -10, offsetY: -20 }])
  })

  it('sub-screen viewport: world layer is clipped and offset to the viewport origin', () => {
    const r   = new MockRenderer()
    const cam = new Camera()
    cam.position.x = 100
    cam.position.y = 50
    cam.viewport = { x: 32, y: 24, width: 256, height: 192 }

    let seenTransforms: { offsetX: number; offsetY: number }[] = []
    let seenClips: unknown[] = []
    cam.addWorldLayer('world', 0, (rr) => {
      seenTransforms = [...(rr as MockRenderer).transforms]
      seenClips      = [...(rr as MockRenderer).clips]
    })

    cam.render(r, 0)

    expect(seenClips).toEqual([{ x: 32, y: 24, width: 256, height: 192 }])
    expect(seenTransforms).toEqual([{ offsetX: 32 - 100, offsetY: 24 - 50 }])
  })

  it('UI layer renders unclipped with no transform even under a sub-screen viewport', () => {
    const r   = new MockRenderer()
    const cam = new Camera()
    cam.viewport = { x: 32, y: 24, width: 256, height: 192 }

    let seenTransforms: unknown[] = []
    let seenClips: unknown[] = []
    cam.addUILayer('ui', 0, (rr) => {
      seenTransforms = [...(rr as MockRenderer).transforms]
      seenClips      = [...(rr as MockRenderer).clips]
    })

    cam.render(r, 0)

    expect(seenClips.length).toBe(0)
    expect(seenTransforms.length).toBe(0)
  })

  it('clip and transform are balanced (popped) after render returns', () => {
    const r   = new MockRenderer()
    const cam = new Camera()
    cam.viewport = { x: 16, y: 16, width: 288, height: 208 }
    cam.addWorldLayer('world', 0, () => {})

    cam.render(r, 0)

    expect(r.clips.length).toBe(0)
    expect(r.transforms.length).toBe(0)
  })
})
