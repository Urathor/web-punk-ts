import type { ITileMapLoader }                       from '../ITileMapLoader'
import { TileMap }                                   from '../TileMap'
import type { TilesetData, TileLayerData,
              ObjectLayerData }                      from '../TileMap'
import { AssetLoader }                               from '@engine/assets'

export class TiledJsonLoader implements ITileMapLoader {
  constructor(private assets: AssetLoader) {}

  canLoad(path: string): boolean {
    return path.endsWith('.tmj') || path.endsWith('.json')
  }

  async load(path: string): Promise<TileMap> {
    const response = await fetch(path)
    if (!response.ok) {
      throw new Error(`TiledJsonLoader: failed to fetch "${path}" (${response.status})`)
    }
    const data = await response.json() as TiledJson

    const baseDir     = path.substring(0, path.lastIndexOf('/') + 1)
    const tilesets    = await this.parseTilesets(data.tilesets, baseDir)
    const tileLayers  = this.parseTileLayers(data.layers, data.width)
    const objectLayers= this.parseObjectLayers(data.layers)

    return new TileMap(
      data.width, data.height,
      data.tilewidth, data.tileheight,
      tilesets, tileLayers, objectLayers,
      this.parseProperties(data.properties ?? [])
    )
  }

  private async parseTilesets(
    raw: TiledTileset[],
    baseDir: string
  ): Promise<TilesetData[]> {
    return Promise.all(raw.map(async (ts) => {
      const imagePath = this.resolveRelativePath(baseDir, ts.image)
      const texture   = await this.assets.loadTexture(imagePath)

      const tileProperties = new Map<number, Record<string, unknown>>()
      for (const tile of ts.tiles ?? []) {
        tileProperties.set(tile.id, this.parseProperties(tile.properties ?? []))
      }

      return {
        name:       ts.name,
        image:      texture.image,
        tileWidth:  ts.tilewidth,
        tileHeight: ts.tileheight,
        columns:    ts.columns,
        firstGid:   ts.firstgid,
        tileCount:  ts.tilecount,
        tileProperties
      } satisfies TilesetData
    }))
  }

  private parseTileLayers(layers: TiledLayer[], mapWidth: number): TileLayerData[] {
    return layers
      .filter((l): l is TiledTileLayer => l.type === 'tilelayer')
      .map(l => {
        const props = this.parseProperties(l.properties ?? [])
        return {
          name:       l.name,
          tiles:      this.flatTo2D(l.data, mapWidth),
          visible:    l.visible,
          opacity:    l.opacity,
          collidable: props['collidable'] === true,
          properties: props
        }
      })
  }

  private parseObjectLayers(layers: TiledLayer[]): ObjectLayerData[] {
    return layers
      .filter((l): l is TiledObjectLayer => l.type === 'objectgroup')
      .map(l => ({
        name:    l.name,
        objects: l.objects.map(o => ({
          id:         o.id,
          name:       o.name,
          type:       o.type,
          x:          o.x,
          y:          o.y,
          width:      o.width,
          height:     o.height,
          properties: this.parseProperties(o.properties ?? [])
        }))
      }))
  }

  private flatTo2D(flat: number[], width: number): number[][] {
    const rows: number[][] = []
    for (let i = 0; i < flat.length; i += width) {
      rows.push(flat.slice(i, i + width))
    }
    return rows
  }

  private parseProperties(props: TiledProperty[]): Record<string, unknown> {
    return Object.fromEntries(props.map(p => [p.name, p.value]))
  }

  /** Resolves a path like `../sprites/foo.png` relative to a base directory URL. */
  private resolveRelativePath(base: string, relative: string): string {
    // Filter out empty segments from base (handles trailing slash)
    const parts = base.split('/').filter(p => p !== '')
    for (const seg of relative.split('/')) {
      if (seg === '..') { parts.pop() }
      else if (seg !== '.') { parts.push(seg) }
    }
    return '/' + parts.join('/')
  }
}

// ── Tiled JSON type stubs ──────────────────────────────────────────────────────
interface TiledJson {
  width: number; height: number
  tilewidth: number; tileheight: number
  tilesets: TiledTileset[]
  layers: TiledLayer[]
  properties?: TiledProperty[]
}
interface TiledTileset {
  name: string; image: string
  tilewidth: number; tileheight: number
  columns: number; firstgid: number; tilecount: number
  tiles?: { id: number; properties?: TiledProperty[] }[]
}
type TiledLayer = TiledTileLayer | TiledObjectLayer
interface TiledTileLayer {
  type: 'tilelayer'; name: string
  data: number[]; visible: boolean; opacity: number
  properties?: TiledProperty[]
}
interface TiledObjectLayer {
  type: 'objectgroup'; name: string
  objects: TiledObject[]
  properties?: TiledProperty[]
}
interface TiledObject {
  id: number; name: string; type: string
  x: number; y: number; width: number; height: number
  properties?: TiledProperty[]
}
interface TiledProperty { name: string; type: string; value: unknown }
