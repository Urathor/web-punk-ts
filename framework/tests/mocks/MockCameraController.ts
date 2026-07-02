import type { ICameraController } from '@engine/camera'
import type { ICamera            } from '@engine/camera'

export class MockCameraController implements ICameraController {
  updateCallCount = 0
  lastDt:         number         = 0
  lastCamera:     ICamera | null = null

  update(camera: ICamera, dt: number): void {
    this.updateCallCount++
    this.lastCamera = camera
    this.lastDt     = dt
  }
}
