import { Vector2 } from '@engine/math'

export interface TilesetData {
  name:       string
  image:      HTMLImageElement
  tileWidth:  number
  tileHeight: number
  columns:    number
  firstGid:   number
  tileCount:  number
  /** Per-tile properties keyed by local tile ID (0-based). */
  tileProperties: Map<number, Record<string, unknown>>
}

export interface TileLayerData {
  name:       string
  /** Row-major 2D array of global tile IDs. 0 means empty. */
  tiles:      number[][]
  visible:    boolean
  opacity:    number
  /** When true, any non-zero tile in this layer blocks movement. */
  collidable: boolean
  properties: Record<string, unknown>
}

export interface ObjectLayerData {
  name:    string
  objects: TileObject[]
}

export interface TileObject {
  id:         number
  name:       string
  type:       string
  x:          number
  y:          number
  width:      number
  height:     number
  properties: Record<string, unknown>
}

export class TileMap {
  constructor(
    readonly widthInTiles:  number,
    readonly heightInTiles: number,
    readonly tileWidth:     number,
    readonly tileHeight:    number,
    readonly tilesets:      TilesetData[],
    readonly tileLayers:    TileLayerData[],
    readonly objectLayers:  ObjectLayerData[],
    readonly properties:    Record<string, unknown> = {}
  ) {}

  get widthInPixels():  number { return this.widthInTiles  * this.tileWidth  }
  get heightInPixels(): number { return this.heightInTiles * this.tileHeight }

  /** Returns the global tile ID at (col, row), or 0 for empty/out-of-bounds. */
  getTileGid(layerName: string, col: number, row: number): number {
    const layer = this.tileLayers.find(l => l.name === layerName)
    if (!layer) return 0
    return layer.tiles[row]?.[col] ?? 0
  }

  /** Returns true if the tile at grid (col, row) is collidable on any collidable layer. */
  isTileCollidableAt(col: number, row: number): boolean {
    for (const layer of this.tileLayers) {
      if (!layer.collidable) continue
      const gid = layer.tiles[row]?.[col] ?? 0
      if (gid !== 0) return true
    }
    return false
  }

  /** Returns true if the tile at world position (x, y) is collidable. */
  isCollidable(worldX: number, worldY: number): boolean {
    return this.isTileCollidableAt(
      Math.floor(worldX / this.tileWidth),
      Math.floor(worldY / this.tileHeight)
    )
  }

  /** @deprecated Use isCollidable() — checks per-layer collidable flag instead of tile properties. */
  isSolid(worldX: number, worldY: number): boolean {
    return this.isCollidable(worldX, worldY)
  }

  getTilesetForGid(gid: number): TilesetData | undefined {
    return [...this.tilesets]
      .reverse()
      .find(ts => gid >= ts.firstGid)
  }

  worldToTile(worldX: number, worldY: number): { col: number; row: number } {
    return {
      col: Math.floor(worldX / this.tileWidth),
      row: Math.floor(worldY / this.tileHeight)
    }
  }

  tileToWorld(col: number, row: number): Vector2 {
    return new Vector2(col * this.tileWidth, row * this.tileHeight)
  }
}
