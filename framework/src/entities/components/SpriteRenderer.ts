import { BaseComponent } from '../BaseComponent'
import { Transform     } from './Transform'
import type { Sprite   } from '@engine/animation/Sprite'
import type { IRenderer } from '@engine/renderer'
import { Rect           } from '@engine/math'

export class SpriteRenderer extends BaseComponent {
  sprite:     Sprite | null = null
  /** Override draw width in logical pixels (null = use srcRect.width). */
  drawWidth:  number | null = null
  /** Override draw height in logical pixels (null = use srcRect.height). */
  drawHeight: number | null = null
  /** Logical render layer name — used by the camera system in Phase 3. */
  layer = 'entities'
  /**
   * When true, this component participates in the global image-smoothing toggle.
   * Set to false to stay pixel-perfect regardless of the global setting (e.g. UI icons).
   */
  antiAlias: boolean = true

  render(renderer: IRenderer, _interpolation: number): void {
    if (!this.sprite) return

    const transform = this.entity.getComponent(Transform)
    if (!transform) return

    const pos = transform.worldPosition
    const w   = this.drawWidth  ?? this.sprite.srcRect.width
    const h   = this.drawHeight ?? this.sprite.srcRect.height

    // Do NOT manually round the draw position. Rounding here and in Camera.render()
    // independently causes ±1 logical-pixel jumps (= ±2 physical pixels at 2× DPR)
    // when the two rounding thresholds are crossed at different frames.
    // Passing the raw float lets the canvas compute 2×(entity_x − camera_x) as
    // one value; in steady-state following that difference is nearly constant → no jitter.
    const dstRect = new Rect(
      pos.x - w / 2,
      pos.y - h / 2,
      w,
      h
    )

    renderer.setDrawSmoothing(this.antiAlias && renderer.imageSmoothing)
    renderer.drawImage(this.sprite.texture.image, this.sprite.srcRect, dstRect)
    renderer.setDrawSmoothing(false)
  }
}
