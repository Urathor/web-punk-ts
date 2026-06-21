/** Bit-flag constants for collision layers. Extend as needed. */
export const CollisionLayer = {
  None:       0b00000000,
  Default:    0b00000001,
  Player:     0b00000010,
  Enemy:      0b00000100,
  Projectile: 0b00001000,
  Pickup:     0b00010000,
  Wall:       0b00100000,
} as const

export type CollisionLayerValue = typeof CollisionLayer[keyof typeof CollisionLayer]
