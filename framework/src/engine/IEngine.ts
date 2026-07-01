import type { IRenderer      } from '@engine/renderer'
import type { AssetLoader    } from '@engine/assets'
import type { InputManager   } from '@engine/input'
import type { ActionMap      } from '@engine/input'
import type { Camera         } from '@engine/camera'
import type { CollisionSystem } from '@engine/collision/CollisionSystem'
import type { AudioManager   } from '@engine/audio'
import type { UIManager      } from '@engine/ui'
import type { EventEmitter   } from '@engine/events'
import type { GameEventMap   } from '@engine/events'
import type { IDebugger       } from '@engine/debug'
import type { SaveManager    } from '@engine/save'
import type { IScene         } from './IScene'

/**
 * Minimal engine interface exposed to scenes.
 * Avoids the circular dependency: Engine → SceneManager → IScene → Engine.
 */
export interface IEngine {
  readonly renderer:  IRenderer
  readonly debugger:  IDebugger | null
  readonly assets:    AssetLoader
  readonly input:     InputManager
  readonly actions:   ActionMap
  readonly camera:    Camera
  readonly collision: CollisionSystem
  readonly audio:     AudioManager
  readonly ui:        UIManager
  readonly events:    EventEmitter<GameEventMap>
  readonly save:      SaveManager

  /** Push a new scene on top of the stack (previous scene pauses). */
  pushScene(scene: IScene): void
  /** Pop the top scene and resume the one beneath. */
  popScene(): void
  /** Replace the top scene with a new one. */
  replaceScene(scene: IScene): void
  /**
   * Replace the scene directly beneath the current top, leaving the top scene
   * (e.g. a FadeScene overlay) in place.
   */
  replaceSceneUnder(scene: IScene): void
}
