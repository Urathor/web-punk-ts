export interface ISaveProvider {
  /** Serialise `data` to JSON and persist under `key`. */
  save(key: string, data: unknown): Promise<void>
  /** Load and deserialise the value at `key`. Returns `null` if not found. */
  load<T>(key: string): Promise<T | null>
  /** Delete the value at `key`. No-op if key does not exist. */
  delete(key: string): Promise<void>
  /** Delete all saved values that belong to this provider. */
  clear(): Promise<void>
  /** Returns `true` if a value exists for `key`. */
  has(key: string): Promise<boolean>
}
