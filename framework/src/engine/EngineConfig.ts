import type { IRenderer     } from '@engine/renderer'
import type { ISaveProvider } from '@engine/save'

export interface EngineConfig {
  /** The canvas element — needed by InputManager for mouse coordinate mapping. */
  canvas:   HTMLCanvasElement
  renderer: IRenderer
  /**
   * Reserved for a future explicit debug-overlay toggle. Currently unused —
   * the debug overlay is enabled automatically whenever
   * `process.env.NODE_ENV !== 'production'` (see `Engine.ts`), regardless of
   * this flag.
   */
  debug?:   boolean
  /** Override the default localStorage save provider. */
  saveProvider?: ISaveProvider
}
