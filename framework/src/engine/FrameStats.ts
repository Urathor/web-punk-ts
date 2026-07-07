/** Point-in-time snapshot of {@link FrameStats}, passed to debug/UI consumers. */
export interface FrameStatsSnapshot {
  fps:         number
  frameTimeMs: number
}

/**
 * Tracks FPS and last-frame timing. Kept as its own class (rather than loose
 * fields on Engine) so frame-timing accounting has exactly one reason to
 * change, independent of Engine's composition/loop-delegation role.
 */
export class FrameStats {
  private _fps         = 0
  private _frames       = 0
  private _fpsTimer     = 0
  private _lastFrameMs  = 0

  /** Call once per variable-timestep update with the frame delta (ms). */
  tick(dt: number): void {
    this._lastFrameMs = dt
    this._frames++
    this._fpsTimer += dt
    if (this._fpsTimer >= 1000) {
      this._fps      = this._frames
      this._frames   = 0
      this._fpsTimer -= 1000
    }
  }

  snapshot(): FrameStatsSnapshot {
    return { fps: this._fps, frameTimeMs: this._lastFrameMs }
  }
}
