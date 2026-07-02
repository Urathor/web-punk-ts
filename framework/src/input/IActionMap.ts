import type { InputBinding } from './ActionMap'

/**
 * Public contract for named action bindings. `ActionMap` is the sole
 * implementation; the interface exists so dependents (Engine, IEngine)
 * depend on a stable contract rather than the concrete class.
 */
export interface IActionMap {
  defineAction(name: string, bindings: InputBinding[]): void
  isActionHeld(name: string):     boolean
  isActionPressed(name: string):  boolean
  isActionReleased(name: string): boolean
  rebind(name: string, bindings: InputBinding[]): void
}
