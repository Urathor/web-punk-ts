import { Texture } from '@engine/assets'
import type { IAssetLoader, FontFileOptions, GoogleFont } from '@engine/assets'

/**
 * A minimal, controllable `IAssetLoader` for tests that need to hand something
 * to a loader/consumer (e.g. `AnimationClipLoader`, `TiledJsonLoader`) without
 * wiring up a real `AssetLoader`/DOM `Image`/`AudioContext`. Every texture
 * "loads" synchronously (resolved promise) as a fake 16×16 image unless a
 * size is registered via {@link setTextureSize}.
 */
export class MockAssetLoader implements IAssetLoader {
  private textures = new Map<string, Texture>()
  private sizes    = new Map<string, { width: number; height: number }>()

  setDebugger(): void {}

  /** Register the fake natural width/height a subsequently-loaded path should report. */
  setTextureSize(path: string, width: number, height: number): void {
    this.sizes.set(path, { width, height })
  }

  async loadTexture(path: string): Promise<Texture> {
    const cached = this.textures.get(path)
    if (cached) return cached

    const { width, height } = this.sizes.get(path) ?? { width: 16, height: 16 }
    const image = {
      naturalWidth:  width,
      naturalHeight: height,
    } as HTMLImageElement

    const texture = new Texture(image, path)
    this.textures.set(path, texture)
    return texture
  }

  getTexture(path: string): Texture | undefined {
    return this.textures.get(path)
  }

  isLoaded(path: string): boolean {
    return this.textures.has(path)
  }

  async preloadTextures(paths: string[], onProgress?: (loaded: number, total: number) => void): Promise<void> {
    for (let i = 0; i < paths.length; i++) {
      await this.loadTexture(paths[i]!)
      onProgress?.(i + 1, paths.length)
    }
  }

  async loadAudio(_path: string): Promise<AudioBuffer> {
    return {} as AudioBuffer
  }

  async loadFont(_family: string, _url: string, _opts?: FontFileOptions): Promise<void> {}

  async loadGoogleFonts(..._fonts: GoogleFont[]): Promise<void> {}
}
