import type { IScene  } from './IScene'
import type { IEngine } from './IEngine'

/**
 * Public contract for the scene stack. `SceneManager` is the sole
 * implementation; the interface exists so `Engine` depends on a stable
 * contract rather than the concrete class.
 */
export interface ISceneManager {
  readonly activeScene: IScene | undefined
  readonly allScenes:   readonly IScene[]

  push(scene: IScene, engine: IEngine): Promise<void>
  pop(engine: IEngine): void
  replace(scene: IScene, engine: IEngine): Promise<void>
  replaceUnder(scene: IScene, engine: IEngine): Promise<void>
  clear(): void
}
