/** All easing functions take a normalised time t ∈ [0, 1] and return a value in [0, 1]. */
export type EasingFn = (t: number) => number

const c1 = 1.70158
const c3 = c1 + 1

export const Easing = {
  linear: (t: number): number => t,

  easeInQuad:    (t: number): number => t * t,
  easeOutQuad:   (t: number): number => 1 - (1 - t) * (1 - t),
  easeInOutQuad: (t: number): number =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,

  easeInCubic:    (t: number): number => t * t * t,
  easeOutCubic:   (t: number): number => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t: number): number =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,

  easeInBack:    (t: number): number => c3 * t * t * t - c1 * t * t,
  easeOutBack:   (t: number): number => 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2),
  easeInOutBack: (t: number): number => {
    const c2 = c1 * 1.525
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (2 * t - 2) + c2) + 2) / 2
  },
} as const
