import type { IRenderer } from '@engine/renderer'
import { UICanvas        } from './UICanvas'

export class UIManager {
  private canvases: UICanvas[] = []

  add(canvas: UICanvas): UICanvas {
    this.canvases.push(canvas)
    this.canvases.sort((a, b) => a.sortOrder - b.sortOrder)
    return canvas
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
