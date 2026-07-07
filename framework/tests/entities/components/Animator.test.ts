import { Entity }              from '@engine/entities'
import { Animator, AnimatorEvent, type AnimatorFrameEvent } from '@engine/entities/components'
import type { AnimationClip, Sprite } from '@engine/animation'
import { Rect }                from '@engine/math'

function makeSprite(id: number): Sprite {
  return { texture: {} as Sprite['texture'], srcRect: new Rect(id, 0, 16, 16) }
}

function makeClip(name: string, frameCount: number, opts: { duration?: number; loop?: boolean } = {}): AnimationClip {
  const duration = opts.duration ?? 100
  return {
    name,
    loop: opts.loop ?? true,
    frames: Array.from({ length: frameCount }, (_, i) => ({ sprite: makeSprite(i), duration })),
  }
}

function withAnimator(clips: Record<string, AnimationClip>): { entity: Entity; animator: Animator } {
  const entity   = new Entity()
  const animator = entity.addComponent(new Animator())
  animator.setClips(clips)
  return { entity, animator }
}

describe('Animator', () => {
  it('play() switches to the named clip and announces frame 0 via the entity bus', () => {
    const { entity, animator } = withAnimator({ walk: makeClip('walk', 2) })
    const frames: AnimatorFrameEvent[] = []
    entity.events.on(AnimatorEvent.Frame, (p) => frames.push(p as AnimatorFrameEvent))

    animator.play('walk')

    expect(animator.isPlaying('walk')).toBe(true)
    expect(animator.getCurrentClipName()).toBe('walk')
    expect(frames).toHaveLength(1)
  })

  it('play() is a no-op when the same clip is already playing', () => {
    const { entity, animator } = withAnimator({ walk: makeClip('walk', 2) })
    animator.play('walk')
    let emits = 0
    entity.events.on(AnimatorEvent.Frame, () => emits++)
    animator.play('walk')
    expect(emits).toBe(0)
  })

  it('warns (dev-gated) and does nothing when playing an unknown clip', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { animator } = withAnimator({})
    animator.play('missing')
    expect(animator.getCurrentClipName()).toBeNull()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('advances frames as time passes and loops back to frame 0 on a looping clip', () => {
    const { entity, animator } = withAnimator({ walk: makeClip('walk', 2, { duration: 100, loop: true }) })
    const frames: number[] = []
    entity.events.on(AnimatorEvent.Frame, (p) => {
      frames.push((p as AnimatorFrameEvent).sprite.srcRect.x)
    })
    animator.play('walk')       // frame 0 emitted synchronously

    animator.update(100)        // → frame 1
    animator.update(100)        // → loops back to frame 0
    animator.update(100)        // → frame 1 again

    expect(frames).toEqual([0, 1, 0, 1])
  })

  it('playOnce() plays without looping and calls onFinish exactly once after the last frame', () => {
    const { animator } = withAnimator({ attack: makeClip('attack', 2, { duration: 50, loop: true }) })
    const onFinish = vi.fn()

    animator.playOnce('attack', onFinish)
    animator.update(50)   // → frame 1 (last frame)
    expect(onFinish).not.toHaveBeenCalled()

    animator.update(50)   // frame 1 finishes → onFinish fires, clip stays on the last frame
    expect(onFinish).toHaveBeenCalledTimes(1)

    animator.update(50)   // no further onFinish calls once cleared
    expect(onFinish).toHaveBeenCalledTimes(1)
  })

  it('warns (dev-gated) and does nothing when playOnce targets an unknown clip', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { animator } = withAnimator({})
    const onFinish = vi.fn()
    animator.playOnce('missing', onFinish)
    expect(animator.getCurrentClipName()).toBeNull()
    expect(onFinish).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('update() is a no-op when no clip is playing', () => {
    const { animator } = withAnimator({})
    expect(() => animator.update(16)).not.toThrow()
  })
})
