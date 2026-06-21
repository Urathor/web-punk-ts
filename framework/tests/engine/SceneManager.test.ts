import { describe, expect, it } from 'vitest'
import { SceneManager } from '@engine/engine/SceneManager'
import type { IScene } from '@engine/engine/IScene'
import type { IEngine } from '@engine/engine/IEngine'
import { EventEmitter } from '@engine/events'
import type { GameEventMap } from '@engine/events'
import type { IRenderer } from '@engine/renderer'

class BaseTestScene implements IScene {
  onEnterCount = 0
  onExitCount = 0
  onPauseCount = 0
  onResumeCount = 0

  onEnter(_engine: IEngine): void { this.onEnterCount++ }
  onExit(): void { this.onExitCount++ }
  onPause(): void { this.onPauseCount++ }
  onResume(): void { this.onResumeCount++ }
  fixedUpdate(_dt: number): void {}
  update(_dt: number): void {}
  render(_renderer: IRenderer, _interpolation: number): void {}
}

class SceneA extends BaseTestScene {}
class SceneB extends BaseTestScene {}
class SceneC extends BaseTestScene {}

function createEngineStub(): IEngine {
  return {
    events: new EventEmitter<GameEventMap>()
  } as unknown as IEngine
}

describe('SceneManager lifecycle events', () => {
  it('emits scene:pushed and scene:popped', async () => {
    const sm = new SceneManager()
    const engine = createEngineStub()
    const pushed: string[] = []
    const popped: string[] = []

    engine.events.on('scene:pushed', (e) => pushed.push(e.name))
    engine.events.on('scene:popped', (e) => popped.push(e.name))

    const a = new SceneA()
    await sm.push(a, engine)
    sm.pop(engine)

    expect(pushed).toEqual(['SceneA'])
    expect(popped).toEqual(['SceneA'])
  })

  it('emits scene:replaced for replace', async () => {
    const sm = new SceneManager()
    const engine = createEngineStub()
    const replaced: string[] = []

    engine.events.on('scene:replaced', (e) => replaced.push(e.name))

    await sm.push(new SceneA(), engine)
    await sm.replace(new SceneB(), engine)

    expect(replaced).toEqual(['SceneB'])
  })

  it('emits scene:replaced for replaceUnder', async () => {
    const sm = new SceneManager()
    const engine = createEngineStub()
    const replaced: string[] = []

    engine.events.on('scene:replaced', (e) => replaced.push(e.name))

    await sm.push(new SceneA(), engine)
    await sm.push(new SceneB(), engine)
    await sm.replaceUnder(new SceneC(), engine)

    expect(replaced).toEqual(['SceneC'])
  })
})
