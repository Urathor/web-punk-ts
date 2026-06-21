/**
 * Maps a 4-bit NESW bitmask (0–15) to a replacement tile index.
 *
 * Bitmask bits:  N=8  E=4  S=2  W=1
 *
 * Example: a tile with solid neighbours to the north and east has mask = 8|4 = 12.
 */
export interface AutoTileRuleset {
  /** Global tile IDs (GIDs) in the layer that are candidates for auto-tiling. */
  solidIds: number[]
  /**
   * Maps a bitmask string key ("0"–"15") to the replacement GID.
   * Any bitmask not listed here leaves the tile unchanged.
   */
  rules: Record<string, number>
}
