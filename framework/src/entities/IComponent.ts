import type { Entity    } from './Entity'
import type { IRenderer } from '@engine/renderer'

export interface IComponent {
  /** Set automatically by Entity.addComponent — do not set manually. */
  entity:  Entity

  /** When false, fixedUpdate / update / render are skipped by the entity. */
  enabled: boolean

  /** Called immediately after the component is added to an entity. */
  onAttach?(): void

  /** Called immediately before the component is removed from an entity. */
  onDetach?(): void

  /** Fixed timestep — game logic, physics. */
  fixedUpdate?(dt: number): void

  /** Variable timestep — animations, tweens, UI. */
  update?(dt: number): void

  /** Draw this component's visual. */
  render?(renderer: IRenderer, interpolation: number): void
}
