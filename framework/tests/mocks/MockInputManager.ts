import { Vector2 } from '@engine/math'
import type { IInputManager } from '@engine/input'

/**
 * A minimal, controllable `IInputManager` for widget tests that need to call
 * `update()` (e.g. `UIButton`) without wiring up a real `InputManager`/DOM events.
 * Defaults to "no interaction" (mouse far off-screen, no buttons down) — use
 * `press()`/`release()` and set `mousePosition` directly to simulate hover/click.
 */
export class MockInputManager implements IInputManager {
  mousePosition: Vector2 = new Vector2(-1000, -1000)

  private pressedEdge  = new Set<number>()
  private heldButtons  = new Set<number>()
  private releasedEdge = new Set<number>()

  isKeyHeld(_code: string):     boolean { return false }
  isKeyPressed(_code: string):  boolean { return false }
  isKeyReleased(_code: string): boolean { return false }

  isMouseHeld(button: number):     boolean { return this.heldButtons.has(button) }
  isMousePressed(button: number):  boolean { return this.pressedEdge.has(button) }
  isMouseReleased(button: number): boolean { return this.releasedEdge.has(button) }

  endFrame(): void { this.pressedEdge.clear(); this.releasedEdge.clear() }
  dispose():  void {}

  /** Simulate pressing (and holding) a mouse button this frame. */
  press(button = 0): void {
    this.pressedEdge.add(button)
    this.heldButtons.add(button)
  }

  /** Simulate releasing a mouse button this frame. */
  release(button = 0): void {
    this.releasedEdge.add(button)
    this.heldButtons.delete(button)
  }
}
