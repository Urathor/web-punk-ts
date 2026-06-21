import { Texture } from './Texture'

export class AssetLoader {
  private textureCache = new Map<string, Texture>()
  private audioCache   = new Map<string, AudioBuffer>()
  private audioCtx:      AudioContext | null = null

  // ── Texture ─────────────────────────────────────────────────────────────────

  async loadTexture(path: string): Promise<Texture> {
    const cached = this.textureCache.get(path)
    if (cached) return cached

    const texture = await this.fetchTexture(path)
    this.textureCache.set(path, texture)
    return texture
  }

  getTexture(path: string): Texture | undefined {
    return this.textureCache.get(path)
  }

  isLoaded(path: string): boolean {
    return this.textureCache.has(path)
  }

  // ── Manifest preloading ──────────────────────────────────────────────────────

  async preloadTextures(
    paths: string[],
    onProgress?: (loaded: number, total: number) => void
  ): Promise<void> {
    let loaded = 0
    await Promise.all(
      paths.map(async (path) => {
        await this.loadTexture(path)
        loaded++
        onProgress?.(loaded, paths.length)
      })
    )
  }

  // ── Audio ────────────────────────────────────────────────────────────────────

  async loadAudio(path: string): Promise<AudioBuffer> {
    const cached = this.audioCache.get(path)
    if (cached) return cached

    if (!this.audioCtx) this.audioCtx = new AudioContext()
    const response = await fetch(path)
    if (!response.ok) throw new Error(`AssetLoader: failed to load audio "${path}" (${response.status})`)
    const arrayBuf = await response.arrayBuffer()
    const buffer   = await this.audioCtx.decodeAudioData(arrayBuf)
    this.audioCache.set(path, buffer)
    return buffer
  }

  // ── Internal ─────────────────────────────────────────────────────────────────

  private fetchTexture(path: string): Promise<Texture> {
    return new Promise((resolve, reject) => {
      const img    = new Image()
      img.onload   = () => resolve(new Texture(img, path))
      img.onerror  = () => reject(new Error(`AssetLoader: failed to load "${path}"`))
      img.src      = path
    })
  }
}
