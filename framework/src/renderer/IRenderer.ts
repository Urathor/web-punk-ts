// Structural types used in the renderer interface.
// Using plain structural types (not the class instances) lets callers
// pass either the math classes or plain object literals.
export type IPoint = { x: number; y: number }
export type IRect  = { x: number; y: number; width: number; height: number }

export interface TextStyle {
  color:  string
  /** Font size in logical pixels. */
  size:   number
  /** CSS font family string. Defaults to {@link DEFAULT_FONT_FAMILY}. */
  font?:  string
  /** Horizontal alignment relative to the position x. Defaults to 'left'. */
  align?: 'left' | 'center' | 'right'
  /** Vertical alignment relative to the position y — i.e. what `position.y` refers to
   *  on the glyphs. Defaults to `'alphabetic'` (the canvas default) for backwards
   *  compatibility with hand-tuned call sites; pass `'top'` when `position.y` is meant
   *  to be the top of the text's box (e.g. `UIText`, which lays out like a top-anchored
   *  box via `getBounds()`). */
  baseline?: 'alphabetic' | 'top' | 'middle' | 'bottom'
}

/** Browser upscale filter applied to `canvas.style.imageRendering`. */
export type ScaleFilter = 'pixelated' | 'smooth'

export interface IRenderer {
  readonly logicalWidth:  number
  readonly logicalHeight: number

  /** Clear the entire canvas to a solid colour. */
  clear(color?: string): void

  /** Draw a region of a source image to a destination rect in logical pixels. */
  drawImage(
    image:   HTMLImageElement | HTMLCanvasElement | OffscreenCanvas,
    srcRect: IRect,
    dstRect: IRect
  ): void

  /** Draw a filled or outlined rectangle. fill defaults to true. */
  drawRect(rect: IRect, color: string, fill?: boolean): void

  /** Draw a filled or outlined circle. fill defaults to true. */
  drawCircle(center: IPoint, radius: number, color: string, fill?: boolean): void

  /** Draw a line between two points. */
  drawLine(from: IPoint, to: IPoint, color: string, lineWidth?: number): void

  /** Draw text using the canvas font API (fallback; BitmapFont preferred). */
  drawText(text: string, position: IPoint, style: TextStyle): void

  /** Push an offset transform (e.g. camera world-space shift). */
  pushTransform(offsetX: number, offsetY: number, scaleX?: number, scaleY?: number): void

  /** Pop the last pushed transform. */
  popTransform(): void

  /**
   * Clip subsequent drawing to a rectangle, in logical pixels. Used to confine
   * world rendering to a camera viewport. Must be balanced with popClip().
   */
  pushClip(rect: IRect): void

  /** Remove the last pushed clip region. */
  popClip(): void

  /**
   * Current global image-smoothing state.
   * Set once per frame by the camera; read by renderer components to decide
   * whether to apply smoothing on their draw call.
   */
  readonly imageSmoothing: boolean

  /**
   * Set the global in-canvas sprite smoothing state (ctx.imageSmoothingEnabled).
   * Call this once per frame (e.g. from Camera.render); do NOT call per draw call.
   * Does NOT change the browser upscale filter — see {@link setScaleFilter}.
   */
  setImageSmoothing(enabled: boolean): void

  /**
   * Toggle ctx.imageSmoothingEnabled for a single draw call only — no CSS change.
   * Call this immediately before and after a drawImage in a component's render().
   * Ignored by drawRect, drawLine, and drawText.
   */
  setDrawSmoothing(enabled: boolean): void

  /**
   * Current browser upscale filter (maps to `canvas.style.imageRendering`).
   * 'pixelated' = crisp nearest-neighbour; 'smooth' = bilinear (faux-CRT look).
   */
  readonly scaleFilter: ScaleFilter

  /** Set the browser upscale filter. Persists across frames and window resizes. */
  setScaleFilter(filter: ScaleFilter): void

  /** Toggle the browser upscale filter between 'pixelated' and 'smooth'. */
  toggleScaleFilter(): void

  /** Toggle debug drawing mode (diverts draw call counting to debug stats). */
  setDebugMode?(enabled: boolean): void

  /**
   * Optional dev-only draw-call telemetry for the debug overlay. Implementations
   * that don't track draw calls (or aren't built with counting support) may omit
   * this — callers should treat a missing implementation the same as zero calls.
   */
  getDebugStats?(): RendererDebugStats
}

/** Draw-call counters reported by {@link IRenderer.getDebugStats}. */
export interface RendererDebugStats {
  /** Draw calls issued by game code (outside `setDebugMode(true)`). */
  gameDrawCalls:  number
  /** Draw calls issued while `setDebugMode(true)` was active (debug overlay itself). */
  debugDrawCalls: number
}
