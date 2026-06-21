import { AssetLoader } from '@engine/assets'
import { Rect        } from '@engine/math'
import type { AnimationClip, AnimationFrame } from './AnimationClip'
import type { Sprite  } from './Sprite'

// ── Internal raw JSON types ──────────────────────────────────────────────────

interface RawFrame {
  col:      number
  row:      number
  duration: number
  /** Optional per-clip loop override. */
  loop?:    boolean
}

interface RawAnimationData {
  texture:     string
  /** Pixel width of a single frame tile. */
  tileWidth:   number
  /** Pixel height of a single frame tile. */
  tileHeight:  number
  defaultLoop: boolean
  clips:       Record<string, RawFrame[]>
}

// ── Loader ───────────────────────────────────────────────────────────────────

export class AnimationClipLoader {
  constructor(private readonly assets: AssetLoader) {}

  async load(path: string): Promise<Record<string, AnimationClip>> {
    const response = await fetch(path)
    if (!response.ok) {
      throw new Error(`AnimationClipLoader: failed to fetch "${path}" — HTTP ${response.status}`)
    }

    const data     = await response.json() as RawAnimationData
    const texture  = await this.assets.loadTexture(data.texture)
    const tw       = data.tileWidth
    const th       = data.tileHeight
    const clips: Record<string, AnimationClip> = {}

    for (const [clipName, rawFrames] of Object.entries(data.clips)) {
      const frames: AnimationFrame[] = rawFrames.map(rf => {
        const sprite: Sprite = {
          texture,
          // Derive pixel rect from col/row + tile dimensions
          srcRect: new Rect(rf.col * tw, rf.row * th, tw, th)
        }
        return { sprite, duration: rf.duration }
      })

      clips[clipName] = {
        name:   clipName,
        frames,
        // Per-frame loop override takes precedence over defaultLoop
        loop:   rawFrames[0]?.loop ?? data.defaultLoop ?? true
      }
    }

    return clips
  }
}
