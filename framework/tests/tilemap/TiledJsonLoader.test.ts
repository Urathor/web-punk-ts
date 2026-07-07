import { TiledJsonLoader } from '@engine/tilemap'
import { MockAssetLoader } from '../mocks/MockAssetLoader'

function mockFetchJson(data: unknown, ok = true): void {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 404,
    json: () => Promise.resolve(data),
  }))
}

const SAMPLE_MAP = {
  width: 2, height: 2, tilewidth: 16, tileheight: 16,
  tilesets: [
    { name: 'tiles', image: 'tiles.png', tilewidth: 16, tileheight: 16, columns: 4, firstgid: 1, tilecount: 8 },
  ],
  layers: [
    {
      type: 'tilelayer', name: 'ground',
      data: [1, 0, 0, 2],
      visible: true, opacity: 1,
      properties: [{ name: 'collidable', type: 'bool', value: true }],
    },
    {
      type: 'tilelayer', name: 'decor',
      data: [0, 3, 0, 0],
      visible: true, opacity: 1,
      properties: [],
    },
    {
      type: 'objectgroup', name: 'spawns',
      objects: [
        { id: 1, name: 'player-start', type: 'spawn', x: 16, y: 32, width: 16, height: 16, properties: [] },
      ],
    },
  ],
  properties: [{ name: 'theme', type: 'string', value: 'cave' }],
}

describe('TiledJsonLoader', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('canLoad accepts .tmj/.json paths only', () => {
    const loader = new TiledJsonLoader(new MockAssetLoader())
    expect(loader.canLoad('map.tmj')).toBe(true)
    expect(loader.canLoad('map.json')).toBe(true)
    expect(loader.canLoad('map.png')).toBe(false)
  })

  it('parses tile layers into a 2D row-major grid and flags the collidable one', async () => {
    mockFetchJson(SAMPLE_MAP)
    const map = await new TiledJsonLoader(new MockAssetLoader()).load('/maps/level1.tmj')

    expect(map.widthInTiles).toBe(2)
    expect(map.heightInTiles).toBe(2)
    expect(map.getTileGid('ground', 0, 0)).toBe(1)
    expect(map.getTileGid('ground', 1, 1)).toBe(2)
    expect(map.getTileGid('decor',  1, 0)).toBe(3)
    expect(map.isTileCollidableAt(0, 0)).toBe(true)   // ground layer is collidable
    expect(map.isTileCollidableAt(0, 1)).toBe(false)  // empty on the collidable layer
  })

  it('parses object layers with their properties', async () => {
    mockFetchJson(SAMPLE_MAP)
    const map = await new TiledJsonLoader(new MockAssetLoader()).load('/maps/level1.tmj')
    expect(map.objectLayers).toHaveLength(1)
    expect(map.objectLayers[0]!.objects[0]).toMatchObject({ name: 'player-start', x: 16, y: 32 })
  })

  it('parses map-level and tileset properties', async () => {
    mockFetchJson(SAMPLE_MAP)
    const map = await new TiledJsonLoader(new MockAssetLoader()).load('/maps/level1.tmj')
    expect(map.properties.theme).toBe('cave')
  })

  it('resolves tileset image paths relative to the map file and loads them via the injected asset loader', async () => {
    mockFetchJson(SAMPLE_MAP)
    const assets = new MockAssetLoader()
    await new TiledJsonLoader(assets).load('/maps/level1.tmj')
    expect(assets.isLoaded('/maps/tiles.png')).toBe(true)
  })

  it('throws when the fetch response is not ok', async () => {
    mockFetchJson({}, false)
    const loader = new TiledJsonLoader(new MockAssetLoader())
    await expect(loader.load('/maps/missing.tmj')).rejects.toThrow(/404/)
  })
})
