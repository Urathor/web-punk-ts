import { Vector2             } from '@engine/math'
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from '@engine/constants'

// Internal state — not exported; only used within this file
const enum KeyState { Up, JustPressed, Held, JustReleased }

export class InputManager {
  private keyStates    = new Map<string, KeyState>()
  private mouseStates  = new Map<number, KeyState>()
  private _mousePos    = new Vector2(0, 0)

  private readonly canvas: HTMLCanvasElement

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    window.addEventListener('keydown',  this.onKeyDown)
    window.addEventListener('keyup',    this.onKeyUp)
    canvas.addEventListener('mousedown', this.onMouseDown)
    canvas.addEventListener('mouseup',   this.onMouseUp)
    canvas.addEventListener('mousemove', this.onMouseMove)
  }

  // ── Keyboard ─────────────────────────────────────────────────────────────────

  isKeyHeld(code: string):     boolean {
    const s = this.keyStates.get(code)
    return s === KeyState.Held || s === KeyState.JustPressed
  }

  isKeyPressed(code: string):  boolean {
    return this.keyStates.get(code) === KeyState.JustPressed
  }

  isKeyReleased(code: string): boolean {
    return this.keyStates.get(code) === KeyState.JustReleased
  }

  // ── Mouse ─────────────────────────────────────────────────────────────────────

  get mousePosition(): Vector2 { return this._mousePos.clone() }

  isMouseHeld(button: number):     boolean {
    const s = this.mouseStates.get(button)
    return s === KeyState.Held || s === KeyState.JustPressed
  }

  isMousePressed(button: number):  boolean {
    return this.mouseStates.get(button) === KeyState.JustPressed
  }

  isMouseReleased(button: number): boolean {
    return this.mouseStates.get(button) === KeyState.JustReleased
  }

  // ── Frame lifecycle ───────────────────────────────────────────────────────────

  /** Advance JustPressed→Held and JustReleased→Up. Call once per frame after render. */
  endFrame(): void {
    for (const [key, state] of this.keyStates) {
      if      (state === KeyState.JustPressed)  this.keyStates.set(key, KeyState.Held)
      else if (state === KeyState.JustReleased) this.keyStates.delete(key)
    }
    for (const [btn, state] of this.mouseStates) {
      if      (state === KeyState.JustPressed)  this.mouseStates.set(btn, KeyState.Held)
      else if (state === KeyState.JustReleased) this.mouseStates.delete(btn)
    }
  }

  dispose(): void {
    window.removeEventListener('keydown',  this.onKeyDown)
    window.removeEventListener('keyup',    this.onKeyUp)
    this.canvas.removeEventListener('mousedown', this.onMouseDown)
    this.canvas.removeEventListener('mouseup',   this.onMouseUp)
    this.canvas.removeEventListener('mousemove', this.onMouseMove)
  }

  // ── Private event handlers ───────────────────────────────────────────────────

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    const s = this.keyStates.get(e.code)
    // Ignore browser key-repeat events (state is already JustPressed or Held)
    if (s === undefined || s === KeyState.JustReleased) {
      this.keyStates.set(e.code, KeyState.JustPressed)
    }
    // Prevent arrow keys / space from scrolling the page; prevent backtick from opening browser console
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Backquote'].includes(e.code)) {
      e.preventDefault()
    }
  }

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    this.keyStates.set(e.code, KeyState.JustReleased)
  }

  private readonly onMouseDown = (e: MouseEvent): void => {
    this.mouseStates.set(e.button, KeyState.JustPressed)
  }

  private readonly onMouseUp = (e: MouseEvent): void => {
    this.mouseStates.set(e.button, KeyState.JustReleased)
  }

  private readonly onMouseMove = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect()
    // Map from CSS pixels to logical pixels
    this._mousePos = new Vector2(
      (e.clientX - rect.left) * (LOGICAL_WIDTH  / rect.width),
      (e.clientY - rect.top)  * (LOGICAL_HEIGHT / rect.height)
    )
  }
}
