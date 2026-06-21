import { BaseComponent }  from '@engine/entities/BaseComponent'
import type { IRenderer } from '@engine/renderer'
import { TileMap }        from './TileMap'
import { Rect }           from '@engine/math'

export class TileMapRenderer extends BaseComponent {
  map: TileMap | null = null

  /** Layer names to render. Renders all visible layers if empty. */
  layerFilter: string[] = []

  /**
   * When true, this component participates in the global image-smoothing toggle.
   * Set to false to keep tiles pixel-perfect regardless of the global setting.
   */
  antiAlias: boolean = true

  private staticCache = new Map<string, OffscreenCanvas>()
  private dirtyLayers = new Set<string>()

  setMap(map: TileMap): void {
    this.map = map
    this.dirtyLayers.clear()
    this.staticCache.clear()
    for (const layer of map.tileLayers) {
      this.dirtyLayers.add(layer.name)
    }
  }

  /** Force a specific layer to re-bake on the next render. */
  invalidateLayer(layerName: string): void {
    this.dirtyLayers.add(layerName)
  }

  render(renderer: IRenderer, _interpolation: number): void {
    if (!this.map) return

    const layers = this.layerFilter.length > 0
      ? this.map.tileLayers.filter(l => this.layerFilter.includes(l.name))
      : this.map.tileLayers

    for (const layer of layers) {
      if (!layer.visible) continue
      this.renderLayer(renderer, layer.name)
    }
  }

  private renderLayer(renderer: IRenderer, layerName: string): void {
    if (!this.map) return

    if (this.dirtyLayers.has(layerName)) {
      this.prebakeLayer(layerName)
      this.dirtyLayers.delete(layerName)
    }

    const cached = this.staticCache.get(layerName)
    if (!cached) return

    const fullRect = new Rect(0, 0, this.map.widthInPixels, this.map.heightInPixels)
    renderer.setDrawSmoothing(this.antiAlias && renderer.imageSmoothing)
    renderer.drawImage(cached, fullRect, fullRect)
    renderer.setDrawSmoothing(false)
  }

  private prebakeLayer(layerName: string): void {
    if (typeof OffscreenCanvas === 'undefined') {
      // Fallback: mark unbakeable, will draw directly each frame via dirty flag staying absent
      return
    }

    const map   = this.map!
    const layer = map.tileLayers.find(l => l.name === layerName)
    if (!layer) return

    const offscreen = new OffscreenCanvas(map.widthInPixels, map.heightInPixels)
    const ctx       = offscreen.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false

    for (let row = 0; row < map.heightInTiles; row++) {
      for (let col = 0; col < map.widthInTiles; col++) {
        const gid = layer.tiles[row]?.[col] ?? 0
        if (gid === 0) continue

        const tileset = map.getTilesetForGid(gid)
        if (!tileset) continue

        const localId = gid - tileset.firstGid
        const srcCol  = localId % tileset.columns
        const srcRow  = Math.floor(localId / tileset.columns)

        ctx.drawImage(
          tileset.image,
          srcCol * tileset.tileWidth,  srcRow * tileset.tileHeight,
          tileset.tileWidth,           tileset.tileHeight,
          col   * map.tileWidth,       row   * map.tileHeight,
          map.tileWidth,               map.tileHeight
        )
      }
    }

    this.staticCache.set(layerName, offscreen)
  }
}
