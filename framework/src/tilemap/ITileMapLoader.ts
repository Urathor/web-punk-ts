import type { TileMap } from './TileMap'

export interface ITileMapLoader {
  /** Returns true if this loader can handle the given path/format. */
  canLoad(path: string): boolean

  /** Async — may need to fetch the file and load tileset images. */
  load(path: string): Promise<TileMap>
}
