import { UIElement            } from '../UIElement'
import type { IRenderer       } from '@engine/renderer'
import type { Sprite          } from '@engine/animation/Sprite'
import { computeNineSlice      } from '../backgrounds'
import type { NineSliceInsets } from '../backgrounds'
import { Rect                 } from '@engine/math'

export class UIImage extends UIElement {
  sprite: Sprite | null = null
  /** When set, the image is drawn as a nine-slice so it scales without distortion. */
  insets: NineSliceInsets | null = null

  render(renderer: IRenderer, _interpolation: number): void {
    if (!this.sprite) return
    const pos = this.getPosition()
    const dst = new Rect(
      pos.x, pos.y,
      this.width  || this.sprite.srcRect.width,
      this.height || this.sprite.srcRect.height
    )
    if (this.insets) {
      for (const p of computeNineSlice(this.sprite.srcRect, this.insets, dst)) {
        renderer.drawImage(this.sprite.texture.image, p.src, p.dst)
      }
    } else {
      renderer.drawImage(this.sprite.texture.image, this.sprite.srcRect, dst)
    }
  }
}
