import type { Texture } from '@engine/assets/Texture'
import type { Rect    } from '@engine/math'

/** A single drawable region of a texture. Reused by SpriteRenderer and Animator. */
export interface Sprite {
  texture: Texture
  /** Source rectangle within the sprite sheet in pixels. */
  srcRect: Rect
}
