import type { IRenderer } from '@engine/renderer'
import type { UIElement } from './UIElement'

export class UICanvas {
  readonly name: string
  visible:       boolean = true
  sortOrder:     number  = 0

  private elements: UIElement[] = []

  constructor(name: string, sortOrder = 0) {
    this.name      = name
    this.sortOrder = sortOrder
  }

  addElement<T extends UIElement>(element: T): T {
    this.elements.push(element)
    this.elements.sort((a, b) => a.sortOrder - b.sortOrder)
    element.onAttach?.()
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
    for (const el of this.elements) {
      if (el.visible) el.render(renderer, interpolation)
    }
  }
}
