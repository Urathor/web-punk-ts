/**
 * Public contract for namespaced key/value persistence. `SaveManager` is the
 * sole implementation; the interface exists so dependents (Engine, IEngine)
 * depend on a stable contract rather than the concrete class.
 *
 * Not to be confused with `ISaveProvider`, the swappable storage backend that
 * `SaveManager` wraps (e.g. `LocalStorageSaveProvider` vs `MockSaveProvider`).
 */
import type { IDebugger } from '@engine/debug'

export interface ISaveManager {
  setDebugger(dbg: IDebugger | null): void

  save(key: string, data: unknown): Promise<void>
  load<T>(key: string, defaultValue?: T): Promise<T | null>
  delete(key: string): Promise<void>
  has(key: string): Promise<boolean>
  clear(): Promise<void>

  /** Returns a SaveManager scoped to a different namespace (e.g. a save slot). */
  slot(slotName: string): ISaveManager
}
