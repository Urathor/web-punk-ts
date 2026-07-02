import { Vector2 }              from '@engine/math'
import type { IRenderer }       from '@engine/renderer'
import { RenderLayer }          from './RenderLayer'
import type { ICameraController } from './ICameraController'
import type { ICamera }         from './ICamera'
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from '@engine/constants'

/** A rectangular region of the logical screen, in logical pixels. */
export interface Viewport {
  x:      number
  y:      number
  width:  number
  height: number
}

export class Camera implements ICamera {
  position:       Vector2 = new Vector2(0, 0)
  imageSmoothing: boolean = false
  controller:     ICameraController | null = null

  /**
   * Sub-rectangle of the logical screen the world is rendered into, in logical
   * pixels. Defaults to the full default logical resolution so a bare `Camera`
   * is valid without wiring (e.g. in tests). The `Engine` overwrites
   * `width`/`height` from the renderer's logical size during construction.
   *
   * Only `width`/`height` are consumed today (camera-controller centring and
   * clamping). The `x`/`y` offset and clipping become active in a later stage.
   */
  viewport: Viewport = { x: 0, y: 0, width: LOGICAL_WIDTH, height: LOGICAL_HEIGHT }

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

    const vp = this.viewport
    const clipped =
      vp.x !== 0 || vp.y !== 0 ||
      vp.width  !== renderer.logicalWidth ||
      vp.height !== renderer.logicalHeight

    for (const layer of this.layers) {
      if (layer.isUI) {
        // UI renders in full logical space (unclipped, no viewport offset) so it
        // can draw into the viewport margins.
        layer.render(renderer, interpolation)
      } else if (clipped) {
        // Confine the world to the viewport rect and offset it to the viewport
        // origin. Margins outside the rect keep the full-screen clear() colour.
        renderer.pushClip(vp)
        renderer.pushTransform(vp.x - this.position.x, vp.y - this.position.y)
        layer.render(renderer, interpolation)
        renderer.popTransform()
        renderer.popClip()
      } else {
        // Full-screen viewport — keep the no-clip fast path. Translate by the raw
        // float camera position so the canvas computes
        // physical_x = 2*(entity_x − camera_x) as one value. Rounding camera and
        // entity independently causes ±1 logical-pixel jitter; letting the canvas
        // resolve the combined float eliminates it.
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
