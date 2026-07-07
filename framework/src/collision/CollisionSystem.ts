import { Transform     } from '@engine/entities/components/Transform'
import { Rect, Vector2 } from '@engine/math'
import { BaseCollider  } from './BaseCollider'
import { BoxCollider   } from './BoxCollider'
import { testAABB, inverseFace, CollisionFace } from './AABB'
import { testColliderPair } from './ColliderPairTests'
import type { TileMap  } from '@engine/tilemap/TileMap'
import type { IEventEmitter } from '@engine/events'
import type { GameEventMap } from '@engine/events'
import type { ICollisionSystem } from './ICollisionSystem'

export class CollisionSystem implements ICollisionSystem {
  private colliders:   BaseCollider[]   = []
  private activePairs: Set<string>      = new Set()
  private tileMap:     TileMap | null   = null
  private bus:         IEventEmitter<GameEventMap> | null = null
  private warnedNonBoxTileCollider = false

  setEventBus(bus: IEventEmitter<GameEventMap>): void {
    this.bus = bus
  }

  // ── Registration ─────────────────────────────────────────────────────────

  register(collider: BaseCollider): void {
    this.colliders.push(collider)
  }

  unregister(collider: BaseCollider): void {
    this.colliders = this.colliders.filter(c => c !== collider)
    const id = collider.entity.id
    for (const key of this.activePairs) {
      const dash = key.indexOf('-')
      if (Number(key.substring(0, dash)) === id || Number(key.substring(dash + 1)) === id) {
        this.activePairs.delete(key)
      }
    }
  }

  setTileMap(map: TileMap): void {
    this.tileMap = map
  }

  /** All currently registered colliders. Exposed for debug tools. */
  get allColliders(): readonly BaseCollider[] { return this.colliders }

  // ── Per-fixedUpdate entity–entity pass ───────────────────────────────────

  update(): void {
    const currentPairs = new Set<string>()

    for (let i = 0; i < this.colliders.length; i++) {
      const a = this.colliders[i]
      if (!a || !a.enabled || !a.entity.active) continue

      for (let j = i + 1; j < this.colliders.length; j++) {
        const b = this.colliders[j]
        if (!b || !b.enabled || !b.entity.active) continue
        if (!a.shouldCollideWith(b) && !b.shouldCollideWith(a)) continue

        const result  = testColliderPair(a, b)
        const pairKey = `${Math.min(a.entity.id, b.entity.id)}-${Math.max(a.entity.id, b.entity.id)}`

        if (result.overlaps) {
          currentPairs.add(pairKey)
          const isNew = !this.activePairs.has(pairKey)

          if (a.isTrigger || b.isTrigger) {
            if (isNew) {
              const trigger = a.isTrigger ? a : b
              const other   = a.isTrigger ? b : a
              this.bus?.emit('trigger:enter', { trigger, other })
              a.onTriggerEnter?.(b); b.onTriggerEnter?.(a)
            } else       { a.onTriggerStay?.(b);  b.onTriggerStay?.(a)  }
          } else {
            this.resolveOverlap(a, b, result.penetration)
            if (isNew) {
              this.bus?.emit('collision:enter', { a, b, face: result.face })
              a.onCollisionEnter?.(b, result.face)
              b.onCollisionEnter?.(a, inverseFace(result.face))
            } else {
              a.onCollisionStay?.(b); b.onCollisionStay?.(a)
            }
          }
        }
      }
    }

    // Fire exit events for pairs that ended this frame
    for (const key of this.activePairs) {
      if (currentPairs.has(key)) continue
      const dash = key.indexOf('-')
      const idA  = Number(key.substring(0, dash))
      const idB  = Number(key.substring(dash + 1))
      const ca   = this.colliders.find(c => c.entity.id === idA)
      const cb   = this.colliders.find(c => c.entity.id === idB)
      if (!ca || !cb) continue
      if (ca.isTrigger || cb.isTrigger) {
        this.bus?.emit('trigger:exit', { trigger: ca.isTrigger ? ca : cb, other: ca.isTrigger ? cb : ca })
        ca.onTriggerExit?.(cb); cb.onTriggerExit?.(ca)
      } else {
        this.bus?.emit('collision:exit', { a: ca, b: cb })
        ca.onCollisionExit?.(cb); cb.onCollisionExit?.(ca)
      }
    }

    this.activePairs = currentPairs

    // After entity–entity resolution, push every solid BoxCollider out of tiles.
    // This ensures entities that were displaced by resolveOverlap don't stay inside walls.
    // Tile pushout is only implemented for box shapes (see resolveTileCollision) — warn
    // once (dev builds only) instead of silently letting other shapes pass through walls.
    for (const c of this.colliders) {
      if (c.isTrigger || !c.enabled || !c.entity.active) continue
      if (c.shape === 'box') {
        this.resolveTileCollision(c as BoxCollider)
      } else if (this.tileMap && process.env.NODE_ENV !== 'production' && !this.warnedNonBoxTileCollider) {
        this.warnedNonBoxTileCollider = true
        console.warn(
          `CollisionSystem: tile collision is only implemented for BoxCollider; "${c.shape}" ` +
          'colliders will not collide with the tilemap.'
        )
      }
    }
  }

  // ── Tile collision ────────────────────────────────────────────────────────

  /**
   * Iterates every tile cell that the BoxCollider's AABB overlaps and pushes
   * the entity out of any collidable tile.  Returns the last resolved face.
   *
   * Call this separately for each axis after per-axis movement to guarantee
   * unambiguous push direction (the movement step is always the short side of
   * the overlap rectangle, so `testAABB` picks the correct axis automatically).
   */
  resolveTileCollision(collider: BoxCollider): CollisionFace {
    if (!this.tileMap || collider.isTrigger) return CollisionFace.None

    const transform = collider.entity.getComponent(Transform)
    if (!transform) return CollisionFace.None

    const map    = this.tileMap
    let resolved = CollisionFace.None

    // We may need a second pass if a corner pushout exposes a new overlap.
    for (let pass = 0; pass < 2; pass++) {
      const bounds  = collider.getWorldBounds()
      // Note: no epsilon — Rect.intersection() already returns null for zero-width/height overlap,
      // so a collider edge exactly touching a tile boundary causes no push.
      const minCol  = Math.max(0, Math.floor(bounds.x      / map.tileWidth))
      const maxCol  = Math.min(map.widthInTiles  - 1, Math.floor(bounds.right  / map.tileWidth))
      const minRow  = Math.max(0, Math.floor(bounds.y      / map.tileHeight))
      const maxRow  = Math.min(map.heightInTiles - 1, Math.floor(bounds.bottom / map.tileHeight))

      let pushed = false

      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          if (!map.isTileCollidableAt(col, row)) continue

          const tileRect = new Rect(
            col * map.tileWidth,  row * map.tileHeight,
            map.tileWidth,        map.tileHeight
          )
          // Re-fetch bounds so each push feeds into the next test
          const current = collider.getWorldBounds()
          const result  = testAABB(current, tileRect)
          if (!result.overlaps) continue

          transform.position.x += result.penetration.x
          transform.position.y += result.penetration.y
          resolved = result.face
          pushed   = true
        }
      }

      if (!pushed) break   // no collisions this pass — done early
    }

    return resolved
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private resolveOverlap(
    a: BaseCollider,
    b: BaseCollider,
    penetration: Vector2
  ): void {
    if (a.isStatic && b.isStatic) return
    const tA = a.entity.getComponent(Transform)
    const tB = b.entity.getComponent(Transform)
    if (a.isStatic) {
      if (tB) { tB.position.x -= penetration.x; tB.position.y -= penetration.y }
    } else if (b.isStatic) {
      if (tA) { tA.position.x += penetration.x; tA.position.y += penetration.y }
    } else {
      if (tA) { tA.position.x += penetration.x / 2; tA.position.y += penetration.y / 2 }
      if (tB) { tB.position.x -= penetration.x / 2; tB.position.y -= penetration.y / 2 }
    }
  }
}
