import type { IRenderer } from '@engine/renderer'
import type { UICanvas }  from './UICanvas'
import type { UITheme }   from './UITheme'

/**
 * Public contract for the canvas-based UI system. `UIManager` is the sole
 * implementation; the interface exists so dependents (Engine, IEngine)
 * depend on a stable contract rather than the concrete class.
 */
export interface IUIManager {
  theme: UITheme | null

  add(canvas: UICanvas): UICanvas
  setTheme(theme: UITheme | null): void
  get(name: string): UICanvas | undefined
  remove(name: string): void
  clear(): void

  update(dt: number): void
  render(renderer: IRenderer, interpolation: number): void
}
