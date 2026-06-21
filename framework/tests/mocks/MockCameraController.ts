import type { ICameraController } from '@engine/camera'
import type { Camera            } from '@engine/camera'

export class MockCameraController implements ICameraController {
  updateCallCount = 0
  lastDt:         number        = 0
  lastCamera:     Camera | null = null

  update(camera: Camera, dt: number): void {
    this.updateCallCount++
    this.lastCamera = camera
    this.lastDt     = dt
  }
}
