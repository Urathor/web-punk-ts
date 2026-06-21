import { Rect   } from '@engine/math'
import type { Texture } from '@engine/assets/Texture'
import type { Sprite  } from './Sprite'

/**
 * Wraps a sprite-sheet texture so frames can be referenced by zero-based
 * column and row rather than raw pixel rectangles.
 *
 * @example
 * const sheet = new SpriteSheet(texture, 16)           // square tiles
 * const sheet = new SpriteSheet(texture, 16, 24)       // rectangular tiles
 *
 * sr.sprite        = sheet.sprite(3, 0)                // single frame
 * const frames     = sheet.row(0, 4)                   // first 4 frames of row 0
 */
export class SpriteSheet {
  constructor(
    readonly texture:    Texture,
    readonly tileWidth:  number,
    readonly tileHeight: number = tileWidth,
  ) {}

  /** Returns a {@link Sprite} at the given zero-based column and row. */
  sprite(col: number, row: number): Sprite {
    return {
      texture:  this.texture,
      srcRect:  new Rect(
        col * this.tileWidth,
        row * this.tileHeight,
        this.tileWidth,
        this.tileHeight,
      ),
    }
  }

  /**
   * Returns an array of sprites spanning `count` columns starting at `startCol`
   * on the given row.  Useful for building animation frame arrays.
   */
  row(rowIndex: number, startCol: number, count: number): Sprite[] {
    return Array.from({ length: count }, (_, i) => this.sprite(startCol + i, rowIndex))
  }
}
