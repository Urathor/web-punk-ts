import { AnimationClipLoader } from '@engine/animation'
import { MockAssetLoader } from '../mocks/MockAssetLoader'

function mockFetchJson(data: unknown, ok = true): void {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 404,
    json: () => Promise.resolve(data),
  }))
}

describe('AnimationClipLoader', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('derives srcRect from col/row + tile dimensions', async () => {
    mockFetchJson({
      texture:     '/sprites/player.png',
      tileWidth:   16,
      tileHeight:  16,
      defaultLoop: true,
      clips: {
        walk: [
          { col: 1, row: 0, duration: 100 },
          { col: 2, row: 0, duration: 100 },
        ],
      },
    })

    const loader = new AnimationClipLoader(new MockAssetLoader())
    const clips  = await loader.load('/anim/player.json')

    expect(clips.walk).toBeDefined()
    expect(clips.walk!.frames).toHaveLength(2)
    expect(clips.walk!.frames[0]!.sprite.srcRect).toMatchObject({ x: 16, y: 0, width: 16, height: 16 })
    expect(clips.walk!.frames[1]!.sprite.srcRect).toMatchObject({ x: 32, y: 0, width: 16, height: 16 })
    expect(clips.walk!.frames[0]!.duration).toBe(100)
  })

  it('falls back to defaultLoop when a clip has no per-frame loop override', async () => {
    mockFetchJson({
      texture: '/sprites/player.png', tileWidth: 16, tileHeight: 16, defaultLoop: true,
      clips: { idle: [{ col: 0, row: 0, duration: 200 }] },
    })
    const clips = await new AnimationClipLoader(new MockAssetLoader()).load('/anim/player.json')
    expect(clips.idle!.loop).toBe(true)
  })

  it('a per-frame loop override takes precedence over defaultLoop', async () => {
    mockFetchJson({
      texture: '/sprites/player.png', tileWidth: 16, tileHeight: 16, defaultLoop: true,
      clips: { attack: [{ col: 3, row: 0, duration: 80, loop: false }] },
    })
    const clips = await new AnimationClipLoader(new MockAssetLoader()).load('/anim/player.json')
    expect(clips.attack!.loop).toBe(false)
  })

  it('loads the texture referenced by the clip data through the injected asset loader', async () => {
    mockFetchJson({
      texture: '/sprites/player.png', tileWidth: 16, tileHeight: 16, defaultLoop: true,
      clips: { idle: [{ col: 0, row: 0, duration: 200 }] },
    })
    const assets = new MockAssetLoader()
    await new AnimationClipLoader(assets).load('/anim/player.json')
    expect(assets.isLoaded('/sprites/player.png')).toBe(true)
  })

  it('throws when the fetch response is not ok', async () => {
    mockFetchJson({}, false)
    const loader = new AnimationClipLoader(new MockAssetLoader())
    await expect(loader.load('/anim/missing.json')).rejects.toThrow(/HTTP 404/)
  })
})
