import { FIXED_STEP_MS, MAX_ACCUMULATOR_MS } from '@engine/constants'

export interface LoopCallbacks {
  fixedUpdate(dt: number): void
  update(dt: number): void
  render(interpolation: number): void
}

export class GameLoop {
  private rafId:       number | null = null
  private lastTime:    number = 0
  private accumulator: number = 0

  constructor(private readonly callbacks: LoopCallbacks) {}

  start(): void {
    this.lastTime    = performance.now()
    this.accumulator = 0
    this.rafId = requestAnimationFrame(this.tick)
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  private readonly tick = (timestamp: number): void => {
    const realDelta = timestamp - this.lastTime
    this.lastTime   = timestamp

    // Cap to prevent spiral of death after tab unfocus
    this.accumulator += Math.min(realDelta, MAX_ACCUMULATOR_MS)

    while (this.accumulator >= FIXED_STEP_MS) {
      this.callbacks.fixedUpdate(FIXED_STEP_MS)
      this.accumulator -= FIXED_STEP_MS
    }

    const interpolation = this.accumulator / FIXED_STEP_MS
    this.callbacks.update(realDelta)
    this.callbacks.render(interpolation)

    this.rafId = requestAnimationFrame(this.tick)
  }
}
