import type { IDebugger, LogMessage } from './IDebugger'
import type { BaseCollider          } from '@engine/collision'
import type { ICamera                } from '@engine/camera'
import type { Entity                } from '@engine/entities'
import { Vector2                    } from '@engine/math'

export class Debugger implements IDebugger {
  readonly enabled = true
  visible   = false
  showGraph = true
  expandedLog = false
  scrollOffset = 0

  readonly messageLog: LogMessage[] = []
  readonly eventLog: { event: string; time: number }[] = []
  inspectedEntity: Entity | null = null

  readonly fpsHistory: number[] = new Array(60).fill(0)
  historyIdx = 0

  toggle(): void { this.visible = !this.visible }
  toggleGraph(): void { this.showGraph = !this.showGraph }
  toggleLogExpansion(): void { this.expandedLog = !this.expandedLog }

  log(message: string): void {
    this.addMessage(message, 'info')
  }

  logWarning(message: string): void {
    this.addMessage(message, 'warn')
  }

  logError(message: string): void {
    this.addMessage(message, 'error')
  }

  private addMessage(text: string, level: LogMessage['level']): void {
    const time = new Date().toTimeString().split(' ')[0] ?? '00:00:00'
    this.messageLog.push({ text, level, timestamp: time })
    if (this.messageLog.length > 99) {
      this.messageLog.shift()
    }
    // Auto-scroll logic: if we were already scrolled up, increment scroll offset to keep view persistent
    if (this.scrollOffset > 0) {
      this.scrollOffset = Math.min(99, this.scrollOffset + 1)
    }
    // Also backup log to standard console in dev mode
    if (level === 'error') {
      console.error(`[Debugger Error] ${text}`)
    } else if (level === 'warn') {
      console.warn(`[Debugger Warning] ${text}`)
    } else {
      console.log(`[Debugger] ${text}`)
    }
  }

  logEvent(event: string): void {
    this.eventLog.unshift({ event, time: performance.now() })
    if (this.eventLog.length > 20) {
      this.eventLog.length = 20
    }
  }

  inspectEntity(entity: Entity): void {
    this.inspectedEntity = entity
  }

  scrollLog(lines: number, maxVisibleLines: number): void {
    const maxScroll = Math.max(0, this.messageLog.length - maxVisibleLines)
    this.scrollOffset = Math.max(0, Math.min(maxScroll, this.scrollOffset + lines))
  }

  handleMouseClick(
    mouse: Vector2,
    colliders: readonly BaseCollider[],
    camera: ICamera,
    logicalWidth: number,
    logicalHeight: number
  ): boolean {
    if (!this.visible) return false

    // 1. Check click in top-left panel's graph toggle button (▲ / ▼)
    // Panel pad = 4. Button is at bx = 130, by = 6, bw = 8, bh = 8.
    if (mouse.x >= 130 && mouse.x <= 138 && mouse.y >= 6 && mouse.y <= 14) {
      this.toggleGraph()
      return true
    }

    // 2. Check click in bottom log panel's drawer toggle button (▲ / ▼)
    // Collapsed: y = logicalHeight - 38. Button: bx = logicalWidth - 14, by = logY + 2.
    // Expanded: y = logicalHeight / 2. Button: bx = logicalWidth - 14, by = logY + 2.
    const logY = this.expandedLog ? (logicalHeight / 2) : (logicalHeight - 38)
    const logBtnX = logicalWidth - 14
    const logBtnY = logY + 2
    if (mouse.x >= logBtnX && mouse.x <= logBtnX + 8 && mouse.y >= logBtnY && mouse.y <= logBtnY + 8) {
      this.toggleLogExpansion()
      return true
    }

    // 3. Inspect colliders under cursor in world space
    const worldMouse = mouse.add(camera.position)
    for (const collider of colliders) {
      if (!collider.enabled || !collider.entity.active) continue
      if (collider.containsPoint(worldMouse)) {
        this.inspectEntity(collider.entity)
        return true
      }
    }

    return false
  }
}
