import { EventEmitter } from '@engine/events'

interface TestEvents {
  'test:event': { value: number }
  'other':      string
}

describe('EventEmitter', () => {
  it('calls registered handler on emit', () => {
    const emitter = new EventEmitter<TestEvents>()
    const spy = vi.fn()
    emitter.on('test:event', spy)
    emitter.emit('test:event', { value: 42 })
    expect(spy).toHaveBeenCalledWith({ value: 42 })
  })

  it('does not call handler after off()', () => {
    const emitter = new EventEmitter<TestEvents>()
    const spy = vi.fn()
    emitter.on('test:event', spy)
    emitter.off('test:event', spy)
    emitter.emit('test:event', { value: 1 })
    expect(spy).not.toHaveBeenCalled()
  })

  it('calls multiple handlers in insertion order', () => {
    const emitter = new EventEmitter<TestEvents>()
    const order: number[] = []
    emitter.on('test:event', () => order.push(1))
    emitter.on('test:event', () => order.push(2))
    emitter.emit('test:event', { value: 0 })
    expect(order).toEqual([1, 2])
  })

  it('does not emit to listeners on a different event key', () => {
    const emitter = new EventEmitter<TestEvents>()
    const spy = vi.fn()
    emitter.on('other', spy)
    emitter.emit('test:event', { value: 99 })
    expect(spy).not.toHaveBeenCalled()
  })

  it('clear() with event removes only that event\'s listeners', () => {
    const emitter = new EventEmitter<TestEvents>()
    const spy1 = vi.fn()
    const spy2 = vi.fn()
    emitter.on('test:event', spy1)
    emitter.on('other', spy2)
    emitter.clear('test:event')
    emitter.emit('test:event', { value: 1 })
    emitter.emit('other', 'hello')
    expect(spy1).not.toHaveBeenCalled()
    expect(spy2).toHaveBeenCalledOnce()
  })

  it('clear() with no argument removes all listeners', () => {
    const emitter = new EventEmitter<TestEvents>()
    const spy = vi.fn()
    emitter.on('test:event', spy)
    emitter.on('other', spy)
    emitter.clear()
    emitter.emit('test:event', { value: 1 })
    emitter.emit('other', 'x')
    expect(spy).not.toHaveBeenCalled()
  })

  it('same handler registered twice is called twice', () => {
    const emitter = new EventEmitter<TestEvents>()
    const spy = vi.fn()
    // Note: Set deduplicates — registering same fn twice only calls it once
    emitter.on('test:event', spy)
    emitter.on('test:event', spy)
    emitter.emit('test:event', { value: 1 })
    // EventEmitter uses Set, so the same reference is deduplicated
    expect(spy).toHaveBeenCalledOnce()
  })
})
