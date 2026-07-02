import type { Texture }                      from './Texture'
import type { IDebugger }                    from '@engine/debug'
import type { FontFileOptions, GoogleFont }  from './AssetLoader'

/**
 * Public contract for texture/audio/font loading. `AssetLoader` is the sole
 * implementation; the interface exists so dependents (Engine, AnimationClipLoader,
 * TiledJsonLoader) depend on a stable contract rather than the concrete class.
 */
export interface IAssetLoader {
  setDebugger(dbg: IDebugger | null): void

  loadTexture(path: string): Promise<Texture>
  getTexture(path: string): Texture | undefined
  isLoaded(path: string): boolean
  preloadTextures(paths: string[], onProgress?: (loaded: number, total: number) => void): Promise<void>

  loadAudio(path: string): Promise<AudioBuffer>

  loadFont(family: string, url: string, opts?: FontFileOptions): Promise<void>
  loadGoogleFonts(...fonts: GoogleFont[]): Promise<void>
}
