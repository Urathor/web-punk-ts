import type { Camera } from './Camera'

export interface ICameraController {
  /** Called each variable-timestep frame (dt in ms). Mutates camera.position. */
  update(camera: Camera, dt: number): void
}
