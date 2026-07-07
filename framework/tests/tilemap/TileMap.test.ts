import { TileMap } from '@engine/tilemap'
import type { TilesetData, TileLayerData, ObjectLayerData } from '@engine/tilemap'

function makeTileset(name: string, firstGid: number): TilesetData {
  return {
    name, image: {} as HTMLImageElement,
    tileWidth: 16, tileHeight: 16, columns: 4, firstGid, tileCount: 8,
    tileProperties: new Map(),
  }
}

function makeTileLayer(name: string, tiles: number[][], collidable = false): TileLayerData {
  return { name, tiles, visible: true, opacity: 1, collidable, properties: {} }
}

describe('TileMap', () => {
  const ground = makeTileLayer('ground', [[1, 0], [0, 2]], true)
  const decor  = makeTileLayer('decor',  [[0, 3], [0, 0]], false)
  const objectLayers: ObjectLayerData[] = [{ name: 'spawns', objects: [] }]

  function makeMap(): TileMap {
    return new TileMap(2, 2, 16, 16, [makeTileset('tiles', 1)], [ground, decor], objectLayers)
  }

  it('widthInPixels/heightInPixels derive from tile counts and tile size', () => {
    const map = makeMap()
    expect(map.widthInPixels).toBe(32)
    expect(map.heightInPixels).toBe(32)
  })

  it('getTileGid returns the gid at (col, row), 0 for empty/unknown layer/out-of-bounds', () => {
    const map = makeMap()
    expect(map.getTileGid('ground', 0, 0)).toBe(1)
    expect(map.getTileGid('ground', 1, 1)).toBe(2)
    expect(map.getTileGid('ground', 1, 0)).toBe(0)
    expect(map.getTileGid('nope',   0, 0)).toBe(0)
    expect(map.getTileGid('ground', 99, 99)).toBe(0)
  })

  it('isTileCollidableAt only considers layers flagged collidable', () => {
    const map = makeMap()
    expect(map.isTileCollidableAt(0, 0)).toBe(true)   // ground[0][0] = 1, collidable
    expect(map.isTileCollidableAt(1, 0)).toBe(false)  // decor[0][1] = 3 but decor isn't collidable
    expect(map.isTileCollidableAt(0, 1)).toBe(false)  // empty on every layer
  })

  it('isCollidable/isSolid convert world pixels to a tile lookup', () => {
    const map = makeMap()
    expect(map.isCollidable(0, 0)).toBe(true)     // world (0,0) → tile (0,0)
    expect(map.isSolid(0, 0)).toBe(true)          // deprecated alias, same behaviour
    expect(map.isCollidable(5, 20)).toBe(false)   // world (5,20) → tile (0,1), empty
  })

  it('getTilesetForGid picks the tileset with the highest firstGid ≤ gid', () => {
    const map = new TileMap(2, 2, 16, 16, [makeTileset('a', 1), makeTileset('b', 9)], [ground], [])
    expect(map.getTilesetForGid(1)?.name).toBe('a')
    expect(map.getTilesetForGid(8)?.name).toBe('a')
    expect(map.getTilesetForGid(9)?.name).toBe('b')
    expect(map.getTilesetForGid(20)?.name).toBe('b')
  })

  it('worldToTile / tileToWorld round-trip through tile coordinates', () => {
    const map = makeMap()
    expect(map.worldToTile(17, 33)).toEqual({ col: 1, row: 2 })
    expect(map.tileToWorld(1, 2)).toMatchObject({ x: 16, y: 32 })
  })
})
