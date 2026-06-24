# webpunk.ts

A lightweight 2D **canvas game framework** for TypeScript, inspired by the classic
[FlashPunk](http://useflashpunk.net/). Build games that run in the browser or wrap
as desktop apps via [Tauri](https://tauri.app/).

![npm](https://img.shields.io/npm/v/webpunk.ts)

## Install

Add the framework to an existing project:

```bash
npm install webpunk.ts
```

…or scaffold a ready-to-run starter game:

```bash
npm create webpunk@latest my-game
cd my-game
npm install
npm run dev
```

## Quick start

```ts
import { Engine, CanvasRenderer } from 'webpunk.ts'

const canvas   = document.getElementById('game-canvas') as HTMLCanvasElement
const renderer = new CanvasRenderer(canvas)          // logical 320×240 by default
const engine   = new Engine({ canvas, renderer })

engine.actions.defineAction('confirm', [{ type: 'key', code: 'Enter' }])

await engine.start(new TitleScene())                 // your IScene implementation
```

Scaffolding a project with `npm create webpunk` gives you `TitleScene` and
`GameScene` already wired up.

## Features

- Fixed-timestep loop (60 Hz logic) with interpolated rendering
- Fixed logical resolution with integer / fit / stretch scaling
- Scenes, entities & components, camera with render layers
- Canvas renderer, input + action maps, AABB & circle collision
- Tilemaps (Tiled JSON), sprite animation, tweens, UI widgets, audio, save system

## Documentation

Full API reference and guides live in the
[project repository](https://github.com/Urathor/web-punk-ts).

## License

[MIT](./LICENSE)
