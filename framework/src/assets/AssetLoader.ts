import { Texture } from './Texture'
import type { IDebugger } from '@engine/debug'

/** Optional `FontFace` descriptors for {@link AssetLoader.loadFont}. */
export interface FontFileOptions {
  weight?:  string
  style?:   string
  display?: FontDisplay
}

/** A Google family for {@link AssetLoader.loadGoogleFonts}: the family name, or
 *  the name plus an axis spec (e.g. `{ family: 'Inter', axis: 'wght@400;700' }`). */
export type GoogleFont = string | { family: string; axis?: string }

export class AssetLoader {
  private textureCache = new Map<string, Texture>()
  private audioCache   = new Map<string, AudioBuffer>()
  private audioCtx:      AudioContext | null = null
  private loadedFonts  = new Set<string>()
  private debugger:      IDebugger | null = null

  setDebugger(dbg: IDebugger | null): void {
    this.debugger = dbg
  }

  private reportError(msg: string): void {
    this.debugger?.logError(msg)
  }

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

    try {
      if (!this.audioCtx) this.audioCtx = new AudioContext()
      const response = await fetch(path)
      if (!response.ok) {
        throw new Error(`failed to fetch asset (${response.status})`)
      }
      const arrayBuf = await response.arrayBuffer()
      const buffer   = await this.audioCtx.decodeAudioData(arrayBuf)
      this.audioCache.set(path, buffer)
      return buffer
    } catch (err: any) {
      const msg = `AssetLoader: failed to load audio "${path}": ${err.message}`
      this.reportError(msg)
      throw new Error(msg)
    }
  }

  // ── Fonts ──────────────────────────────────────────────────────

  /**
   * Load a font from a path or URL (.ttf, .otf, .woff, .woff2) and register it
   * under `family`, then pass that same `family` to a widget's `font` field (or
   * any `drawText` style). Quote multi-word names when referencing them in CSS,
   * e.g. `'"My Font", sans-serif'`. Repeat calls for the same family+url are
   * no-ops, and it resolves without registering when no DOM font API is present.
   *
   * @example
   * await engine.assets.loadFont('My Font', '/fonts/MyFont.ttf')
   */
  async loadFont(family: string, url: string, opts: FontFileOptions = {}): Promise<void> {
    const key = `${family}|${url}`
    if (this.loadedFonts.has(key)) return
    if (typeof FontFace === 'undefined' || !document.fonts) return

    try {
      const face = new FontFace(family, `url(${url})`, {
        weight:  opts.weight  ?? 'normal',
        style:   opts.style   ?? 'normal',
        display: opts.display ?? 'swap',
      })
      await face.load()
      document.fonts.add(face)
      this.loadedFonts.add(key)
    } catch (err: any) {
      const msg = `AssetLoader: failed to load font "${family}" from "${url}": ${err.message}`
      this.reportError(msg)
      throw new Error(msg)
    }
  }

  /**
   * Load one or more Google Fonts. Injects the Google stylesheet (plus preconnect
   * hints) and resolves once the families are ready to paint — `await` it before
   * the first frame to avoid a fallback flash. Never rejects on a CDN failure.
   *
   * @example
   * await engine.assets.loadGoogleFonts('Press Start 2P')
   * await engine.assets.loadGoogleFonts({ family: 'Inter', axis: 'wght@400;700' })
   */
  async loadGoogleFonts(...fonts: GoogleFont[]): Promise<void> {
    if (typeof document === 'undefined' || !document.fonts) return
    const specs = fonts.map((f) => (typeof f === 'string' ? { family: f } : f))
    if (specs.length === 0) return

    const query = specs
      .map((s) => `family=${s.family.trim().replace(/\s+/g, '+')}${s.axis ? ':' + s.axis : ''}`)
      .join('&')
    const href = `https://fonts.googleapis.com/css2?${query}&display=swap`

    ensurePreconnect('https://fonts.googleapis.com')
    ensurePreconnect('https://fonts.gstatic.com', true)
    await ensureStylesheet(href)

    // The @font-face rules are registered now; wait for the actual font files.
    await Promise.all(specs.map((s) => document.fonts.load(`1em "${s.family}"`)))
  }

  // ── Internal ─────────────────────────────────────────────────────────────────

  private fetchTexture(path: string): Promise<Texture> {
    return new Promise((resolve, reject) => {
      const img    = new Image()
      img.onload   = () => resolve(new Texture(img, path))
      img.onerror  = () => {
        const msg = `AssetLoader: failed to load image "${path}"`
        this.reportError(msg)
        reject(new Error(msg))
      }
      img.src      = path
    })
  }
}

/** Append the Google stylesheet once, resolving when it has parsed (so the @font-face exists). */
function ensureStylesheet(href: string): Promise<void> {
  if (document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) return Promise.resolve()
  return new Promise<void>((resolve) => {
    const link = document.createElement('link')
    link.rel   = 'stylesheet'
    link.href  = href
    link.addEventListener('load',  () => resolve())
    link.addEventListener('error', () => resolve()) // never hang the game on a font CDN failure
    document.head.appendChild(link)
  })
}

function ensurePreconnect(href: string, crossOrigin = false): void {
  if (document.querySelector(`link[rel="preconnect"][href="${href}"]`)) return
  const link = document.createElement('link')
  link.rel   = 'preconnect'
  link.href  = href
  if (crossOrigin) link.crossOrigin = 'anonymous'
  document.head.appendChild(link)
}
