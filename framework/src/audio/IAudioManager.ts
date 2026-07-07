import type { IDebugger } from '@engine/debug'

/**
 * Public contract for SFX/BGM playback. `AudioManager` is the sole
 * implementation; the interface exists so dependents (Engine, IEngine)
 * depend on a stable contract rather than the concrete class.
 */
export interface IAudioManager {
  setDebugger(dbg: IDebugger | null): void

  playSFX(buffer: AudioBuffer, volume?: number): void
  setSFXVolume(v: number): void

  playBGM(buffer: AudioBuffer, fadeMs?: number): void
  stopBGM(fadeMs?: number): void
  setBGMVolume(v: number): void

  /** True while a BGM track is currently playing (set by `playBGM`/cleared by `stopBGM`). */
  readonly isBgmPlaying: boolean
}
