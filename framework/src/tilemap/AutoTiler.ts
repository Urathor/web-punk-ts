import type { TileLayerData   } from './TileMap'
import type { AutoTileRuleset } from './AutoTileRuleset'

const N = 8
const E = 4
const S = 2
const W = 1

/**
 * Runtime 4-neighbour (cardinal) bitmask auto-tiler.
 *
 * Inspects each solid tile in a layer and replaces it with the variant whose
 * NESW neighbour bitmask matches an entry in the supplied ruleset JSON.
 * The operation is in-place on `layer.tiles` and is intended to be called
 * once during scene load — not every frame.
 */
export class AutoTiler {
  /**
   * Mutates `layer.tiles` in-place.
   *
   * @param layer     The tile layer whose tiles will be replaced.
   * @param mapWidth  Width of the map in tiles (number of columns).
   * @param ruleset   Ruleset JSON describing which tile IDs are solid and what
   *                  bitmask maps to which replacement GID.
   */
  static apply(layer: TileLayerData, mapWidth: number, ruleset: AutoTileRuleset): void {
    const { solidIds, rules } = ruleset
    const solidSet  = new Set(solidIds)
    const mapHeight = layer.tiles.length

    // Snapshot candidate positions before mutating, so later replacements
    // don't affect the bitmask computation of neighbouring tiles.
    const candidates: Array<{ row: number; col: number }> = []
    for (let row = 0; row < mapHeight; row++) {
      const rowData = layer.tiles[row]
      if (!rowData) continue
      for (let col = 0; col < rowData.length; col++) {
        const gid = rowData[col]
        if (gid !== undefined && solidSet.has(gid)) candidates.push({ row, col })
      }
    }

    const isSolid = (col: number, row: number): boolean => {
      if (col < 0 || row < 0 || col >= mapWidth || row >= mapHeight) return false
      return solidSet.has(layer.tiles[row]?.[col] ?? 0)
    }

    for (const { row, col } of candidates) {
      let mask = 0
      if (isSolid(col,     row - 1)) mask |= N
      if (isSolid(col + 1, row    )) mask |= E
      if (isSolid(col,     row + 1)) mask |= S
      if (isSolid(col - 1, row    )) mask |= W

      const replacement = rules[String(mask)]
      if (replacement !== undefined) {
        const rowArr = layer.tiles[row]
        if (rowArr) rowArr[col] = replacement
      }
    }
  }
}
