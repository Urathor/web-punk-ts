import type { ISaveProvider } from '../ISaveProvider'

export class LocalStorageSaveProvider implements ISaveProvider {
  private readonly prefix: string

  constructor(prefix = 'tb_game_') {
    this.prefix = prefix
  }

  private key(k: string): string { return this.prefix + k }

  async save(key: string, data: unknown): Promise<void> {
    try {
      localStorage.setItem(this.key(key), JSON.stringify(data))
    } catch (e) {
      console.error(`[Save] Failed to write "${key}"`, e)
    }
  }

  async load<T>(key: string): Promise<T | null> {
    const raw = localStorage.getItem(this.key(key))
    if (raw === null) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      console.error(`[Save] Failed to parse "${key}" — clearing corrupted entry`)
      localStorage.removeItem(this.key(key))
      return null
    }
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(this.key(key))
  }

  async clear(): Promise<void> {
    const toRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(this.prefix)) toRemove.push(k)
    }
    toRemove.forEach(k => localStorage.removeItem(k))
  }

  async has(key: string): Promise<boolean> {
    return localStorage.getItem(this.key(key)) !== null
  }
}
