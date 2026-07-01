import type { IRenderer, IPoint, IRect, TextStyle, ScaleFilter } from './IRenderer'
import { LOGICAL_WIDTH, LOGICAL_HEIGHT, DEFAULT_FONT_FAMILY } from '@engine/constants'

/** How the logical buffer is scaled to fill the browser window. */
export type ScalingOptions =
  ( | { mode: 'integer' | 'fit' | 'stretch' }
    | { mode: 'fixed'; scale: number }
  ) & {
    /** Browser upscale filter. Defaults to 'pixelated' (crisp pixel art). */
    filter?: ScaleFilter
  }

/** Optional construction-time configuration for {@link CanvasRenderer}. */
export interface CanvasRendererOptions {
  /** Logical render resolution in pixels. Defaults to 320×240. */
  resolution?: { width: number; height: number }
  /** Browser scaling strategy. Defaults to `{ mode: 'integer' }`. */
  scaling?:    ScalingOptions
}

const DEBUG_OVERLAY_ENABLED = process.env.NODE_ENV !== 'production'

export class CanvasRenderer implements IRenderer {
  readonly logicalWidth:  number
  readonly logicalHeight: number

  private readonly canvas: HTMLCanvasElement
  private readonly ctx:    CanvasRenderingContext2D

  // Browser scaling strategy, resolved from constructor options.
  private readonly scaleMode:  'integer' | 'fit' | 'stretch' | 'fixed'
  private readonly fixedScale: number
  private _scaleFilter: ScaleFilter
  get scaleFilter(): ScaleFilter { return this._scaleFilter }

  // Per-camera / per-sprite smoothing (set each frame by Camera.render via
  // setImageSmoothing). Independent of the upscale scale filter below.
  private _imageSmoothing = false
  get imageSmoothing(): boolean { return this._imageSmoothing }

  /**
   * Effective `ctx.imageSmoothingEnabled`. Smoothing is on when EITHER the camera
   * asks for sprite smoothing OR the upscale scale filter is 'smooth'. These are two
   * independent inputs to the single canvas smoothing flag, so the 'smooth' filter is
   * never cancelled by Camera.render resetting its own (default-off) smoothing.
   */
  private get _smoothingOn(): boolean {
    return this._imageSmoothing || this._scaleFilter === 'smooth'
  }

  // Draw-call counter (dev builds only)
  private _debugMode          = false
  private _gameDrawCalls      = 0
  private _debugDrawCalls     = 0
  private _drawCallTimer      = 0
  private _gameDrawCallsLast  = 0
  private _debugDrawCallsLast = 0
  private _frameCount         = 0
  private _lastClearTime      = 0

  /** Last frame's total draw-call count (updated each second). Only meaningful in DEV builds. */
  get drawCallsLastFrame(): number { return this._gameDrawCallsLast + this._debugDrawCallsLast }
  /** Last frame's game draw-call count. */
  get gameDrawCallsLastFrame(): number { return this._gameDrawCallsLast }
  /** Last frame's debug draw-call count. */
  get debugDrawCallsLastFrame(): number { return this._debugDrawCallsLast }

  setDebugMode(enabled: boolean): void {
    this._debugMode = enabled
  }

  private incrementDrawCall(): void {
    if (this._debugMode) {
      this._debugDrawCalls++
    } else {
      this._gameDrawCalls++
    }
  }

  constructor(canvas: HTMLCanvasElement, options: CanvasRendererOptions = {}) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('CanvasRenderer: failed to get 2D context')
    this.ctx = ctx

    this.logicalWidth  = options.resolution?.width  ?? LOGICAL_WIDTH
    this.logicalHeight = options.resolution?.height ?? LOGICAL_HEIGHT

    const scaling     = options.scaling ?? { mode: 'integer' }
    this.scaleMode    = scaling.mode
    this.fixedScale   = scaling.mode === 'fixed' ? scaling.scale : 1
    this._scaleFilter = scaling.filter ?? 'pixelated'

    // Set the CSS upscale hint ONCE, here at construction. Runtime scale-filter
    // toggling only changes ctx.imageSmoothingEnabled (the in-canvas upscale) and
    // deliberately never touches CSS again.
    this.canvas.style.imageRendering = this._scaleFilter === 'smooth' ? 'auto' : 'pixelated'

    this.setupScaling()
    window.addEventListener('resize', () => this.setupScaling())
  }

  private setupScaling(): void {
    // Round DPR to nearest integer so all math stays clean (1.5 → 2, 1.25 → 1, etc.)
    const dpr  = Math.max(1, Math.round(window.devicePixelRatio ?? 1))
    const winW = window.innerWidth
    const winH = window.innerHeight
    const lw   = this.logicalWidth
    const lh   = this.logicalHeight

    // Determine the CSS display size (in CSS pixels) from the scaling mode.
    let cssW: number
    let cssH: number
    if (this.scaleMode === 'stretch') {
      // Fill both axes, ignoring aspect ratio (may distort). Buffer stays logical.
      cssW = winW
      cssH = winH
    } else {
      let s: number
      if (this.scaleMode === 'integer') {
        // Largest whole-number multiple that fits — crispest pixel art.
        s = Math.max(1, Math.floor(Math.min(winW / lw, winH / lh)))
      } else if (this.scaleMode === 'fit') {
        // Largest fractional scale preserving aspect ratio.
        s = Math.max(0.01, Math.min(winW / lw, winH / lh))
      } else {
        // 'fixed' — exactly `scale ×` the logical size, regardless of window.
        s = this.fixedScale
      }
      cssW = lw * s
      cssH = lh * s
    }

    // Physical pixel buffer matches the CSS size × DPR for crisp HiDPI output.
    const bufW = Math.max(1, Math.round(cssW * dpr))
    const bufH = Math.max(1, Math.round(cssH * dpr))

    this.canvas.width  = bufW
    this.canvas.height = bufH
    this.canvas.style.width  = `${cssW}px`
    this.canvas.style.height = `${cssH}px`

    // Map logical coordinates onto the physical buffer. For uniform modes scaleX
    // equals scaleY; 'stretch' produces independent per-axis scales. Setting
    // canvas.width/height above reset the context, so re-apply smoothing here.
    // (CSS image-rendering is set once in the constructor and not touched on resize.)
    this.ctx.setTransform(bufW / lw, 0, 0, bufH / lh, 0, 0)
    this.ctx.imageSmoothingEnabled = this._smoothingOn
  }

  clear(color = '#000000'): void {
    if (DEBUG_OVERLAY_ENABLED) {
      const now = performance.now()
      // Detect if this clear() is in a new frame (at least 5ms has passed since last frame's first clear)
      if (now - this._lastClearTime > 5) {
        this._lastClearTime = now
        this._frameCount++
        
        this._drawCallTimer += 16.67  // approximate; good enough for console logging
        if (this._drawCallTimer >= 1000) {
          this._gameDrawCallsLast  = this._frameCount > 0 ? Math.round(this._gameDrawCalls / this._frameCount) : 0
          this._debugDrawCallsLast = this._frameCount > 0 ? Math.round(this._debugDrawCalls / this._frameCount) : 0
          this._gameDrawCalls  = 0
          this._debugDrawCalls = 0
          this._frameCount     = 0
          this._drawCallTimer  = 0
        }
      }
    }
    this.ctx.fillStyle = color
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight)
  }

  drawImage(
    image:   HTMLImageElement | HTMLCanvasElement | OffscreenCanvas,
    srcRect: IRect,
    dstRect: IRect
  ): void {
    if (DEBUG_OVERLAY_ENABLED) { this.incrementDrawCall() }
    this.ctx.drawImage(
      image,
      srcRect.x, srcRect.y, srcRect.width, srcRect.height,
      dstRect.x, dstRect.y, dstRect.width, dstRect.height
    )
  }

  drawRect(rect: IRect, color: string, fill = true): void {
    if (DEBUG_OVERLAY_ENABLED) { this.incrementDrawCall() }
    if (fill) {
      this.ctx.fillStyle = color
      this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
    } else {
      this.ctx.strokeStyle = color
      this.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
    }
  }

  drawCircle(center: IPoint, radius: number, color: string, fill = true): void {
    if (DEBUG_OVERLAY_ENABLED) { this.incrementDrawCall() }
    this.ctx.beginPath()
    this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2)
    if (fill) {
      this.ctx.fillStyle = color
      this.ctx.fill()
    } else {
      this.ctx.strokeStyle = color
      this.ctx.stroke()
    }
  }

  drawLine(from: IPoint, to: IPoint, color: string, lineWidth = 1): void {
    if (DEBUG_OVERLAY_ENABLED) { this.incrementDrawCall() }
    this.ctx.strokeStyle = color
    this.ctx.lineWidth   = lineWidth
    this.ctx.beginPath()
    this.ctx.moveTo(from.x, from.y)
    this.ctx.lineTo(to.x,   to.y)
    this.ctx.stroke()
  }

  drawText(text: string, position: IPoint, style: TextStyle): void {
    if (DEBUG_OVERLAY_ENABLED) { this.incrementDrawCall() }
    this.ctx.fillStyle = style.color
    this.ctx.font      = `${style.size}px ${style.font ?? DEFAULT_FONT_FAMILY}`
    this.ctx.textAlign = style.align ?? 'left'
    this.ctx.fillText(text, position.x, position.y)
    this.ctx.textAlign = 'left'
  }

  pushTransform(offsetX: number, offsetY: number, scaleX = 1, scaleY = 1): void {
    this.ctx.save()
    this.ctx.translate(offsetX, offsetY)
    if (scaleX !== 1 || scaleY !== 1) {
      this.ctx.scale(scaleX, scaleY)
    }
  }

  popTransform(): void {
    this.ctx.restore()
    // restore() resets imageSmoothingEnabled to the saved value — re-apply ours
    this.ctx.imageSmoothingEnabled = this._smoothingOn
  }

  pushClip(rect: IRect): void {
    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.rect(rect.x, rect.y, rect.width, rect.height)
    this.ctx.clip()
  }

  popClip(): void {
    this.ctx.restore()
    // restore() resets imageSmoothingEnabled to the saved value — re-apply ours
    this.ctx.imageSmoothingEnabled = this._smoothingOn
  }

  setImageSmoothing(enabled: boolean): void {
    this._imageSmoothing = enabled
    // The 'smooth' scale filter also forces smoothing on, so honour both inputs —
    // this is what stops Camera.render's per-frame reset from cancelling the filter.
    this.ctx.imageSmoothingEnabled = this._smoothingOn
  }

  /**
   * Change ctx.imageSmoothingEnabled for one draw call only. Does not touch CSS.
   * The 'smooth' scale filter forces smoothing on for every draw (whole-screen
   * faux-CRT blur), so per-sprite/tile crisp draws (SpriteRenderer/TileMapRenderer
   * pass `antiAlias && imageSmoothing`, normally false) cannot defeat it.
   */
  setDrawSmoothing(enabled: boolean): void {
    this.ctx.imageSmoothingEnabled = enabled || this._scaleFilter === 'smooth'
  }

  setScaleFilter(filter: ScaleFilter): void {
    this._scaleFilter = filter
    this.applyScaleFilter()
  }

  toggleScaleFilter(): void {
    this.setScaleFilter(this._scaleFilter === 'smooth' ? 'pixelated' : 'smooth')
  }

  /**
   * Apply the current upscale filter to the drawing context. This renderer upscales
   * the logical buffer *inside* the canvas (via setTransform), so the visible result
   * is governed entirely by ctx.imageSmoothingEnabled. The CSS image-rendering hint is
   * set once at construction and intentionally left untouched here, so toggling the
   * scale filter at runtime only changes context smoothing.
   */
  private applyScaleFilter(): void {
    this.ctx.imageSmoothingEnabled = this._smoothingOn
  }
}
