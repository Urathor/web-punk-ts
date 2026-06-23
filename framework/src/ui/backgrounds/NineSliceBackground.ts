import type { IRenderer, IRect    } from '@engine/renderer'
import type { Sprite              } from '@engine/animation/Sprite'
import type { UIBackground, Tint, NineSliceInsets } from './UIBackground'
import { computeNineSlice         } from './NineSlice'
import { bakeTint                 } from '../tint'
import type { DrawableImage       } from '../tint'

/** A nine-slice can be built from a {@link Sprite} or a raw canvas/image region. */
export type NineSliceSource = Sprite | { image: DrawableImage; srcRect: IRect }

/**
 * The "SpriteBased" strategy — paints a nine-patch. Zero insets make it a plain
 * stretched image. A tint (sprite sources only) draws a cached, pre-baked tinted/faded
 * copy via the normal `renderer.drawImage`, so the renderer needs no tint support. Raw
 * canvas sources (used by the procedural default theme) ignore tint.
 */
export class NineSliceBackground implements UIBackground {
  private readonly sprite?: Sprite
  private readonly image:   DrawableImage
  private readonly srcRect: IRect

  constructor(source: NineSliceSource, public insets: NineSliceInsets) {
    if ('texture' in source) {
      this.sprite  = source
      this.image   = source.texture.image
      this.srcRect = source.srcRect
    } else {
      this.image   = source.image
      this.srcRect = source.srcRect
    }
  }

  draw(renderer: IRenderer, bounds: IRect, tint?: Tint): void {
    const { image, srcRect } = this.resolve(tint)
    for (const p of computeNineSlice(srcRect, this.insets, bounds)) {
      renderer.drawImage(image, p.src, p.dst)
    }
  }

  /**
   * Reveal a proportional slice of the sprite along one axis (used by the progress-bar
   * `crop` fill mode). A plain blit — no nine-slicing — so the texture is revealed
   * without distortion.
   */
  drawCropped(
    renderer: IRenderer,
    fullRect: IRect,
    ratio:    number,
    axis:     'x' | 'y',
    reversed = false,
    tint?:    Tint,
  ): void {
    const r = ratio < 0 ? 0 : ratio > 1 ? 1 : ratio
    const { image, srcRect } = this.resolve(tint)

    if (axis === 'x') {
      const sw = srcRect.width  * r
      const dw = fullRect.width * r
      if (sw <= 0 || dw <= 0) return
      const sx = reversed ? srcRect.x  + srcRect.width  - sw : srcRect.x
      const dx = reversed ? fullRect.x + fullRect.width - dw : fullRect.x
      renderer.drawImage(
        image,
        { x: sx, y: srcRect.y,  width: sw, height: srcRect.height },
        { x: dx, y: fullRect.y, width: dw, height: fullRect.height },
      )
    } else {
      const sh = srcRect.height  * r
      const dh = fullRect.height * r
      if (sh <= 0 || dh <= 0) return
      const sy = reversed ? srcRect.y  + srcRect.height  - sh : srcRect.y
      const dy = reversed ? fullRect.y + fullRect.height - dh : fullRect.y
      renderer.drawImage(
        image,
        { x: srcRect.x,  y: sy, width: srcRect.width,  height: sh },
        { x: fullRect.x, y: dy, width: fullRect.width, height: dh },
      )
    }
  }

  private resolve(tint?: Tint): { image: DrawableImage; srcRect: IRect } {
    if (tint && this.sprite) return bakeTint(this.sprite, tint)
    return { image: this.image, srcRect: this.srcRect }
  }
}
