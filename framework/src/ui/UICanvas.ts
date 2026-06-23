import type { IRenderer } from '@engine/renderer'
import type { UIElement } from './UIElement'
import type { UITheme   } from './UITheme'

export class UICanvas {
  readonly name: string
  visible:       boolean = true
  sortOrder:     number  = 0
  theme:         UITheme | null = null

  private elements: UIElement[] = []
  private _explicitTheme = false

  constructor(name: string, sortOrder = 0) {
    this.name      = name
    this.sortOrder = sortOrder
  }

  /** Set an explicit per-canvas theme. Overrides any manager default and re-applies to
   *  existing children. */
  setTheme(theme: UITheme | null): void {
    this._explicitTheme = true
    this.applyTheme(theme)
  }

  /** Called by {@link UIManager}; applies the global default unless a theme was set
   *  explicitly on this canvas. */
  inheritTheme(theme: UITheme | null): void {
    if (this._explicitTheme) return
    this.applyTheme(theme)
  }

  private applyTheme(theme: UITheme | null): void {
    this.theme = theme
    if (theme) for (const el of this.elements) theme.applyTo(el)
  }

  addElement<T extends UIElement>(element: T): T {
    this.elements.push(element)
    this.elements.sort((a, b) => a.sortOrder - b.sortOrder)
    element.onAttach?.()
    this.theme?.applyTo(element)
    return element
  }

  removeElement(element: UIElement): void {
    this.elements = this.elements.filter(e => e !== element)
  }

  update(dt: number): void {
    if (!this.visible) return
    for (const el of this.elements) {
      if (el.visible) el.update?.(dt)
    }
  }

  render(renderer: IRenderer, interpolation: number): void {
    if (!this.visible) return
    renderer.setDrawSmoothing(this.theme?.smoothing ?? false)
    for (const el of this.elements) {
      if (el.visible) el.render(renderer, interpolation)
    }
  }
}
