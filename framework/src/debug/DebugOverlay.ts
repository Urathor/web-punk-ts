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

export interface DebugStats {
  fps:         number
  frameTimeMs: number
  colliderCount: number
  drawCalls:   number
  sceneStack:  string[]
}

export class DebugOverlay {
  visible = false

  private fpsHistory: number[] = new Array(60).fill(0)
  private historyIdx = 0

  // ── Event monitor ───────────────────────────────────────────────────────────
  private eventLog: { event: string; time: number }[] = []
  private readonly MAX_LOG = 20

  // ── Entity inspector ────────────────────────────────────────────────────────
  private inspectedEntity: Entity | null = null

  toggle(): void { this.visible = !this.visible }

  /** Record a game event for the live event stream. */
  logEvent(event: string): void {
    this.eventLog.unshift({ event, time: performance.now() })
    if (this.eventLog.length > this.MAX_LOG) this.eventLog.length = this.MAX_LOG
  }

  /** Set the entity shown in the inspector panel. */
  inspectEntity(entity: Entity): void {
    this.inspectedEntity = entity
  }

  // ── Render: core metrics panel ─────────────────────────────────────────────

  render(renderer: IRenderer, stats: DebugStats): void {
    if (!this.visible) return

    const pad   = 4
    const lineH = 9

    // FPS history graph
    this.fpsHistory[this.historyIdx] = stats.fps
    this.historyIdx = (this.historyIdx + 1) % 60

    const graphX = pad + 2
    const graphY = pad + 2
    const graphW = 60
    const graphH = 20
    const panelH = graphH + 6 + lineH * 5

    renderer.drawRect(new Rect(pad, pad, 140, panelH), 'rgba(0,0,0,0.75)', true)
    renderer.drawRect(new Rect(graphX, graphY, graphW, graphH), '#111111', true)

    const maxFps = 70
    for (let i = 0; i < 60; i++) {
      const idx   = (this.historyIdx + i) % 60
      const fps   = this.fpsHistory[idx] ?? 0
      const barH  = Math.round((fps / maxFps) * graphH)
      const color = fps >= 55 ? '#44cc44' : fps >= 30 ? '#ccaa22' : '#cc4444'
      renderer.drawRect(new Rect(graphX + i, graphY + graphH - barH, 1, barH), color, true)
    }

    const textX    = pad + 4
    const baseY    = graphY + graphH + 4
    const drawLine = (text: string, row: number) =>
      renderer.drawText(text, { x: textX, y: baseY + row * lineH }, { color: '#ffffff', size: 7 })

    drawLine(`FPS: ${stats.fps}  (${stats.frameTimeMs.toFixed(1)}ms)`, 0)
    drawLine(`Colliders: ${stats.colliderCount}`, 1)
    drawLine(`Draw calls: ${stats.drawCalls}`, 2)
    drawLine(`Scenes: ${stats.sceneStack.join(' > ')}`, 3)
    drawLine('[`] toggle overlay', 4)
  }

  // ── Render: collision wireframes ───────────────────────────────────────────

  renderColliders(renderer: IRenderer, colliders: readonly BaseCollider[], camera: Camera): void {
    if (!this.visible) return

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

  renderInspector(renderer: IRenderer): void {
    if (!this.visible || !this.inspectedEntity) return

    const e   = this.inspectedEntity
    const x   = renderer.logicalWidth - 144
    const pad = 4

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const components = (e as any)._components as IComponent[]
    const panelH = 18 + components.length * 9

    renderer.drawRect(new Rect(x, pad, 140, panelH), 'rgba(0,0,0,0.85)', true)
    renderer.drawRect(new Rect(x, pad, 140, panelH), '#6666aa', false)

    renderer.drawText(`[${e.id}] ${e.name}`,
      { x: x + 4, y: pad + 9 }, { color: '#aaddff', size: 7 })

    components.forEach((c, i) => {
      const label = `${c.constructor.name} [${c.enabled ? 'on' : 'off'}]`
      renderer.drawText(label,
        { x: x + 4, y: pad + 18 + i * 9 }, { color: '#cccccc', size: 7 })
    })
  }

  // ── Render: event monitor panel ────────────────────────────────────────────

  renderEventMonitor(renderer: IRenderer): void {
    if (!this.visible) return

    const x      = 4
    const y      = 4 + 22 + 9 * 5 + 6   // below core metrics panel
    const now    = performance.now()
    const count  = Math.min(this.eventLog.length, 10)
    const panelH = 12 + count * 9

    renderer.drawRect(new Rect(x, y, 140, panelH), 'rgba(0,0,0,0.75)', true)
    renderer.drawText('Events:', { x: x + 4, y: y + 9 }, { color: '#aaaaff', size: 7 })

    this.eventLog.slice(0, 10).forEach((entry, i) => {
      const age   = (now - entry.time) / 1000
      const alpha = Math.max(0.3, 1 - age / 3).toFixed(2)
      renderer.drawText(entry.event,
        { x: x + 8, y: y + 18 + i * 9 },
        { color: `rgba(200,200,200,${alpha})`, size: 6 })
    })
  }

  // ── Render: input state panel ──────────────────────────────────────────────

  renderInputState(renderer: IRenderer, input: InputManager, _actions: ActionMap): void {
    if (!this.visible) return

    const x = renderer.logicalWidth - 144
    const y = 4

    renderer.drawRect(new Rect(x, y + 90, 140, 22), 'rgba(0,0,0,0.75)', true)
    renderer.drawText('Input:', { x: x + 4, y: y + 99 }, { color: '#aaffaa', size: 7 })

    const mouse = input.mousePosition
    renderer.drawText(`Mouse: (${Math.round(mouse.x)}, ${Math.round(mouse.y)})`,
      { x: x + 4, y: y + 108 }, { color: '#cccccc', size: 6 })
  }

  // ── Render: audio state panel ──────────────────────────────────────────────

  renderAudioState(renderer: IRenderer, audio: AudioManager): void {
    if (!this.visible) return

    const x = renderer.logicalWidth - 144
    const y = 4

    renderer.drawRect(new Rect(x, y + 116, 140, 20), 'rgba(0,0,0,0.75)', true)
    renderer.drawText('Audio:', { x: x + 4, y: y + 124 }, { color: '#ffaaaa', size: 7 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bgmName = (audio as any).currentBGMSource ? 'Playing' : 'None'
    renderer.drawText(`BGM: ${bgmName}`,
      { x: x + 4, y: y + 133 }, { color: '#cccccc', size: 6 })
  }
}
