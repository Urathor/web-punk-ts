import { BaseComponent  } from '../BaseComponent'
import type { AnimationClip } from '@engine/animation'

/**
 * Local entity-bus event emitted whenever the playing clip advances to a new
 * frame. Decouples `Animator` from any concrete render component — anything
 * on the same entity (typically `SpriteRenderer`) can subscribe instead of
 * `Animator` reaching into a sibling component directly.
 */
export const AnimatorEvent = {
  Frame: 'animator:frame',
} as const

export interface AnimatorFrameEvent {
  sprite: AnimationClip['frames'][number]['sprite']
}

export class Animator extends BaseComponent {
  private clips:       Record<string, AnimationClip> = {}
  private currentClip: AnimationClip | null          = null
  private frameIndex:  number                        = 0
  private elapsed:     number                        = 0
  private onFinish:    (() => void) | null           = null

  /** Set all clips at once (from AnimationClipLoader result). */
  setClips(allClips: Record<string, AnimationClip>): void {
    this.clips = allClips
  }

  /** Play a clip by name. Does nothing if the clip is already playing. */
  play(clipName: string): void {
    const clip = this.clips[clipName]
    if (!clip) {
      this.warnClipNotFound(clipName)
      return
    }
    if (this.currentClip?.name === clipName) return  // already playing
    this.currentClip = clip
    this.frameIndex  = 0
    this.elapsed     = 0
    this.onFinish    = null
    this.syncSprite()
  }

  /** Play a clip once, ignoring its loop flag, then call onFinish (typically to return to idle). */
  playOnce(clipName: string, onFinish: () => void): void {
    const clip = this.clips[clipName]
    if (!clip) {
      this.warnClipNotFound(clipName)
      return
    }
    this.currentClip = { ...clip, loop: false }
    this.frameIndex  = 0
    this.elapsed     = 0
    this.onFinish    = onFinish
    this.syncSprite()
  }

  isPlaying(clipName: string): boolean {
    return this.currentClip?.name === clipName
  }

  getCurrentClipName(): string | null {
    return this.currentClip?.name ?? null
  }

  // ── IComponent lifecycle ─────────────────────────────────────────────────

  override update(dt: number): void {
    if (!this.currentClip || this.currentClip.frames.length === 0) return

    this.elapsed += dt
    const frameDuration = this.currentClip.frames[this.frameIndex]?.duration ?? 100

    if (this.elapsed >= frameDuration) {
      this.elapsed -= frameDuration
      this.frameIndex++

      if (this.frameIndex >= this.currentClip.frames.length) {
        if (this.currentClip.loop) {
          this.frameIndex = 0
        } else {
          this.frameIndex = this.currentClip.frames.length - 1
          const cb = this.onFinish
          this.onFinish = null
          cb?.()
          return
        }
      }

      this.syncSprite()
    }
  }

  private syncSprite(): void {
    const frame = this.currentClip?.frames[this.frameIndex]
    if (!frame) return
    this.entity.events.emit(AnimatorEvent.Frame, { sprite: frame.sprite } satisfies AnimatorFrameEvent)
  }

  private warnClipNotFound(clipName: string): void {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`Animator: clip "${clipName}" not found`)
    }
  }
}
