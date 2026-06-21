import { Tween  } from '@engine/tween/Tween'
import { Easing } from '@engine/tween/Easing'

describe('Tween', () => {
  it('calls onUpdate with the correctly eased value each tick', () => {
    const updates: number[] = []
    const tween = new Tween({
      from: 0, to: 100, duration: 1000,
      easing: Easing.linear,
      onUpdate: (v) => updates.push(v),
    })

    tween.tick(250)
    tween.tick(250)

    expect(updates[0]).toBeCloseTo(25)
    expect(updates[1]).toBeCloseTo(50)
  })

  it('clamps to `to` and fires onComplete exactly once at the end', () => {
    let completions = 0
    const tween = new Tween({
      from: 0, to: 1, duration: 100,
      easing: Easing.linear,
      onUpdate: () => {},
      onComplete: () => completions++,
    })

    tween.tick(90)
    tween.tick(20)  // overshoots
    tween.tick(50)  // already complete — no extra call

    expect(completions).toBe(1)
  })

  it('sets isComplete after the tween finishes', () => {
    const tween = new Tween({
      from: 0, to: 1, duration: 100,
      easing: Easing.linear,
      onUpdate: () => {},
    })

    expect(tween.isComplete).toBe(false)
    tween.tick(100)
    expect(tween.isComplete).toBe(true)
  })

  it('cancel() stops updates and marks isComplete', () => {
    const updates: number[] = []
    const tween = new Tween({
      from: 0, to: 1, duration: 100,
      easing: Easing.linear,
      onUpdate: (v) => updates.push(v),
    })

    tween.tick(50)
    tween.cancel()
    tween.tick(50)

    expect(updates).toHaveLength(1)
    expect(tween.isComplete).toBe(true)
  })

  it('cancel() does not fire onComplete', () => {
    let completions = 0
    const tween = new Tween({
      from: 0, to: 1, duration: 100,
      easing: Easing.linear,
      onUpdate: () => {},
      onComplete: () => completions++,
    })

    tween.cancel()
    tween.tick(100)

    expect(completions).toBe(0)
  })

  it('reset() restarts the tween from zero and clears a cancel', () => {
    const updates: number[] = []
    const tween = new Tween({
      from: 0, to: 100, duration: 1000,
      easing: Easing.linear,
      onUpdate: (v) => updates.push(v),
    })

    tween.cancel()
    tween.reset()
    tween.tick(500)

    expect(tween.isComplete).toBe(false)
    expect(updates[0]).toBeCloseTo(50)
  })

  it('loop mode never fires onComplete and restarts automatically', () => {
    let completions = 0
    const updates: number[] = []
    const tween = new Tween({
      from: 0, to: 100, duration: 100,
      easing: Easing.linear,
      loop: true,
      onUpdate: (v) => updates.push(v),
      onComplete: () => completions++,
    })

    tween.tick(80)   // t=0.8  → value ≈ 80
    tween.tick(40)   // wraps: t=0.2 → value ≈ 20
    tween.tick(40)   // t=0.6  → value ≈ 60

    expect(completions).toBe(0)
    expect(tween.isComplete).toBe(false)
    expect(updates[1]).toBeCloseTo(20)
  })

  it('pingPong oscillates from→to→from and never completes', () => {
    const updates: number[] = []
    const tween = new Tween({
      from: 0, to: 100, duration: 100,
      easing: Easing.linear,
      pingPong: true,
      onUpdate: (v) => updates.push(v),
    })

    tween.tick(50)   // halfway forward → 50
    tween.tick(50)   // at peak (to)   → 100
    tween.tick(50)   // halfway back   → 50
    tween.tick(50)   // back at start  → 0
    tween.tick(50)   // halfway forward again → 50

    expect(tween.isComplete).toBe(false)
    expect(updates[0]).toBeCloseTo(50)
    expect(updates[1]).toBeCloseTo(100)
    expect(updates[2]).toBeCloseTo(50)
    expect(updates[3]).toBeCloseTo(0)
    expect(updates[4]).toBeCloseTo(50)
  })
})
