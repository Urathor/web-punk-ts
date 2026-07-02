import type { Vector2 }            from '@engine/math'
import type { IRenderer }          from '@engine/renderer'
import type { Viewport }           from './Camera'
import type { ICameraController }  from './ICameraController'

/**
 * Public contract for the scene camera: layer management, viewport, and the
 * render/update lifecycle. `Camera` is the sole implementation today; the
 * interface exists so `Engine`/`IEngine` and camera controllers depend on a
 * stable contract rather than the concrete class.
 */
export interface ICamera {
  position:        Vector2
  imageSmoothing:  boolean
  controller:      ICameraController | null
  viewport:        Viewport

  addWorldLayer(name: string, order: number, renderFn: (r: IRenderer, ip: number) => void): void
  addUILayer(name: string, order: number, renderFn: (r: IRenderer, ip: number) => void): void
  removeLayer(name: string): void
  clearLayers(): void

  update(dt: number): void
  render(renderer: IRenderer, interpolation: number): void
  toggleImageSmoothing(): void
}
