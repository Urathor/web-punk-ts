import { BaseComponent } from '../BaseComponent'

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
      this.entity.events.emit('health:died',    { entity: this.entity })
    } else {
      this.entity.events.emit('health:damaged', { amount, remaining: this.hp })
    }
  }

  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount)
  }
}
