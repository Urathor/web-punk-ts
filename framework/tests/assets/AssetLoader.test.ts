import { AssetLoader } from '@engine/assets'

/** Stubs Image so src-set immediately fires onload with 16×16 dimensions. */
function mockImageLoad(): void {
  Object.defineProperty(Image.prototype, 'src', {
    set(this: HTMLImageElement, _val: string) {
      Object.defineProperty(this, 'naturalWidth',  { value: 16, configurable: true })
      Object.defineProperty(this, 'naturalHeight', { value: 16, configurable: true })
      Promise.resolve().then(() => this.onload?.(new Event('load')))
    },
    configurable: true,
  })
}

describe('AssetLoader', () => {
  beforeEach(() => mockImageLoad())
  afterEach(()  => vi.restoreAllMocks())

  it('loads a texture and returns it with the correct path', async () => {
    const loader = new AssetLoader()
    const tex    = await loader.loadTexture('/sprites/player.png')
    expect(tex.path).toBe('/sprites/player.png')
    expect(tex.width).toBe(16)
    expect(tex.height).toBe(16)
  })

  it('caches textures — second load returns same instance', async () => {
    const loader = new AssetLoader()
    const t1 = await loader.loadTexture('/sprites/player.png')
    const t2 = await loader.loadTexture('/sprites/player.png')
    expect(t1).toBe(t2)
  })

  it('isLoaded returns false before load, true after', async () => {
    const loader = new AssetLoader()
    expect(loader.isLoaded('/test.png')).toBe(false)
    await loader.loadTexture('/test.png')
    expect(loader.isLoaded('/test.png')).toBe(true)
  })

  it('getTexture returns undefined before load, the texture after', async () => {
    const loader = new AssetLoader()
    expect(loader.getTexture('/foo.png')).toBeUndefined()
    const t = await loader.loadTexture('/foo.png')
    expect(loader.getTexture('/foo.png')).toBe(t)
  })
})
