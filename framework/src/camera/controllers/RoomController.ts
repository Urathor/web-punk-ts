import type { ICameraController             } from '../ICameraController'
import type { Camera                        } from '../Camera'
import type { Entity                        } from '@engine/entities'
import { Transform                          } from '@engine/entities/components/Transform'
import { LOGICAL_WIDTH, LOGICAL_HEIGHT      } from '@engine/constants'

/** Defines a rectangular room in world pixels. */
export interface Room {
  /** Left edge in world pixels. */
  x:      number
  /** Top edge in world pixels. */
  y:      number
  /** Room width in world pixels. */
  width:  number
  /** Room height in world pixels. */
  height: number
  name?:  string
}

/**
 * SNES-style room camera controller.
 *
 * Tracks which room the followed entity is in and smoothly pans the camera
 * to centre on the new room whenever the entity crosses a room boundary.
 * `isPanning` is `true` during the transition — use it to lock player input.
 */
export class RoomController implements ICameraController {
  private _target:       Entity | null = null
  private _rooms:        Room[]
  private _panDuration:  number

  private _currentIndex: number = 0
  private _panProgress:  number = 1   // 1 = idle; 0–<1 = panning
  private _panFromX:     number = 0
  private _panFromY:     number = 0
  private _panToX:       number = 0
  private _panToY:       number = 0

  /** True while a camera pan is in progress. Scene should lock player movement. */
  get isPanning(): boolean { return this._panProgress < 1 }

  /** Index of the room the camera is currently centred on. */
  get currentRoomIndex(): number { return this._currentIndex }

  constructor(rooms: Room[], panDurationMs = 300) {
    this._rooms       = rooms
    this._panDuration = panDurationMs
  }

  /** Set the entity whose position drives room detection. */
  follow(entity: Entity): void {
    this._target = entity
  }

  update(camera: Camera, dt: number): void {
    if (!this._target) return

    const transform = this._target.getComponent(Transform)
    if (!transform) return

    const tx = transform.worldPosition.x
    const ty = transform.worldPosition.y

    // Detect room transition only when idle
    if (this._panProgress >= 1) {
      for (let i = 0; i < this._rooms.length; i++) {
        if (i === this._currentIndex) continue
        const r = this._rooms[i]
        if (!r) continue
        if (tx >= r.x && tx < r.x + r.width &&
            ty >= r.y && ty < r.y + r.height) {
          this._currentIndex = i
          this._panFromX     = camera.position.x
          this._panFromY     = camera.position.y
          this._panToX       = this._centreX(r)
          this._panToY       = this._centreY(r)
          this._panProgress  = 0
          break
        }
      }
    }

    // Advance pan
    if (this._panProgress < 1) {
      this._panProgress = Math.min(1, this._panProgress + dt / this._panDuration)
      const t = this._easeInOut(this._panProgress)
      camera.position.x = this._panFromX + (this._panToX - this._panFromX) * t
      camera.position.y = this._panFromY + (this._panToY - this._panFromY) * t
    } else {
      // Hold camera centred on current room
      const r = this._rooms[this._currentIndex]
      if (r) {
        camera.position.x = this._centreX(r)
        camera.position.y = this._centreY(r)
      }
    }
  }

  /**
   * Immediately snap the camera to a specific room without panning.
   * Use this for initial camera placement and after chest teleports.
   */
  snapToRoom(index: number, camera: Camera): void {
    if (index < 0 || index >= this._rooms.length) return
    this._currentIndex = index
    this._panProgress  = 1
    const r = this._rooms[index]
    if (!r) return
    camera.position.x = this._centreX(r)
    camera.position.y = this._centreY(r)
  }

  private _centreX(r: Room): number {
    return r.x + r.width  / 2 - LOGICAL_WIDTH  / 2
  }

  private _centreY(r: Room): number {
    return r.y + r.height / 2 - LOGICAL_HEIGHT / 2
  }

  private _easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }
}
