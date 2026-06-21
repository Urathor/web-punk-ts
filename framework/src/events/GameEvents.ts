import type { BaseCollider } from '@engine/collision'
import type { CollisionFace } from '@engine/collision'
import type { Entity        } from '@engine/entities'

/**
 * Global event map for the engine's built-in events.
 *
 * Game projects may extend this via declaration merging:
 * @example
 * // In your game code:
 * declare module '@engine/events/GameEvents' {
 *   interface GameEventMap {
 *     'coin:collected': { value: number }
 *   }
 * }
 */
export interface GameEventMap {
  // ── Engine ────────────────────────────────────────────────────────────────
  'engine:started':   { timestamp: number }
  'engine:stopped':   Record<string, never>

  // ── Scene ─────────────────────────────────────────────────────────────────
  'scene:pushed':     { name: string }
  'scene:popped':     { name: string }
  'scene:replaced':   { name: string }

  // ── Collision ─────────────────────────────────────────────────────────────
  'collision:enter':  { a: BaseCollider; b: BaseCollider; face: CollisionFace }
  'collision:exit':   { a: BaseCollider; b: BaseCollider }
  'trigger:enter':    { trigger: BaseCollider; other: BaseCollider }
  'trigger:exit':     { trigger: BaseCollider; other: BaseCollider }

  // ── Entities ──────────────────────────────────────────────────────────────
  'entity:destroyed': { entity: Entity }
}
