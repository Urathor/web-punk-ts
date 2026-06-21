import type { Entity    } from './Entity'
import type { IRenderer } from '@engine/renderer'
import type { IComponent } from './IComponent'

/**
 * Convenience base class. Subclasses override only the hooks they need.
 * `entity` is assigned by `Entity.addComponent` before any lifecycle call.
 */
export abstract class BaseComponent implements IComponent {
  entity!:  Entity   // assigned by Entity.addComponent
  enabled = true

  onAttach?():  void
  onDetach?():  void
  fixedUpdate?(_dt: number): void
  update?(_dt: number): void
  render?(_renderer: IRenderer, _interpolation: number): void
}
