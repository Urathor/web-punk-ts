import { BaseComponent } from '../BaseComponent'

/** Named event keys emitted on the owning entity's local event bus (`entity.events`). */
export const HealthEvent = {
  Died:    'health:died',
  Damaged: 'health:damaged',
} as const

export class HealthComponent extends BaseComponent {
  maxHp: number
  hp:    number

  constructor(maxHp: number) {
    super()
    this.maxHp = maxHp
    this.hp    = maxHp
  }

  get ratio():  number  { return Math.max(0, this.hp / this.maxHp) }
  get isDead(): boolean { return this.hp <= 0 }

  takeDamage(amount: number): void {
    this.hp = Math.max(0, this.hp - amount)
    if (this.isDead) {
      this.entity.events.emit(HealthEvent.Died,    { entity: this.entity })
    } else {
      this.entity.events.emit(HealthEvent.Damaged, { amount, remaining: this.hp })
    }
  }

  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount)
  }
}
