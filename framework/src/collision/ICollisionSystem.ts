import type { BaseCollider } from './BaseCollider'
import type { BoxCollider }  from './BoxCollider'
import type { CollisionFace } from './AABB'
import type { TileMap }      from '@engine/tilemap/TileMap'
import type { IEventEmitter } from '@engine/events'
import type { GameEventMap }  from '@engine/events'

/**
 * Public contract for collider registration and narrow/broad-phase collision
 * resolution. `CollisionSystem` is the sole implementation; the interface
 * exists so dependents (Engine, IEngine) depend on a stable contract rather
 * than the concrete class.
 */
export interface ICollisionSystem {
  register(collider: BaseCollider):   void
  unregister(collider: BaseCollider): void
  setTileMap(map: TileMap):           void
  setEventBus(bus: IEventEmitter<GameEventMap>): void

  readonly allColliders: readonly BaseCollider[]

  update(): void
  resolveTileCollision(collider: BoxCollider): CollisionFace
}
