import { Vector2 }              from '@engine/math'
import type { IRenderer }       from '@engine/renderer'
import { RenderLayer }          from './RenderLayer'
import type { ICameraController } from './ICameraController'

export class Camera {
  position:       Vector2 = new Vector2(0, 0)
  imageSmoothing: boolean = false
  controller:     ICameraController | null = null

  private layers: RenderLayer[] = []

  // ── Layer management ──────────────────────────────────────────────────────

  addWorldLayer(
    name:     string,
    order:    number,
    renderFn: (r: IRenderer, ip: number) => void
  ): void {
    this.layers.push(new RenderLayer(name, order, false, renderFn))
    this.layers.sort((a, b) => a.order - b.order)
  }

  addUILayer(
    name:     string,
    order:    number,
    renderFn: (r: IRenderer, ip: number) => void
  ): void {
    this.layers.push(new RenderLayer(name, order, true, renderFn))
    this.layers.sort((a, b) => a.order - b.order)
  }

  removeLayer(name: string): void {
    this.layers = this.layers.filter(l => l.name !== name)
  }

  clearLayers(): void {
    this.layers = []
  }

  // ── Update / Render ───────────────────────────────────────────────────────

  update(dt: number): void {
    this.controller?.update(this, dt)
  }

  render(renderer: IRenderer, interpolation: number): void {
    renderer.setImageSmoothing(this.imageSmoothing)

    for (const layer of this.layers) {
      if (layer.isUI) {
        layer.render(renderer, interpolation)
      } else {
        // World-space: translate by the raw float camera position so the canvas
        // computes physical_x = 2*(entity_x − camera_x) as one value.
        // Rounding camera and entity independently causes ±1 logical-pixel jitter;
        // letting the canvas resolve the combined float eliminates it.
        renderer.pushTransform(-this.position.x, -this.position.y)
        layer.render(renderer, interpolation)
        renderer.popTransform()
      }
    }
  }

  toggleImageSmoothing(): void {
    this.imageSmoothing = !this.imageSmoothing
  }
}
