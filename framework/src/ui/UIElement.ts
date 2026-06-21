import { Anchor, resolveAnchor } from './Anchor'
import type { IRenderer        } from '@engine/renderer'
import { Vector2, Rect         } from '@engine/math'

export abstract class UIElement {
  anchor:    Anchor  = Anchor.TopLeft
  offset:    Vector2 = new Vector2(0, 0)
  width:     number  = 0
  height:    number  = 0
  visible:   boolean = true
  sortOrder: number  = 0

  /** Top-left position in logical pixels, derived from anchor + offset. */
  getPosition(): Vector2 {
    return resolveAnchor(this.anchor).add(this.offset)
  }

  /** Bounding rectangle in logical pixels. */
  getBounds(): Rect {
    const pos = this.getPosition()
    return new Rect(pos.x, pos.y, this.width, this.height)
  }

  abstract render(renderer: IRenderer, interpolation: number): void

  /** Called each frame when visible. Override for animations or interaction. */
  update?(_dt: number): void

  /** Called by UICanvas.addElement immediately after the element is added. */
  onAttach?(): void
}
