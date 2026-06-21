/** Logical canvas width in pixels. Scaled up to fill the window. */
export const LOGICAL_WIDTH  = 320

/** Logical canvas height in pixels. */
export const LOGICAL_HEIGHT = 240

/** Fixed physics/logic timestep in milliseconds (16.67 ms ≈ 60 Hz). */
export const FIXED_STEP_MS  = 1000 / 60

/** Max accumulated time before the fixed-update loop is capped (prevents spiral of death). */
export const MAX_ACCUMULATOR_MS = FIXED_STEP_MS * 5
