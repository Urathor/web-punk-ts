import type { ISaveProvider } from '@engine/save'

export class MockSaveProvider implements ISaveProvider {
  private store = new Map<string, string>()

  async save(key: string, data: unknown):  Promise<void>        { this.store.set(key, JSON.stringify(data)) }
  async load<T>(key: string):              Promise<T | null>    { const v = this.store.get(key); return v !== undefined ? JSON.parse(v) as T : null }
  async delete(key: string):              Promise<void>        { this.store.delete(key) }
  async clear():                           Promise<void>        { this.store.clear() }
  async has(key: string):                  Promise<boolean>     { return this.store.has(key) }

  /** Inspect raw stored string in tests. */
  getRaw(key: string): string | undefined { return this.store.get(key) }
  get size(): number { return this.store.size }
}
