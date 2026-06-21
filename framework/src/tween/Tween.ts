import type { EasingFn } from './Easing'

export interface TweenOptions {
  from:       number
  to:         number
  /** Total duration in milliseconds. */
  duration:   number
  easing:     EasingFn
  onUpdate:   (value: number) => void
  /** Called once when the tween reaches the end (not called when looping, pingPong, or cancelled). */
  onComplete?: () => void
  /** When true the tween restarts automatically instead of completing. */
  loop?:       boolean
  /** When true the tween reverses direction each time it completes, oscillating between from and to. */
  pingPong?:   boolean
}

export class Tween {
  private _elapsed    = 0
  private _cancelled  = false
  private readonly _from:       number
  private readonly _to:         number
  private readonly _duration:   number
  private readonly _easing:     EasingFn
  private readonly _onUpdate:   (value: number) => void
  private readonly _onComplete: (() => void) | undefined
  private readonly _loop:       boolean
  private readonly _pingPong:   boolean

  constructor(opts: TweenOptions) {
    this._from       = opts.from
    this._to         = opts.to
    this._duration   = opts.duration
    this._easing     = opts.easing
    this._onUpdate   = opts.onUpdate
    this._onComplete = opts.onComplete
    this._loop       = opts.loop     ?? false
    this._pingPong   = opts.pingPong ?? false
  }

  /** Advance the tween by `dt` milliseconds. Call this in your scene's `update(dt)`. */
  tick(dt: number): void {
    if (this._cancelled) return
    if (!this._loop && !this._pingPong && this._elapsed >= this._duration) return

    this._elapsed += dt

    let t: number
    if (this._pingPong) {
      // Map elapsed onto a 0→1→0 triangle wave over 2× the duration
      const cycle = this._duration * 2
      const phase = this._elapsed % cycle
      t = phase < this._duration
        ? phase / this._duration
        : 1 - (phase - this._duration) / this._duration
    } else if (this._elapsed >= this._duration) {
      if (this._loop) {
        this._elapsed %= this._duration
        t = this._elapsed / this._duration
      } else {
        this._elapsed = this._duration
        this._onUpdate(this._to)
        this._onComplete?.()
        return
      }
    } else {
      t = this._elapsed / this._duration
    }

    const value = this._from + (this._to - this._from) * this._easing(t)
    this._onUpdate(value)
  }

  /** True once the tween has finished (non-looping, non-pingPong) or been cancelled. */
  get isComplete(): boolean {
    return this._cancelled || (!this._loop && !this._pingPong && this._elapsed >= this._duration)
  }

  /** Stop the tween immediately without firing onComplete. */
  cancel(): void {
    this._cancelled = true
  }

  /** Restart from the beginning. Clears a previous cancel. */
  reset(): void {
    this._elapsed   = 0
    this._cancelled = false
  }
}
