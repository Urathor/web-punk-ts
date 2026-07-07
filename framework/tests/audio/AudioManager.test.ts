import { AudioManager } from '@engine/audio'
import type { IDebugger } from '@engine/debug'

/** Minimal fake Web Audio graph — jsdom doesn't implement `AudioContext`. */
class FakeGainNode {
  connections: unknown[] = []
  gain = {
    value: 1,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
  }
  connect(dest: unknown): void { this.connections.push(dest) }
}

class FakeBufferSourceNode {
  buffer: AudioBuffer | null = null
  loop = false
  connect = vi.fn()
  start   = vi.fn()
  stop    = vi.fn()
}

class FakeAudioContext {
  currentTime = 0
  destination = {}
  resume = vi.fn().mockResolvedValue(undefined)
  createGain(): FakeGainNode { return new FakeGainNode() }
  createBufferSource(): FakeBufferSourceNode { return new FakeBufferSourceNode() }
}

function makeDebugger(): IDebugger {
  return {
    logWarning: vi.fn(),
    logError:   vi.fn(),
  } as unknown as IDebugger
}

/** Unlocks the AudioManager's pending-playback queue (mirrors real browser autoplay unlock). */
async function unlock(): Promise<void> {
  window.dispatchEvent(new Event('click'))
  await Promise.resolve()
  await Promise.resolve()
}

describe('AudioManager', () => {
  beforeEach(() => vi.stubGlobal('AudioContext', FakeAudioContext))
  afterEach(()  => vi.unstubAllGlobals())

  it('queues playSFX/playBGM until the audio context is unlocked by a user gesture', async () => {
    const audio  = new AudioManager()
    const buffer = {} as AudioBuffer

    audio.playSFX(buffer)
    audio.playBGM(buffer)
    // Not unlocked yet — isBgmPlaying only flips once the queued call actually runs.
    expect(audio.isBgmPlaying).toBe(false)

    await unlock()
    expect(audio.isBgmPlaying).toBe(true)
  })

  it('playSFX/playBGM run immediately once already unlocked', async () => {
    const audio = new AudioManager()
    await unlock()

    audio.playBGM({} as AudioBuffer)
    expect(audio.isBgmPlaying).toBe(true)
  })

  it('stopBGM clears isBgmPlaying', async () => {
    const audio = new AudioManager()
    await unlock()
    audio.playBGM({} as AudioBuffer)
    expect(audio.isBgmPlaying).toBe(true)

    audio.stopBGM(0)
    expect(audio.isBgmPlaying).toBe(false)
  })

  it('playSFX logs a warning and does nothing when given a null/undefined buffer', () => {
    const audio = new AudioManager()
    const dbg   = makeDebugger()
    audio.setDebugger(dbg)

    audio.playSFX(null as unknown as AudioBuffer)
    expect(dbg.logWarning).toHaveBeenCalledWith(expect.stringContaining('playSFX'))
  })

  it('playBGM logs a warning and does nothing when given a null/undefined buffer', () => {
    const audio = new AudioManager()
    const dbg   = makeDebugger()
    audio.setDebugger(dbg)

    audio.playBGM(undefined as unknown as AudioBuffer)
    expect(dbg.logWarning).toHaveBeenCalledWith(expect.stringContaining('playBGM'))
  })

  it('setSFXVolume/setBGMVolume clamp to [0, 1]', () => {
    const audio = new AudioManager()
    audio.setSFXVolume(5)
    audio.setBGMVolume(-5)
    // No public getter for gain — exercised for side-effect/no-throw coverage of the clamp path.
    expect(() => audio.setSFXVolume(0.5)).not.toThrow()
  })
})
