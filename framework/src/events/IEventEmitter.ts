type Handler<T> = (payload: T) => void

/**
 * Public contract for the typed pub/sub event bus. `EventEmitter` is the sole
 * implementation; the interface exists so dependents depend on a stable
 * contract rather than the concrete class.
 */
export interface IEventEmitter<TMap extends object> {
  /** Optional hook called on every emit — used by DebugOverlay to stream events. */
  _emitHook?: (event: string) => void

  on<K extends keyof TMap>(event: K, handler: Handler<TMap[K]>): void
  off<K extends keyof TMap>(event: K, handler: Handler<TMap[K]>): void
  emit<K extends keyof TMap>(event: K, payload: TMap[K]): void
  clear<K extends keyof TMap>(event?: K): void
}
