import type { Sprite          } from '@engine/animation/Sprite'
import type { NineSliceInsets } from './UIBackground'
import { NineSliceBackground   } from './NineSliceBackground'
import { SolidColorBackground  } from './SolidColorBackground'
import type { SolidColorOptions } from './SolidColorBackground'

export type { UIBackground, Tint, NineSliceInsets, UIWidgetState } from './UIBackground'
export type { NineSlicePair } from './NineSlice'
export { computeNineSlice } from './NineSlice'
export { SolidColorBackground } from './SolidColorBackground'
export type { SolidColorOptions } from './SolidColorBackground'
export { NineSliceBackground } from './NineSliceBackground'
export type { NineSliceSource } from './NineSliceBackground'

/** Build a nine-slice sprite background. Zero insets give a plain stretched sprite. */
export function nineSlice(sprite: Sprite, insets: NineSliceInsets): NineSliceBackground {
  return new NineSliceBackground(sprite, insets)
}

/** Build a solid colour background (the existing filled/outlined rectangle look). */
export function solid(opts?: SolidColorOptions): SolidColorBackground {
  return new SolidColorBackground(opts)
}
