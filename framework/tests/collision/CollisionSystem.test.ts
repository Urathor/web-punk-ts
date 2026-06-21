import { CollisionSystem, Collider, CollisionLayer } from '@engine/collision'
import { Entity } from '@engine/entities'
import { Transform } from '@engine/entities/components'

function makeEntity(x: number, y: number, w = 10, h = 10) {
  const entity    = new Entity()
  const transform = entity.addComponent(new Transform())
  transform.position.x = x
  transform.position.y = y
  const collider  = entity.addComponent(new Collider())
  collider.width  = w
  collider.height = h
  collider.layer  = CollisionLayer.Default
  collider.mask   = CollisionLayer.Default
  return { entity, collider }
}

describe('CollisionSystem', () => {
  it('fires onCollisionEnter when two solid colliders overlap', () => {
    const sys = new CollisionSystem()
    const { collider: a } = makeEntity(0, 0)
    const { collider: b } = makeEntity(5, 0)   // 5px overlap on X

    const enterSpy = vi.fn()
    a.onCollisionEnter = enterSpy

    sys.register(a)
    sys.register(b)
    sys.update()

    expect(enterSpy).toHaveBeenCalledOnce()
  })

  it('fires onTriggerEnter for trigger colliders and does not push back', () => {
    const sys = new CollisionSystem()
    const { collider: a, entity: ea } = makeEntity(0, 0)
    const { collider: b }             = makeEntity(5, 0)
    a.isTrigger = true

    const triggerSpy = vi.fn()
    a.onTriggerEnter = triggerSpy

    const originalX = ea.getComponent(Transform)!.position.x

    sys.register(a)
    sys.register(b)
    sys.update()

    expect(triggerSpy).toHaveBeenCalledOnce()
    // No positional pushback for triggers
    expect(ea.getComponent(Transform)!.position.x).toBe(originalX)
  })

  it('respects layer mask — no event when mask excludes the other layer', () => {
    const sys = new CollisionSystem()
    const { collider: a } = makeEntity(0, 0)
    const { collider: b } = makeEntity(5, 0)
    a.mask  = CollisionLayer.Enemy    // A only collides with Enemy layer
    b.layer = CollisionLayer.Default   // B is on Default, not Enemy
    b.mask  = CollisionLayer.None      // B also ignores everything — eliminates reverse hit

    const enterSpy = vi.fn()
    a.onCollisionEnter = enterSpy
    b.onCollisionEnter = enterSpy

    sys.register(a)
    sys.register(b)
    sys.update()

    expect(enterSpy).not.toHaveBeenCalled()
  })

  it('does not fire for non-overlapping colliders', () => {
    const sys = new CollisionSystem()
    const { collider: a } = makeEntity(0,   0)
    const { collider: b } = makeEntity(100, 0)   // far apart

    const enterSpy = vi.fn()
    a.onCollisionEnter = enterSpy

    sys.register(a)
    sys.register(b)
    sys.update()

    expect(enterSpy).not.toHaveBeenCalled()
  })

  it('unregister removes the collider from future updates', () => {
    const sys = new CollisionSystem()
    const { collider: a } = makeEntity(0, 0)
    const { collider: b } = makeEntity(5, 0)

    const enterSpy = vi.fn()
    a.onCollisionEnter = enterSpy

    sys.register(a)
    sys.register(b)
    sys.unregister(b)
    sys.update()

    expect(enterSpy).not.toHaveBeenCalled()
  })
})
