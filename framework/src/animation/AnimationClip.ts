import type { Sprite } from './Sprite'

/**
 * Animation data JSON format (produced by the animation tool, parsed by AnimationClipLoader):
 * {
 *   "texture": "/sprites/player.png",
 *   "tileWidth":  16,          // pixel width of one frame
 *   "tileHeight": 16,          // pixel height of one frame
 *   "defaultLoop": true,
 *   "clips": {
 *     "idle":   [{ "col": 0, "row": 0, "duration": 200 }],
 *     "walk":   [{ "col": 1, "row": 0, "duration": 100 },
 *                { "col": 2, "row": 0, "duration": 100 }],
 *     "attack": [{ "col": 3, "row": 0, "duration": 80, "loop": false }]
 *   }
 * }
 * srcRect is derived at load time: x = col * tileWidth, y = row * tileHeight.
 */

export interface AnimationFrame {
  sprite:   Sprite
  /** Duration this frame is shown, in milliseconds. */
  duration: number
}

export interface AnimationClip {
  name:   string
  frames: AnimationFrame[]
  loop:   boolean
}
