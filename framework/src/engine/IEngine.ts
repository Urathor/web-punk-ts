import type { IRenderer      } from '@engine/renderer'
import type { IAssetLoader   } from '@engine/assets'
import type { IInputManager  } from '@engine/input'
import type { IActionMap     } from '@engine/input'
import type { ICamera        } from '@engine/camera'
import type { ICollisionSystem } from '@engine/collision/ICollisionSystem'
import type { IAudioManager  } from '@engine/audio'
import type { IUIManager     } from '@engine/ui'
import type { IEventEmitter  } from '@engine/events'
import type { GameEventMap   } from '@engine/events'
import type { IDebugger       } from '@engine/debug'
import type { ISaveManager   } from '@engine/save'
import type { IScene         } from './IScene'

/**
 * Minimal engine interface exposed to scenes.
 * Avoids the circular dependency: Engine → SceneManager → IScene → Engine.
 */
export interface IEngine {
  readonly renderer:  IRenderer
  readonly debugger:  IDebugger | null
  readonly assets:    IAssetLoader
  readonly input:     IInputManager
  readonly actions:   IActionMap
  readonly camera:    ICamera
  readonly collision: ICollisionSystem
  readonly audio:     IAudioManager
  readonly ui:        IUIManager
  readonly events:    IEventEmitter<GameEventMap>
  readonly save:      ISaveManager

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
