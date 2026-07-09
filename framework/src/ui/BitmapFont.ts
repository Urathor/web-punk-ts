import type { Texture     } from '@engine/assets/Texture'
import type { AssetLoader } from '@engine/assets'
import type { IRenderer   } from '@engine/renderer'
import { Rect              } from '@engine/math'
import { bakeTint          } from './tint'

export interface BitmapFontData {
  texture:     Texture
  charWidth:   number
  charHeight:  number
  /** Ordered list of characters present in the sprite sheet, left-to-right, top-to-bottom. */
  chars:       string
  charsPerRow: number
}

export class BitmapFont {
  private readonly data: BitmapFontData

  constructor(data: BitmapFontData) {
    this.data = data
  }

  drawString(renderer: IRenderer, text: string, x: number, y: number, scale = 1, color = '#ffffff'): void {
    const { texture, charWidth, charHeight, chars, charsPerRow } = this.data

    // Resolve source image: bake a tinted copy of the full texture when a non-white
    // colour is requested (the tint overlays the colour onto each glyph's pixels,
    // which works correctly for white-on-transparent bitmap font sheets). The baked
    // canvas is cached by bakeTint so the cost is paid only once per unique colour.
    let sourceImage = texture.image
    if (color !== '#ffffff') {
      const fullSprite = { texture, srcRect: new Rect(0, 0, texture.width, texture.height) }
      sourceImage = bakeTint(fullSprite, { color, strength: 1 }).image as HTMLImageElement
    }

    let cursorX = x
    for (const char of text) {
      const idx = chars.indexOf(char)
      if (idx === -1) { cursorX += charWidth * scale; continue }

      const col     = idx % charsPerRow
      const row     = Math.floor(idx / charsPerRow)
      const srcRect = new Rect(col * charWidth, row * charHeight, charWidth, charHeight)
      const dstRect = new Rect(cursorX, y, charWidth * scale, charHeight * scale)

      renderer.drawImage(sourceImage, srcRect, dstRect)
      cursorX += charWidth * scale
    }
  }

  measureString(text: string, scale = 1): { width: number; height: number } {
    return {
      width:  text.length * this.data.charWidth  * scale,
      height: this.data.charHeight * scale
    }
  }

  /** Load a BitmapFont from a JSON descriptor. The JSON's `texture` field is a URL path. */
  static async load(path: string, assets: AssetLoader): Promise<BitmapFont> {
    const res  = await fetch(path)
    const data = await res.json() as Omit<BitmapFontData, 'texture'> & { texture: string }
    const tex  = await assets.loadTexture(data.texture)
    return new BitmapFont({ ...data, texture: tex })
  }
}
