type Handler<T> = (payload: T) => void

export class EventEmitter<TMap extends object> {
  private listeners = new Map<keyof TMap, Set<Handler<unknown>>>()

  /** Optional hook called on every emit — used by DebugOverlay to stream events. */
  _emitHook?: (event: string) => void

  on<K extends keyof TMap>(event: K, handler: Handler<TMap[K]>): void {
    let set = this.listeners.get(event)
    if (!set) { set = new Set(); this.listeners.set(event, set) }
    set.add(handler as Handler<unknown>)
  }

  off<K extends keyof TMap>(event: K, handler: Handler<TMap[K]>): void {
    this.listeners.get(event)?.delete(handler as Handler<unknown>)
  }

  emit<K extends keyof TMap>(event: K, payload: TMap[K]): void {
    this._emitHook?.(String(event))
    const set = this.listeners.get(event)
    if (!set) return
    for (const handler of set) handler(payload)
  }

  /** Remove all listeners for one event, or every listener if no event given. */
  clear<K extends keyof TMap>(event?: K): void {
    if (event !== undefined) this.listeners.delete(event)
    else                     this.listeners.clear()
  }
}
