/**
 * Default logical canvas width in pixels. Fallback only: used when a
 * `CanvasRenderer` is created without an explicit `resolution`. The runtime
 * source of truth is `renderer.logicalWidth`, which the Engine propagates to
 * `camera.viewport`, the input mouse mapping, and UI anchoring. Scaled up to
 * fill the window.
 */
export const LOGICAL_WIDTH  = 320

/**
 * Default logical canvas height in pixels. Fallback only — see
 * {@link LOGICAL_WIDTH}; the runtime source of truth is `renderer.logicalHeight`.
 */
export const LOGICAL_HEIGHT = 240

/** Fixed physics/logic timestep in milliseconds (16.67 ms ≈ 60 Hz). */
export const FIXED_STEP_MS  = 1000 / 60

/** Max accumulated time before the fixed-update loop is capped (prevents spiral of death). */
export const MAX_ACCUMULATOR_MS = FIXED_STEP_MS * 5
