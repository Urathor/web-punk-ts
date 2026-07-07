import type { IEngine   } from './IEngine'
import type { IRenderer } from '@engine/renderer'

export interface IScene {
  /**
   * Optional async pre-loading step called before onEnter.
   * @param reportProgress – call with 0–1 to drive the loading bar.
   */
  preload?(engine: IEngine, reportProgress: (p: number) => void): Promise<void>

  /** Called once when the scene first becomes active. */
  onEnter(engine: IEngine): void

  /** Called once when the scene is permanently removed from the stack. Omit if there's nothing to clean up. */
  onExit?(): void

  /** Called when a scene is pushed on top of this one (this scene pauses). Omit if pausing needs no action. */
  onPause?(): void

  /** Called when the scene above this one is popped, restoring this scene. Omit if resuming needs no action. */
  onResume?(): void

  /** Fixed timestep update — ~16.67 ms per tick. Use for physics/game logic. Omit if unused. */
  fixedUpdate?(dt: number): void

  /** Variable timestep update — called every frame. Use for UI, tweens, input. */
  update(dt: number): void

  /** Draw everything for this scene. */
  render(renderer: IRenderer, interpolation: number): void
}
