import type { IRenderer         } from '@engine/renderer'
import type { BaseCollider      } from '@engine/collision'
import type { Camera            } from '@engine/camera'
import type { InputManager      } from '@engine/input'
import type { ActionMap         } from '@engine/input'
import type { AudioManager      } from '@engine/audio'
import type { IComponent        } from '@engine/entities'
import type { Entity            } from '@engine/entities'
import { BoxCollider            } from '@engine/collision'
import { CircleCollider         } from '@engine/collision'
import { Rect                   } from '@engine/math'
import type { Debugger          } from './Debugger'

export interface DebugStats {
  fps:         number
  frameTimeMs: number
  colliderCount: number
  drawCalls:   number
  debugDrawCalls: number
  sceneStack:  string[]
}

export class DebugOverlay {

  // ── Render: core metrics panel ─────────────────────────────────────────────

  render(renderer: IRenderer, dbg: Debugger, stats: DebugStats): void {
    if (!dbg.visible) return

    const pad   = 4
    const lineH = 9

    // FPS history graph
    dbg.fpsHistory[dbg.historyIdx] = stats.fps
    dbg.historyIdx = (dbg.historyIdx + 1) % 60

    const graphX = pad + 2
    const graphY = pad + 2
    const graphW = 60
    const graphH = dbg.showGraph ? 18 : 0
    const lineCount = 5
    const panelH = (dbg.showGraph ? graphH + 6 : 4) + lineCount * lineH

    // Metrics panel background
    renderer.drawRect(new Rect(pad, pad, 140, panelH), 'rgba(0,0,0,0.75)', true)

    // Metrics panel graph toggle button (▲ / ▼) at top-right
    const bx = 130
    const by = 6
    const bw = 8
    const bh = 8
    renderer.drawRect(new Rect(bx, by, bw, bh), '#555555', false)
    renderer.drawText(dbg.showGraph ? '▲' : '▼', { x: bx + 2, y: by + 6 }, { color: '#ffffff', size: 6 })

    if (dbg.showGraph) {
      renderer.drawRect(new Rect(graphX, graphY, graphW, graphH), '#111111', true)

      const maxFps = 70
      for (let i = 0; i < 60; i++) {
        const idx   = (dbg.historyIdx + i) % 60
        const fps   = dbg.fpsHistory[idx] ?? 0
        const barH  = Math.round((fps / maxFps) * graphH)
        const color = fps >= 55 ? '#44cc44' : fps >= 30 ? '#ccaa22' : '#cc4444'
        renderer.drawRect(new Rect(graphX + i, graphY + graphH - barH, 1, barH), color, true)
      }
    }

    const textX    = pad + 4
    const baseY    = dbg.showGraph ? graphY + graphH + 12 : pad + 4
    const drawLine = (text: string, row: number) =>
      renderer.drawText(text, { x: textX, y: baseY + row * lineH }, { color: '#ffffff', size: 7 })

    drawLine(`FPS: ${stats.fps}  (${stats.frameTimeMs.toFixed(1)}ms)`, 0)
    drawLine(`Colliders: ${stats.colliderCount}`, 1)
    drawLine(`Draw calls: ${stats.drawCalls} (+${stats.debugDrawCalls})`, 2)
    drawLine(`Scenes: ${stats.sceneStack.join(' > ')}`, 3)
    drawLine('[`] toggle  [L] log panel', 4)
  }

  // ── Render: collision wireframes ───────────────────────────────────────────

  renderColliders(renderer: IRenderer, colliders: readonly BaseCollider[], camera: Camera, dbg: Debugger): void {
    if (!dbg.visible) return

    renderer.pushTransform(-Math.round(camera.position.x), -Math.round(camera.position.y))

    for (const collider of colliders) {
      if (!collider.enabled || !collider.entity.active) continue
      const color = collider.isTrigger ? '#44aaff' : '#ff4444'

      if (collider instanceof BoxCollider) {
        renderer.drawRect(collider.getWorldBounds(), color, false)
      } else if (collider instanceof CircleCollider) {
        const c = collider.getWorldCenter()
        const r = collider.radius
        renderer.drawRect(new Rect(c.x - r, c.y - r, r * 2, r * 2), color, false)
      }
    }

    renderer.popTransform()
  }

  // ── Render: entity inspector panel ────────────────────────────────────────

  renderInspector(renderer: IRenderer, dbg: Debugger): void {
    if (!dbg.visible || !dbg.inspectedEntity) return

    const e   = dbg.inspectedEntity
    const x   = 4
    
    const graphH = dbg.showGraph ? 18 : 0
    const metricsPanelH = (dbg.showGraph ? graphH + 6 : 4) + 5 * 9
    const panelY = 4 + metricsPanelH + 4

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const components = (e as any)._components as IComponent[]
    const panelH = 18 + components.length * 9

    renderer.drawRect(new Rect(x, panelY, 140, panelH), 'rgba(0,0,0,0.85)', true)
    renderer.drawRect(new Rect(x, panelY, 140, panelH), '#6666aa', false)

    renderer.drawText(`[${e.id}] ${e.name.substring(0, 16)}`,
      { x: x + 4, y: panelY + 9 }, { color: '#aaddff', size: 7 })

    components.forEach((c, i) => {
      const label = `${c.constructor.name.substring(0, 16)} [${c.enabled ? 'on' : 'off'}]`
      renderer.drawText(label,
        { x: x + 4, y: panelY + 18 + i * 9 }, { color: '#cccccc', size: 7 })
    })
  }

  // ── Render: event monitor panel ────────────────────────────────────────────

  renderEventMonitor(renderer: IRenderer, dbg: Debugger): void {
    if (!dbg.visible) return

    const x      = renderer.logicalWidth - 144
    const y      = 4 + 40 + 4 // placed below the system status panel (height 40)

    const now    = performance.now()
    const count  = Math.min(dbg.eventLog.length, 5)
    const panelH = 12 + count * 8

    renderer.drawRect(new Rect(x, y, 140, panelH), 'rgba(0,0,0,0.75)', true)
    renderer.drawText('Events:', { x: x + 4, y: y + 9 }, { color: '#aaaaff', size: 7 })

    dbg.eventLog.slice(0, 5).forEach((entry, i) => {
      const age   = (now - entry.time) / 1000
      const alpha = Math.max(0.3, 1 - age / 3).toFixed(2)
      renderer.drawText(entry.event,
        { x: x + 8, y: y + 17 + i * 8 },
        { color: `rgba(200,200,200,${alpha})`, size: 6 })
    })
  }

  // ── Render: combined system panel (top-right) ─────────────────────────────

  renderSystemPanel(renderer: IRenderer, dbg: Debugger, input: InputManager, audio: AudioManager): void {
    if (!dbg.visible) return

    const pad = 4
    const x   = renderer.logicalWidth - 84
    const y   = 4
    const w   = 80
    const h   = 40

    // Draw background
    renderer.drawRect(new Rect(x, y, w, h), 'rgba(0,0,0,0.75)', true)

    // Input section
    renderer.drawText('System:', { x: x + 4, y: y + 8 }, { color: '#aaffaa', size: 7 })
    const mouse = input.mousePosition
    renderer.drawText(`Mouse:(${Math.round(mouse.x)},${Math.round(mouse.y)})`,
      { x: x + 4, y: y + 17 }, { color: '#cccccc', size: 6 })

    // Audio section
    renderer.drawText('Audio:', { x: x + 4, y: y + 27 }, { color: '#ffaaaa', size: 7 })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bgmName = (audio as any).currentBGMSource ? 'Playing' : 'None'
    renderer.drawText(`BGM: ${bgmName}`,
      { x: x + 4, y: y + 36 }, { color: '#cccccc', size: 6 })
  }

  // ── Render: bottom message log panel ──────────────────────────────────────

  renderMessageLog(renderer: IRenderer, dbg: Debugger): void {
    if (!dbg.visible) return

    const pad = 4
    const logW = renderer.logicalWidth - 8
    const logH = dbg.expandedLog ? Math.floor(renderer.logicalHeight / 2 - 4) : 34
    const logX = 4
    const logY = dbg.expandedLog ? Math.floor(renderer.logicalHeight / 2) : (renderer.logicalHeight - 38)

    // Draw background
    renderer.drawRect(new Rect(logX, logY, logW, logH), 'rgba(0,0,0,0.85)', true)
    
    // Draw U-shaped border (left, top, right) to prevent bottom text overlap
    renderer.drawLine({ x: logX, y: logY + logH }, { x: logX, y: logY }, '#444444')
    renderer.drawLine({ x: logX, y: logY }, { x: logX + logW, y: logY }, '#444444')
    renderer.drawLine({ x: logX + logW, y: logY }, { x: logX + logW, y: logY + logH }, '#444444')

    // Header title
    renderer.drawText('Message Log:', { x: logX + 4, y: logY + 8 }, { color: '#aaaaff', size: 7 })

    // Drawer button (▲ / ▼) at top-right of the log panel
    const btnX = renderer.logicalWidth - 14
    const btnY = logY + 2
    renderer.drawRect(new Rect(btnX, btnY, 8, 8), '#555555', false)
    renderer.drawText(dbg.expandedLog ? '▼' : '▲', { x: btnX + 2, y: btnY + 6 }, { color: '#ffffff', size: 6 })

    // Calculate maximum logs that can fit in the remaining height
    const maxLines = dbg.expandedLog ? Math.floor((logH - 12) / 8) : 3

    // Show scroll status/indicator when expanded and scrollable
    if (dbg.expandedLog && dbg.messageLog.length > maxLines) {
      renderer.drawText(`[Scroll: ${dbg.scrollOffset}]`,
        { x: btnX - 64, y: logY + 8 }, { color: '#888888', size: 6 })
    }

    // Render log lines
    if (dbg.messageLog.length === 0) {
      renderer.drawText('No logs recorded.', { x: logX + 8, y: logY + 18 }, { color: '#777777', size: 6 })
      return
    }

    // Get slice of logs based on scrollOffset
    const startIdx = Math.max(0, dbg.messageLog.length - maxLines - dbg.scrollOffset)
    const endIdx   = Math.min(dbg.messageLog.length, startIdx + maxLines)
    const visibleLogs = dbg.messageLog.slice(startIdx, endIdx)

    visibleLogs.forEach((msg, i) => {
      let color = '#cccccc'
      if (msg.level === 'warn') color = '#ffbb00'
      if (msg.level === 'error') color = '#ff4444'

      const lineY = logY + 18 + i * 8
      renderer.drawText(`${msg.timestamp} ${msg.text.substring(0, 52)}`,
        { x: logX + 8, y: lineY }, { color, size: 6 })
    })
  }
}
