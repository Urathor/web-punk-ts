import { UIElement          } from '../UIElement'
import type { IRenderer     } from '@engine/renderer'
import type { Sprite        } from '@engine/animation/Sprite'
import { Rect               } from '@engine/math'

export class UIImage extends UIElement {
  sprite: Sprite | null = null

  render(renderer: IRenderer, _interpolation: number): void {
    if (!this.sprite) return
    const pos = this.getPosition()
    const dst = new Rect(
      pos.x, pos.y,
      this.width  || this.sprite.srcRect.width,
      this.height || this.sprite.srcRect.height
    )
    renderer.drawImage(this.sprite.texture.image, this.sprite.srcRect, dst)
  }
}
