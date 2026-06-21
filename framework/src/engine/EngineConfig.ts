import type { IRenderer     } from '@engine/renderer'
import type { ISaveProvider } from '@engine/save'

export interface EngineConfig {
  /** The canvas element — needed by InputManager for mouse coordinate mapping. */
  canvas:   HTMLCanvasElement
  renderer: IRenderer
  /** Show debug overlay. Automatically enabled in `import.meta.env.DEV`. */
  debug?:   boolean
  /** Override the default localStorage save provider. */
  saveProvider?: ISaveProvider
}
