import type { IAudioManager } from '@engine/audio'

/**
 * A minimal, controllable `IAudioManager` for tests that need to hand something
 * to a consumer without wiring up a real `AudioManager`/`AudioContext` (which
 * jsdom doesn't implement). Tracks calls so tests can assert on playback intent
 * without any real audio graph.
 */
export class MockAudioProvider implements IAudioManager {
  sfxCalls: Array<{ buffer: AudioBuffer; volume: number }> = []
  bgmCalls: Array<{ buffer: AudioBuffer; fadeMs: number }> = []
  sfxVolume = 1
  bgmVolume = 1
  stopBGMCalls: number[] = []

  private _isBgmPlaying = false
  get isBgmPlaying(): boolean { return this._isBgmPlaying }

  setDebugger(): void {}

  playSFX(buffer: AudioBuffer, volume = 1): void {
    this.sfxCalls.push({ buffer, volume })
  }

  setSFXVolume(v: number): void {
    this.sfxVolume = v
  }

  playBGM(buffer: AudioBuffer, fadeMs = 500): void {
    this.bgmCalls.push({ buffer, fadeMs })
    this._isBgmPlaying = true
  }

  stopBGM(fadeMs = 500): void {
    this.stopBGMCalls.push(fadeMs)
    this._isBgmPlaying = false
  }

  setBGMVolume(v: number): void {
    this.bgmVolume = v
  }
}
