import type { IComponent } from './IComponent'
import type { IRenderer  } from '@engine/renderer'
import type { IEngine    } from '@engine/engine/IEngine'
import { EventEmitter    } from '@engine/events'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T> = new (...args: any[]) => T

let _nextId = 0

export class Entity {
  readonly id: number = _nextId++
  name:    string
  active:  boolean = true

  /** Local event bus — component-to-component communication within this entity. */
  readonly events: EventEmitter<Record<string, unknown>> = new EventEmitter()

  private _components: IComponent[] = []

  constructor(name = 'Entity') {
    this.name = name
  }

  // ── Component management ────────────────────────────────────────────────────

  addComponent<T extends IComponent>(component: T): T {
    component.entity = this
    this._components.push(component)
    component.onAttach?.()
    return component
  }

  getComponent<T extends IComponent>(type: Constructor<T>): T | undefined {
    return this._components.find((c): c is T => c instanceof type)
  }

  getComponents<T extends IComponent>(type: Constructor<T>): T[] {
    return this._components.filter((c): c is T => c instanceof type)
  }

  hasComponent<T extends IComponent>(type: Constructor<T>): boolean {
    return this._components.some(c => c instanceof type)
  }

  removeComponent<T extends IComponent>(type: Constructor<T>): void {
    const idx = this._components.findIndex(c => c instanceof type)
    if (idx !== -1) {
      const removed = this._components.splice(idx, 1)[0]
      removed?.onDetach?.()
    }
  }

  // ── Lifecycle forwarding ────────────────────────────────────────────────────

  /** Called by the scene when it enters — override to register colliders, subscribe to events, etc. */
  onEnter?(engine: IEngine): void

  /** Called by the scene when it exits — override to unregister colliders and clean up. */
  onExit?(engine: IEngine): void

  fixedUpdate(dt: number): void {
    if (!this.active) return
    for (const c of this._components) {
      if (c.enabled) c.fixedUpdate?.(dt)
    }
  }

  update(dt: number): void {
    if (!this.active) return
    for (const c of this._components) {
      if (c.enabled) c.update?.(dt)
    }
  }

  render(renderer: IRenderer, interpolation: number): void {
    if (!this.active) return
    for (const c of this._components) {
      if (c.enabled) c.render?.(renderer, interpolation)
    }
  }

  destroy(): void {
    for (const c of [...this._components]) {
      c.onDetach?.()
    }
    this._components = []
    this.active = false
    this.events.clear()
  }
}
