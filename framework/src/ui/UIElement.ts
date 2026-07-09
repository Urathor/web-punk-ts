import { Anchor, resolveAnchor, resolveAnchorInRect } from './Anchor'
import type { IRenderer        } from '@engine/renderer'
import type { UIBackground     } from './backgrounds'
import type { UITheme          } from './UITheme'
import { Vector2, Rect         } from '@engine/math'

export abstract class UIElement {
  anchor:    Anchor  = Anchor.TopLeft
  offset:    Vector2 = new Vector2(0, 0)
  width:     number  = 0
  height:    number  = 0
  visible:   boolean = true
  sortOrder: number  = 0

  /**
   * Optional sprite/colour background strategy. When `null`, the widget renders with
   * its own colour fields (the default look). Assigned by a `UITheme` or set directly;
   * an explicit value always wins over the theme.
   */
  background: UIBackground | null = null

  /** When `false`, a `UITheme` will not assign a background to this element. */
  themed: boolean = true

  /** Which named skin (`UITheme.skins[skinName]`) this element resolves its themed
   *  art from. Defaults to `'default'` — the theme's baseline skin. Lets one theme
   *  hold multiple interchangeable looks (e.g. `'default'`, `'wood'`) that different
   *  widgets can each opt into by name. */
  skinName: string = 'default'

  /**
   * The `UITheme` most recently applied to this element (set by `UITheme.applyTo`),
   * or `null` if none has been. Tracked so {@link addChild} can propagate an
   * already-applied theme to a newly attached child automatically — you shouldn't
   * need to read or set this directly.
   */
  appliedTheme: UITheme | null = null

  /**
   * The element this was attached to via {@link addChild}, or `null` for a top-level
   * element (added directly to a `UICanvas`). When set, `anchor`/`offset` resolve
   * relative to the parent's own bounds instead of the whole logical canvas — moving
   * or resizing the parent moves its entire subtree with it.
   */
  parent: UIElement | null = null

  private _children: UIElement[] = []

  /** Child elements attached via {@link addChild}, sorted by `sortOrder`. */
  get children(): readonly UIElement[] {
    return this._children
  }

  /**
   * Attach `child` to this element so it updates/renders as part of this element's
   * subtree (see `UICanvas`) and anchors relative to this element's bounds. Any widget
   * can hold children — `UIPanel` is the common case for grouping widgets together.
   * Detaches `child` from its previous parent first, if any. If a theme is already
   * applied to this element, it is propagated to `child` (and its own subtree)
   * immediately, so children can be added before or after the parent joins a themed
   * canvas.
   */
  addChild<T extends UIElement>(child: T): T {
    if ((child as UIElement) === this) throw new Error('UIElement cannot be its own child')
    child.parent?.removeChild(child)
    child.parent = this
    this._children.push(child)
    this._children.sort((a, b) => a.sortOrder - b.sortOrder)
    child.onAttach?.()
    this.appliedTheme?.applyToSubtree(child)
    return child
  }

  /** Detach `child` from this element. No-op if it isn't currently a child. */
  removeChild(child: UIElement): void {
    if (child.parent !== this) return
    this._children = this._children.filter(c => c !== child)
    child.parent = null
  }

  /** Top-left position in logical pixels, derived from anchor + offset — resolved
   *  relative to `parent`'s bounds, or the whole logical canvas at the root. */
  getPosition(): Vector2 {
    const anchorPoint = this.parent
      ? resolveAnchorInRect(this.anchor, this.parent.getBounds())
      : resolveAnchor(this.anchor)
    return anchorPoint.add(this.offset)
  }

  /** Bounding rectangle in logical pixels. */
  getBounds(): Rect {
    const pos = this.getPosition()
    return new Rect(pos.x, pos.y, this.width, this.height)
  }

  abstract render(renderer: IRenderer, interpolation: number): void

  /** Called each frame when visible. Override for animations or interaction. */
  update?(_dt: number): void

  /** Called by UICanvas.addElement (or addChild) immediately after the element is
   *  attached. */
  onAttach?(): void
}
