import type { IRenderer } from '@engine/renderer'

export interface IRenderLayer {
  readonly name:  string
  /** True = rendered in screen space (no camera transform). */
  readonly isUI:  boolean
  /** Layers with lower order render first (drawn beneath). */
  readonly order: number
  render(renderer: IRenderer, interpolation: number): void
}

export class RenderLayer implements IRenderLayer {
  readonly name:  string
  readonly isUI:  boolean
  readonly order: number

  private readonly _renderFn: (renderer: IRenderer, interpolation: number) => void

  constructor(
    name:     string,
    order:    number,
    isUI:     boolean,
    renderFn: (renderer: IRenderer, interpolation: number) => void
  ) {
    this.name     = name
    this.order    = order
    this.isUI     = isUI
    this._renderFn = renderFn
  }

  render(renderer: IRenderer, interpolation: number): void {
    this._renderFn(renderer, interpolation)
  }
}
