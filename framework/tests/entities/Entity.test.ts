import { Entity, BaseComponent } from '@engine/entities'

class TestComponent extends BaseComponent {
  attachCount  = 0
  detachCount  = 0
  updateCount  = 0

  onAttach(): void  { this.attachCount++ }
  onDetach(): void  { this.detachCount++ }
  update(_dt: number): void { this.updateCount++ }
}

describe('Entity', () => {
  it('starts with no components', () => {
    expect(new Entity().getComponent(TestComponent)).toBeUndefined()
  })

  it('addComponent sets the entity reference and calls onAttach', () => {
    const e = new Entity()
    const c = e.addComponent(new TestComponent())
    expect(c.entity).toBe(e)
    expect(c.attachCount).toBe(1)
  })

  it('getComponent returns the correct component', () => {
    const e = new Entity()
    const c = e.addComponent(new TestComponent())
    expect(e.getComponent(TestComponent)).toBe(c)
  })

  it('hasComponent returns true after add, false after remove', () => {
    const e = new Entity()
    expect(e.hasComponent(TestComponent)).toBe(false)
    e.addComponent(new TestComponent())
    expect(e.hasComponent(TestComponent)).toBe(true)
    e.removeComponent(TestComponent)
    expect(e.hasComponent(TestComponent)).toBe(false)
  })

  it('removeComponent calls onDetach and removes the component', () => {
    const e = new Entity()
    const c = e.addComponent(new TestComponent())
    e.removeComponent(TestComponent)
    expect(c.detachCount).toBe(1)
    expect(e.getComponent(TestComponent)).toBeUndefined()
  })

  it('update forwards dt to enabled components', () => {
    const e = new Entity()
    const c = e.addComponent(new TestComponent())
    e.update(16)
    expect(c.updateCount).toBe(1)
  })

  it('inactive entity skips update', () => {
    const e = new Entity()
    const c = e.addComponent(new TestComponent())
    e.active = false
    e.update(16)
    expect(c.updateCount).toBe(0)
  })

  it('disabled component is skipped during update', () => {
    const e = new Entity()
    const c = e.addComponent(new TestComponent())
    c.enabled = false
    e.update(16)
    expect(c.updateCount).toBe(0)
  })

  it('destroy calls onDetach, clears components, and sets active=false', () => {
    const e = new Entity()
    const c = e.addComponent(new TestComponent())
    e.destroy()
    expect(c.detachCount).toBe(1)
    expect(e.active).toBe(false)
    expect(e.getComponent(TestComponent)).toBeUndefined()
  })

  it('getComponents returns all matching components', () => {
    const e  = new Entity()
    const c1 = e.addComponent(new TestComponent())
    const c2 = e.addComponent(new TestComponent())
    expect(e.getComponents(TestComponent)).toEqual([c1, c2])
  })
})
