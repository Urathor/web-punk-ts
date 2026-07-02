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
    if (theme) for (const el of this.elements) theme.applyToSubtree(el)
  }

  addElement<T extends UIElement>(element: T): T {
    this.elements.push(element)
    this.elements.sort((a, b) => a.sortOrder - b.sortOrder)
    element.onAttach?.()
    if (this.theme) this.theme.applyToSubtree(element)
    return element
  }

  removeElement(element: UIElement): void {
    this.elements = this.elements.filter(e => e !== element)
  }

  update(dt: number): void {
    if (!this.visible) return
    for (const el of this.elements) this.updateSubtree(el, dt)
  }

  private updateSubtree(el: UIElement, dt: number): void {
    if (!el.visible) return
    el.update?.(dt)
    for (const child of el.children) this.updateSubtree(child, dt)
  }

  render(renderer: IRenderer, interpolation: number): void {
    if (!this.visible) return
    renderer.setDrawSmoothing(this.theme?.smoothing ?? false)
    for (const el of this.elements) this.renderSubtree(el, renderer, interpolation)
  }

  private renderSubtree(el: UIElement, renderer: IRenderer, interpolation: number): void {
    if (!el.visible) return
    el.render(renderer, interpolation)
    for (const child of el.children) this.renderSubtree(child, renderer, interpolation)
  }
}
