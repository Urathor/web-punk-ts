import type { IDebugger } from '@engine/debug'
import type { ISaveProvider } from './ISaveProvider'

export class SaveManager {
  private readonly provider:  ISaveProvider
  private readonly namespace: string
  private debugger: IDebugger | null = null

  constructor(provider: ISaveProvider, namespace = 'default') {
    this.provider  = provider
    this.namespace = namespace
  }

  setDebugger(dbg: IDebugger | null): void {
    this.debugger = dbg
  }

  private fullKey(key: string): string {
    return `${this.namespace}:${key}`
  }

  async save(key: string, data: unknown): Promise<void> {
    try {
      await this.provider.save(this.fullKey(key), data)
    } catch (err: any) {
      this.debugger?.logError(`SaveManager: failed to save key "${key}": ${err.message}`)
      throw err
    }
  }

  async load<T>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      const result = await this.provider.load<T>(this.fullKey(key))
      return result ?? defaultValue ?? null
    } catch (err: any) {
      this.debugger?.logWarning(`SaveManager: failed to load key "${key}", using fallback: ${err.message}`)
      return defaultValue ?? null
    }
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
