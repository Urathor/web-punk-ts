import type { ICamera } from './ICamera'

export interface ICameraController {
  /** Called each variable-timestep frame (dt in ms). Mutates camera.position. */
  update(camera: ICamera, dt: number): void
}
