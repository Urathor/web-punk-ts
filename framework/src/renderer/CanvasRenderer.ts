import type { IRenderer, IPoint, IRect, TextStyle } from './IRenderer'
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from '@engine/constants'

export class CanvasRenderer implements IRenderer {
  readonly logicalWidth  = LOGICAL_WIDTH
  readonly logicalHeight = LOGICAL_HEIGHT

  private readonly canvas: HTMLCanvasElement
  private readonly ctx:    CanvasRenderingContext2D

  private _imageSmoothing = false
  get imageSmoothing(): boolean { return this._imageSmoothing }

  // Draw-call counter (dev builds only)
  private _drawCalls     = 0
  private _drawCallTimer = 0
  private _drawCallsLast = 0

  /** Last frame's draw-call count (updated each second). Only meaningful in DEV builds. */
  get drawCallsLastFrame(): number { return this._drawCallsLast }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('CanvasRenderer: failed to get 2D context')
    this.ctx = ctx
    this.setupScaling()
    window.addEventListener('resize', () => this.setupScaling())
  }

  private setupScaling(): void {
    // Round DPR to nearest integer so all math stays clean (1.5 → 2, 1.25 → 1, etc.)
    const dpr    = Math.max(1, Math.round(window.devicePixelRatio ?? 1))
    const scaleX = window.innerWidth  / this.logicalWidth
    const scaleY = window.innerHeight / this.logicalHeight

    // Integer CSS scale: snaps to the largest whole multiple that fits the window.
    // This prevents sub-pixel CSS interpolation artifacts on pixel art.
    const cssScale   = Math.max(1, Math.floor(Math.min(scaleX, scaleY)))

    // Physical scale: combine CSS integer scale with device pixel ratio.
    // Guarantees every logical pixel maps to exactly (cssScale × dpr)² physical pixels.
    const pixelScale = cssScale * dpr

    // CSS display size — centred by flex layout in style.css
    const cssW = this.logicalWidth  * cssScale
    const cssH = this.logicalHeight * cssScale

    // Canvas pixel buffer at full physical resolution for crisp HiDPI rendering
    this.canvas.width  = this.logicalWidth  * pixelScale
    this.canvas.height = this.logicalHeight * pixelScale
    this.canvas.style.width  = `${cssW}px`
    this.canvas.style.height = `${cssH}px`
    this.canvas.style.imageRendering = 'pixelated'

    // Bake the pixel scale into the context transform.
    // All draw calls use logical coordinates (0–320, 0–180); this handles the upscale.
    this.ctx.setTransform(pixelScale, 0, 0, pixelScale, 0, 0)
    this.ctx.imageSmoothingEnabled = false
  }

  clear(color = '#000000'): void {
    if (import.meta.env.DEV) {
      // Treat clear() as a frame boundary — report last frame's draw-call count
      this._drawCallTimer += 16.67  // approximate; good enough for console logging
      if (this._drawCallTimer >= 1000) {
        this._drawCallsLast = Math.round(this._drawCalls * 16.67)
        this._drawCalls     = 0
        this._drawCallTimer -= 1000
        // Uncomment to log draw calls per frame to the console:
        // console.debug(`[CanvasRenderer] ~${this._drawCallsLast} draw calls/frame`)
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
    if (import.meta.env.DEV) { this._drawCalls++ }
    this.ctx.drawImage(
      image,
      srcRect.x, srcRect.y, srcRect.width, srcRect.height,
      dstRect.x, dstRect.y, dstRect.width, dstRect.height
    )
  }

  drawRect(rect: IRect, color: string, fill = true): void {
    if (fill) {
      this.ctx.fillStyle = color
      this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
    } else {
      this.ctx.strokeStyle = color
      this.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
    }
  }

  drawLine(from: IPoint, to: IPoint, color: string, lineWidth = 1): void {
    this.ctx.strokeStyle = color
    this.ctx.lineWidth   = lineWidth
    this.ctx.beginPath()
    this.ctx.moveTo(from.x, from.y)
    this.ctx.lineTo(to.x,   to.y)
    this.ctx.stroke()
  }

  drawText(text: string, position: IPoint, style: TextStyle): void {
    this.ctx.fillStyle = style.color
    this.ctx.font      = `${style.size}px ${style.font ?? 'monospace'}`
    this.ctx.fillText(text, position.x, position.y)
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
    // restore() resets imageSmoothingEnabled to the saved value — keep it off
    this.ctx.imageSmoothingEnabled = false
  }

  setImageSmoothing(enabled: boolean): void {
    this._imageSmoothing = enabled
    this.ctx.imageSmoothingEnabled = enabled
    this.canvas.style.imageRendering = enabled ? 'auto' : 'pixelated'
  }

  /** Change ctx.imageSmoothingEnabled for one draw call only. Does not touch CSS. */
  setDrawSmoothing(enabled: boolean): void {
    this.ctx.imageSmoothingEnabled = enabled
  }
}
