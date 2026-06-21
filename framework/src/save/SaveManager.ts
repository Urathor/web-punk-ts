import type { ISaveProvider } from './ISaveProvider'

export class SaveManager {
  private readonly provider:  ISaveProvider
  private readonly namespace: string

  constructor(provider: ISaveProvider, namespace = 'default') {
    this.provider  = provider
    this.namespace = namespace
  }

  private fullKey(key: string): string {
    return `${this.namespace}:${key}`
  }

  async save(key: string, data: unknown): Promise<void> {
    await this.provider.save(this.fullKey(key), data)
  }

  async load<T>(key: string, defaultValue?: T): Promise<T | null> {
    const result = await this.provider.load<T>(this.fullKey(key))
    return result ?? defaultValue ?? null
  }

  async delete(key: string): Promise<void> {
    await this.provider.delete(this.fullKey(key))
  }

  async has(key: string): Promise<boolean> {
    return this.provider.has(this.fullKey(key))
  }

  async clear(): Promise<void> {
    await this.provider.clear()
  }

  /** Returns a SaveManager scoped to a different namespace (e.g. a save slot). */
  slot(slotName: string): SaveManager {
    return new SaveManager(this.provider, slotName)
  }
}
