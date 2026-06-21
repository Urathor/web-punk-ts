import type { ICameraController }             from '../ICameraController'
import type { Camera }                        from '../Camera'
import { Transform }                          from '@engine/entities/components/Transform'
import type { Entity }                        from '@engine/entities'
import { LOGICAL_WIDTH, LOGICAL_HEIGHT }      from '@engine/constants'

export interface FollowControllerOptions {
  /** Lerp factor per frame normalised to 16.67 ms. 0 = instant snap. Clamped 0–1. */
  lerpFactor?: number
  /** Half-size deadzone in logical pixels. Camera only moves when target exits this box. */
  deadzone?:   { x: number; y: number }
  /** Clamp camera to map bounds (world pixels). */
  mapBounds?:  { width: number; height: number }
}

export class FollowController implements ICameraController {
  private target:    Entity | null = null
  private lerpFactor:   number
  private deadzone:     { x: number; y: number }
  private mapBounds:    { width: number; height: number } | null

  constructor(options: FollowControllerOptions = {}) {
    this.lerpFactor = options.lerpFactor ?? 0.1
    this.deadzone   = options.deadzone   ?? { x: 0, y: 0 }
    this.mapBounds  = options.mapBounds  ?? null
  }

  follow(entity: Entity): void {
    this.target = entity
  }

  update(camera: Camera, dt: number): void {
    if (!this.target) return

    const transform = this.target.getComponent(Transform)
    if (!transform) return

    const targetPos = transform.worldPosition
    const halfW     = LOGICAL_WIDTH  / 2
    const halfH     = LOGICAL_HEIGHT / 2

    const camCentreX = camera.position.x + halfW
    const camCentreY = camera.position.y + halfH
    const dx         = targetPos.x - camCentreX
    const dy         = targetPos.y - camCentreY

    // Target the position that keeps the entity exactly AT the deadzone edge,
    // not the fully-centred position.  Targeting centre overshoots: the camera
    // jumps past the boundary, putting the entity back inside the deadzone and
    // stopping movement, then the entity exits again — oscillating every 1-2
    // frames and producing visible jitter.  Targeting the edge means the error
    // term fed into the lerp is proportional to how far past the boundary the
    // entity is, so the approach is smooth and one-directional.
    let desiredX = camera.position.x
    let desiredY = camera.position.y

    if (dx >  this.deadzone.x)  desiredX = targetPos.x - halfW - this.deadzone.x
    if (dx < -this.deadzone.x)  desiredX = targetPos.x - halfW + this.deadzone.x
    if (dy >  this.deadzone.y)  desiredY = targetPos.y - halfH - this.deadzone.y
    if (dy < -this.deadzone.y)  desiredY = targetPos.y - halfH + this.deadzone.y

    // Lerp toward desired position (dt-normalised to 60 fps)
    const t = this.lerpFactor === 0
      ? 1
      : Math.min(this.lerpFactor * (dt / 16.67), 1)

    camera.position.x += (desiredX - camera.position.x) * t
    camera.position.y += (desiredY - camera.position.y) * t

    // Clamp to map bounds
    if (this.mapBounds) {
      camera.position.x = Math.max(0, Math.min(camera.position.x, this.mapBounds.width  - LOGICAL_WIDTH))
      camera.position.y = Math.max(0, Math.min(camera.position.y, this.mapBounds.height - LOGICAL_HEIGHT))
    }
  }
}
