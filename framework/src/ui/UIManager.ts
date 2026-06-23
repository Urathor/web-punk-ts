import type { IRenderer } from '@engine/renderer'
import { UICanvas        } from './UICanvas'
import type { UITheme    } from './UITheme'

export class UIManager {
  private canvases: UICanvas[] = []

  /** Global default theme. Canvases without an explicit theme inherit it. */
  theme: UITheme | null = null

  add(canvas: UICanvas): UICanvas {
    this.canvases.push(canvas)
    this.canvases.sort((a, b) => a.sortOrder - b.sortOrder)
    if (this.theme) canvas.inheritTheme(this.theme)
    return canvas
  }

  /** Set the global default theme; propagates to canvases with no explicit theme. */
  setTheme(theme: UITheme | null): void {
    this.theme = theme
    for (const canvas of this.canvases) canvas.inheritTheme(theme)
  }

  get(name: string): UICanvas | undefined {
    return this.canvases.find(c => c.name === name)
  }

  remove(name: string): void {
    this.canvases = this.canvases.filter(c => c.name !== name)
  }

  /** Remove all canvases (e.g. when a scene exits). */
  clear(): void {
    this.canvases = []
  }

  update(dt: number): void {
    for (const canvas of this.canvases) canvas.update(dt)
  }

  render(renderer: IRenderer, interpolation: number): void {
    for (const canvas of this.canvases) canvas.render(renderer, interpolation)
  }
}
