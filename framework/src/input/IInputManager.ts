import type { Vector2 } from '@engine/math'

/**
 * Public contract for keyboard/mouse polling. `InputManager` is the sole
 * implementation; the interface exists so dependents (Engine, ActionMap)
 * depend on a stable contract rather than the concrete class.
 */
export interface IInputManager {
  isKeyHeld(code: string):     boolean
  isKeyPressed(code: string):  boolean
  isKeyReleased(code: string): boolean

  readonly mousePosition: Vector2
  isMouseHeld(button: number):     boolean
  isMousePressed(button: number):  boolean
  isMouseReleased(button: number): boolean

  endFrame(): void
  dispose():  void
}
