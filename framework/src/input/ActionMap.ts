import type { IInputManager } from './IInputManager'
import type { IActionMap    } from './IActionMap'

export type KeyBinding   = { type: 'key';   code:   string }
export type MouseBinding = { type: 'mouse'; button: number }
export type InputBinding = KeyBinding | MouseBinding

export interface ActionDefinition {
  bindings: InputBinding[]
}

export class ActionMap implements IActionMap {
  private readonly actions = new Map<string, ActionDefinition>()

  constructor(private readonly input: IInputManager) {}

  defineAction(name: string, bindings: InputBinding[]): void {
    this.actions.set(name, { bindings })
  }

  isActionHeld(name: string): boolean {
    return this.actions.get(name)?.bindings.some(b => this.isBindingHeld(b)) ?? false
  }

  isActionPressed(name: string): boolean {
    return this.actions.get(name)?.bindings.some(b => this.isBindingPressed(b)) ?? false
  }

  isActionReleased(name: string): boolean {
    return this.actions.get(name)?.bindings.some(b => this.isBindingReleased(b)) ?? false
  }

  rebind(name: string, bindings: InputBinding[]): void {
    const action = this.actions.get(name)
    if (action) action.bindings = bindings
  }

  private isBindingHeld(b: InputBinding): boolean {
    return b.type === 'key'
      ? this.input.isKeyHeld(b.code)
      : this.input.isMouseHeld(b.button)
  }

  private isBindingPressed(b: InputBinding): boolean {
    return b.type === 'key'
      ? this.input.isKeyPressed(b.code)
      : this.input.isMousePressed(b.button)
  }

  private isBindingReleased(b: InputBinding): boolean {
    return b.type === 'key'
      ? this.input.isKeyReleased(b.code)
      : this.input.isMouseReleased(b.button)
  }
}
