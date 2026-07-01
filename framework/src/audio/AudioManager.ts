import type { IDebugger } from '@engine/debug'

export class AudioManager {
  private ctx:              AudioContext | null = null
  private masterGain:       GainNode | null = null
  private sfxGain:          GainNode | null = null
  private bgmGain:          GainNode | null = null
  private currentBGMSource: AudioBufferSourceNode | null = null
  private pendingQueue:     Array<() => void> = []
  private unlocked = false
  private debugger: IDebugger | null = null

  setDebugger(dbg: IDebugger | null): void {
    this.debugger = dbg
  }

  constructor() {
    // Unlock AudioContext on first user interaction (browser autoplay policy).
    const unlock = (): void => {
      if (this.unlocked) return
      this.getCtx().resume().then(() => {
        this.unlocked = true
        this.flushQueue()
      }).catch(() => { /* ignore */ })
    }
    window.addEventListener('click',   unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
  }

  // ── SFX ───────────────────────────────────────────────────────────────────

  playSFX(buffer: AudioBuffer, volume = 1): void {
    if (!buffer) {
      this.debugger?.logWarning('AudioManager: playSFX called with null or undefined buffer')
      return
    }
    this.enqueue(() => {
      const ctx    = this.getCtx()
      const source = ctx.createBufferSource()
      source.buffer = buffer
      const gain    = ctx.createGain()
      gain.gain.value = volume
      source.connect(gain)
      gain.connect(this.getSfxGain())
      source.start()
    })
  }

  setSFXVolume(v: number): void {
    this.getSfxGain().gain.value = Math.max(0, Math.min(1, v))
  }

  // ── BGM ───────────────────────────────────────────────────────────────────

  playBGM(buffer: AudioBuffer, fadeMs = 500): void {
    if (!buffer) {
      this.debugger?.logWarning('AudioManager: playBGM called with null or undefined buffer')
      return
    }
    this.enqueue(() => {
      const ctx     = this.getCtx()
      const bgmGain = this.getBgmGain()

      if (this.currentBGMSource) {
        const old = this.currentBGMSource
        bgmGain.gain.linearRampToValueAtTime(0, ctx.currentTime + fadeMs / 1000)
        setTimeout(() => { try { old.stop() } catch { /* already stopped */ } }, fadeMs)
      }

      bgmGain.gain.setValueAtTime(0, ctx.currentTime)
      bgmGain.gain.linearRampToValueAtTime(1, ctx.currentTime + fadeMs / 1000)

      const source  = ctx.createBufferSource()
      source.buffer = buffer
      source.loop   = true
      source.connect(bgmGain)
      source.start()
      this.currentBGMSource = source
    })
  }

  stopBGM(fadeMs = 500): void {
    if (!this.currentBGMSource || !this.ctx) return
    const src = this.currentBGMSource
    this.currentBGMSource = null
    this.getBgmGain().gain.linearRampToValueAtTime(0, this.ctx.currentTime + fadeMs / 1000)
    setTimeout(() => { try { src.stop() } catch { /* already stopped */ } }, fadeMs)
  }

  setBGMVolume(v: number): void {
    this.getBgmGain().gain.value = Math.max(0, Math.min(1, v))
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.masterGain = this.ctx.createGain()
      this.sfxGain    = this.ctx.createGain()
      this.bgmGain    = this.ctx.createGain()
      this.sfxGain.connect(this.masterGain)
      this.bgmGain.connect(this.masterGain)
      this.masterGain.connect(this.ctx.destination)
    }
    return this.ctx
  }

  private getSfxGain(): GainNode { this.getCtx(); return this.sfxGain! }
  private getBgmGain(): GainNode { this.getCtx(); return this.bgmGain! }

  private enqueue(fn: () => void): void {
    if (this.unlocked) fn()
    else               this.pendingQueue.push(fn)
  }

  private flushQueue(): void {
    for (const fn of this.pendingQueue) fn()
    this.pendingQueue = []
  }
}
