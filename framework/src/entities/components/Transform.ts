import { BaseComponent } from '../BaseComponent'
import { Vector2       } from '@engine/math'

export class Transform extends BaseComponent {
  position: Vector2 = new Vector2(0, 0)
  scale:    Vector2 = new Vector2(1, 1)
  rotation: number  = 0  // radians

  private _parent:   Transform | null = null
  private _children: Transform[]      = []

  // ── Parent/child hierarchy ──────────────────────────────────────────────────

  get parent(): Transform | null { return this._parent }

  setParent(parent: Transform | null): void {
    if (this._parent) {
      this._parent._children = this._parent._children.filter(c => c !== this)
    }
    this._parent = parent
    parent?._children.push(this)
  }

  get children(): readonly Transform[] { return this._children }

  // ── World-space accessors ───────────────────────────────────────────────────

  get worldPosition(): Vector2 {
    if (this._parent) {
      return this._parent.worldPosition.add(this.position)
    }
    return this.position.clone()
  }

  get worldScale(): Vector2 {
    if (this._parent) {
      const ps = this._parent.worldScale
      return new Vector2(ps.x * this.scale.x, ps.y * this.scale.y)
    }
    return this.scale.clone()
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  translate(delta: Vector2): void {
    this.position = this.position.add(delta)
  }
}
