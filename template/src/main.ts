import { CanvasRenderer, Engine } from 'webpunk.ts'
import { TitleScene             } from './scenes/TitleScene'

const canvasEl = document.getElementById('game-canvas')
if (!(canvasEl instanceof HTMLCanvasElement)) {
  throw new Error('main: #game-canvas not found or is not a <canvas>')
}

const renderer = new CanvasRenderer(canvasEl)
const engine   = new Engine({ canvas: canvasEl, renderer })

// Input actions — add/remove to match your game
engine.actions.defineAction('move-right', [{ type: 'key', code: 'ArrowRight' }, { type: 'key', code: 'KeyD' }])
engine.actions.defineAction('move-left',  [{ type: 'key', code: 'ArrowLeft'  }, { type: 'key', code: 'KeyA' }])
engine.actions.defineAction('move-up',    [{ type: 'key', code: 'ArrowUp'    }, { type: 'key', code: 'KeyW' }])
engine.actions.defineAction('move-down',  [{ type: 'key', code: 'ArrowDown'  }, { type: 'key', code: 'KeyS' }])
engine.actions.defineAction('confirm',    [{ type: 'key', code: 'Enter' }, { type: 'key', code: 'Space' }])
engine.actions.defineAction('cancel',     [{ type: 'key', code: 'Escape' }])

// Load the default UI font (Science Gothic). Text falls back to sans-serif if
// it's unavailable, so a failed load never blocks startup. Swap the family/path
// here, or call engine.assets.loadGoogleFonts(...) to pull a font from Google.
try {
  await engine.assets.loadFont('Science Gothic', '/fonts/ScienceGothic.ttf')
} catch {
  /* font missing — widgets render with the sans-serif fallback */
}

await engine.start(new TitleScene())
