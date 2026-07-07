# WebPunk.ts

A lightweight 2D canvas game framework for TypeScript, inspired by the classic [FlashPunk](http://useflashpunk.net/) ActionScript library. Build games that run in the browser or wrap as desktop apps via [Tauri](https://tauri.app/).

**Package:** `webpunk.ts` &nbsp;|&nbsp; **Repo:** `web-punk-ts`

---

## Table of Contents

- [Overview](#overview)
- [Setting Up a New Game](#setting-up-a-new-game)
- [Project Structure](#project-structure)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
  - [Engine](#engine)
  - [Scene](#scene)
  - [Entity & Components](#entity--components)
  - [Camera & Layers](#camera--layers)
  - [Renderer](#renderer)
  - [Input](#input)
  - [Collision](#collision)
  - [Tilemap](#tilemap)
  - [Animation](#animation)
  - [UI](#ui)
  - [Audio](#audio)
  - [Assets](#assets)
  - [Events](#events)
  - [Save System](#save-system)
  - [Math](#math)
  - [Tweens](#tweens)

---

## Overview

WebPunk.ts is a fixed-resolution, entity-component canvas game framework. Key characteristics:

- **Logical resolution:** configurable on the renderer (default 320 × 240), scaled up to fill the window — integer, fit, stretch, or fixed
- **Fixed timestep:** physics/logic run at 60 Hz; rendering interpolates between steps
- **Scene stack:** push, pop, and replace scenes — pause menus, transitions, and overlays are first-class
- **Entity/Component:** entities own components; components implement logic and rendering
- **Camera layers:** world-space layers (camera-transformed) and UI layers (screen-space) are registered as named callbacks
- **Tiled integration:** load `.tmj`/`.tmx` maps exported from [Tiled](https://www.mapeditor.org/)
- **Tauri-ready:** the Vite build output can be packaged as a desktop app with no framework changes

---

## Setting Up a New Game

WebPunk.ts ships as the npm package [`webpunk.ts`](https://www.npmjs.com/package/webpunk.ts)
(compiled JavaScript + type declarations). Scaffold a ready-to-run game with one
command, or add the engine to an existing project.

### Option A — Scaffold a new game (recommended)

The companion [`create-webpunk`](https://www.npmjs.com/package/create-webpunk)
initializer generates a Vite + TypeScript project that already depends on
`webpunk.ts`, with a title scene, a gameplay scene stub, input actions, and the
default UI font wired up:

```bash
npm create webpunk@latest my-game
# or, equivalently:
npx create-webpunk my-game
```

Then install and run:

```bash
cd my-game
npm install
npm run dev
```

The generated project looks like:

```
my-game/
├── index.html
├── package.json          ← depends on "webpunk.ts"
├── tsconfig.json
├── vite.config.ts
├── public/
│   ├── css/style.css
│   └── fonts/            ← default UI font (Science Gothic)
└── src/
    ├── main.ts           ← engine bootstrap + action bindings + font load
    ├── constants.ts      ← game-specific constants (gravity, speeds, etc.)
    ├── events.d.ts       ← typed custom event declarations
    └── scenes/
        ├── TitleScene.ts
        └── GameScene.ts
```

### Option B — Add the engine to an existing project

```bash
npm install webpunk.ts
```

```ts
import { Engine, CanvasRenderer } from 'webpunk.ts'
```

Everything in the API reference below is imported by name from the single
`webpunk.ts` package entry — there is no path alias to configure.

### Start the dev server

```bash
npm run dev
```

### Build for distribution

```bash
npm run build
```

The `dist/` folder is a self-contained HTML5 game. Zip it for itch.io, or point Tauri's `distDir` at it for a desktop build.

---

## Project Structure

```
your-game/
├── index.html            ← canvas element lives here
├── package.json
├── tsconfig.json
├── vite.config.ts
├── public/               ← static assets (sprites, sounds, levels, fonts)
│   ├── css/style.css
│   ├── sprites/
│   ├── sounds/
│   └── levels/
└── src/
    ├── main.ts           ← entry point
    ├── constants.ts
    ├── events.d.ts       ← custom event type augmentation
    ├── entities/         ← Entity subclasses
    └── scenes/           ← IScene implementations
```

### `src/main.ts` — entry point pattern

```typescript
import { CanvasRenderer, Engine } from 'webpunk.ts'
import { TitleScene             } from './scenes/TitleScene'

const canvas   = document.getElementById('game-canvas') as HTMLCanvasElement
const renderer = new CanvasRenderer(canvas)
const engine   = new Engine({ canvas, renderer })

engine.actions.defineAction('move-right', [{ type: 'key', code: 'ArrowRight' }, { type: 'key', code: 'KeyD' }])
engine.actions.defineAction('move-left',  [{ type: 'key', code: 'ArrowLeft'  }, { type: 'key', code: 'KeyA' }])
engine.actions.defineAction('jump',       [{ type: 'key', code: 'Space'      }])
engine.actions.defineAction('confirm',    [{ type: 'key', code: 'Enter'      }])
engine.actions.defineAction('cancel',     [{ type: 'key', code: 'Escape'     }])

// Register the default UI font before the first frame (optional). Text falls back
// to a web-safe sans-serif if the load fails, so it never blocks startup.
try {
  await engine.assets.loadFont('Science Gothic', '/fonts/ScienceGothic.ttf')
} catch { /* font missing — widgets use the sans-serif fallback */ }

await engine.start(new TitleScene())
```

### Choosing a resolution & scaling mode

`new CanvasRenderer(canvas)` defaults to a 320 × 240 logical resolution, integer-scaled and pixelated. Pass options to change the target look:

```typescript
const renderer = new CanvasRenderer(canvas, {
  resolution: { width: 384, height: 216 },     // your target look (16:9)
  scaling:    { mode: 'fit', filter: 'pixelated' },
})
```

| `scaling.mode` | Behavior |
|---|---|
| `integer` (default) | Largest whole-number multiple that fits — crispest pixel art |
| `fit` | Largest fractional scale preserving aspect ratio |
| `stretch` | Fills both axes, ignoring aspect ratio (may distort) |
| `fixed` | Exactly `scale ×` the logical size: `{ mode: 'fixed', scale: 3 }` |

`scaling.filter` sets the upscale filter: `'pixelated'` (default, crisp nearest-neighbour) or `'smooth'` (bilinear interpolation on the in-canvas upscale, a faux-CRT blur). It is runtime-toggleable via `renderer.toggleScaleFilter()` (see the [Renderer](#renderer) section for a live example). Everything else in your game keeps working in logical pixels regardless of the resolution you choose.

### `src/events.d.ts` — custom event types

Augment the framework's `GameEventMap` to add game-specific typed events:

```typescript
import 'webpunk.ts'

declare module 'webpunk.ts' {
  interface GameEventMap {
    'player:died':    Record<string, never>
    'coin:collected': { value: number }
    'level:complete': { score: number }
  }
}
```

---

## Core Concepts

### The game loop

WebPunk.ts uses a **fixed timestep** loop:

- `fixedUpdate(dt)` — called at a fixed 60 Hz. Use this for physics, collision, and any deterministic logic.
- `update(dt)` — called once per rendered frame. Use this for input handling, animations, and non-physics state.
- `render(renderer, interpolation)` — called once per frame. `interpolation` is a 0–1 value for smoothing between fixed steps.

### Scenes

Scenes are the top-level unit of game state. Only the top of the scene stack is active. Transitions:

```typescript
engine.replaceScene(new GameScene())  // swap current scene
engine.pushScene(new PauseScene())    // overlay, current scene pauses
engine.popScene()                     // resume previous scene
```

### Entities and Components

Create game objects by subclassing `Entity` and adding components in the constructor:

```typescript
import {
  Entity, Transform, SpriteRenderer,
  BoxCollider, CollisionLayer, SpriteSheet, Vector2,
} from 'webpunk.ts'
import type { Texture } from 'webpunk.ts'

class Player extends Entity {
  readonly collider: BoxCollider

  constructor(tex: Texture, spawnX: number, spawnY: number) {
    super('player')

    const t  = this.addComponent(new Transform())
    t.position = new Vector2(spawnX, spawnY)

    const sheet = new SpriteSheet(tex, 16)        // 16×16 tiles
    const sr    = this.addComponent(new SpriteRenderer())
    sr.sprite     = sheet.sprite(2, 0)
    sr.drawWidth  = 16
    sr.drawHeight = 16

    this.collider        = this.addComponent(new BoxCollider())
    this.collider.width  = 12
    this.collider.height = 12
    this.collider.offset = new Vector2(-6, -6)    // centre the 12×12 box
    this.collider.layer  = CollisionLayer.Player
    this.collider.mask   = CollisionLayer.Enemy
  }
}
```

### Camera layers

The camera renders named layers in order. Register callbacks in `onEnter`, clear them in `onExit`:

```typescript
onEnter(engine: IEngine): void {
  engine.camera.clearLayers()

  engine.camera.addWorldLayer('bg',       -1, (r) => {
    r.drawRect({ x: 0, y: 0, width: mapW, height: mapH }, '#1a1a2e')
  })
  engine.camera.addWorldLayer('tiles',    0, (r, ip) => this._mapEntity?.render(r, ip))
  engine.camera.addWorldLayer('entities', 1, (r, ip) => {
    for (const e of this._entities) e.render(r, ip)
  })
  engine.camera.addUILayer('hud', 10, (r) => this._renderHUD(r))
}

onExit(): void {
  engine.camera.clearLayers()
}
```

---

## API Reference

All public API is imported by name from the `webpunk.ts` package entry — e.g. `import { Engine, Vector2 } from 'webpunk.ts'`.

---

### Engine

```typescript
import { Engine } from 'webpunk.ts'
import type { IEngine } from 'webpunk.ts'
```

#### `new Engine(config)`

| Option | Type | Description |
|---|---|---|
| `canvas` | `HTMLCanvasElement` | The canvas element to render into |
| `renderer` | `IRenderer` | A `CanvasRenderer` instance |
| `debug` | `boolean?` | Reserved for a future explicit toggle — not currently wired. The debug overlay is enabled automatically whenever the build isn't a production build (`process.env.NODE_ENV !== 'production'`), regardless of this option. |
| `saveProvider` | `ISaveProvider?` | Custom save backend (defaults to `localStorage`) |

#### `IEngine` — properties available in scenes and entities

Every system is exposed through its interface, not its concrete class — scenes and
components should depend on `IEngine`'s field types below, not on `Camera`,
`AssetLoader`, etc. directly. Each concrete class still implements the matching
interface, and `Engine` itself constructs the concrete instances internally.

| Property | Type | Description |
|---|---|---|
| `renderer` | `IRenderer` | The active renderer |
| `debugger` | `IDebugger \| null` | The debug overlay controller, or `null` when debug mode is off |
| `assets` | `IAssetLoader` | Load textures and audio |
| `input` | `IInputManager` | Raw key/mouse state |
| `actions` | `IActionMap` | Named action bindings |
| `camera` | `ICamera` | Camera position and layers |
| `collision` | `ICollisionSystem` | Register/unregister colliders |
| `audio` | `IAudioManager` | SFX and BGM playback |
| `events` | `IEventEmitter<GameEventMap>` | Global typed event bus |
| `save` | `ISaveManager` | Persistent save data |
| `ui` | `IUIManager` | Screen-space UI canvas management |

#### Scene management methods

```typescript
engine.replaceScene(scene)        // replace current scene
engine.pushScene(scene)           // push on top (current pauses)
engine.popScene()                 // pop top (previous resumes)
engine.replaceSceneUnder(scene)   // replace the scene below the current one
```

---

### Scene

```typescript
import type { IScene, IEngine } from 'webpunk.ts'
```

Implement `IScene` on every scene class:

```typescript
export class MyScene implements IScene {
  async preload(engine: IEngine, reportProgress: (p: number) => void): Promise<void> {
    // load assets here; call reportProgress(0–1) as they load
  }

  onEnter(engine: IEngine): void { /* set up layers, entities */ }
  onExit(): void                  { /* teardown */               }
  onPause(): void                 { /* scene was pushed over */  }
  onResume(): void                { /* scene was restored */     }

  fixedUpdate(dt: number): void               { /* physics, 60Hz */ }
  update(dt: number): void                    { /* input, state   */ }
  render(renderer: IRenderer, ip: number): void { /* HUD / overlays */ }
}
```

`preload` is optional. If omitted the scene enters immediately. `reportProgress` drives any loading bar you implement.

#### `FadeScene` — built-in fade transition

Push a `FadeScene` on top of the stack to cross-fade between two scenes. It fades to black over `halfDurationMs`, fires `onMidpoint` (swap the scene below), then fades back.

```typescript
import { FadeScene } from 'webpunk.ts'

// In a scene's update():
engine.pushScene(new FadeScene(300, (eng) => {
  eng.replaceSceneUnder(new GameScene())
}))
```

#### `LoadingScene` — built-in loading screen

`LoadingScene` is used automatically by the engine whenever a scene has a `preload()` method. You do not instantiate it directly. It displays a progress bar that smoothly animates toward the reported progress value. To create a fully custom loading screen, implement `IScene` and manage asset loading manually inside `onEnter`.

---

### Entity & Components

```typescript
import {
  Entity, Transform, SpriteRenderer, Animator, HealthComponent, BaseComponent,
} from 'webpunk.ts'
```

#### `Entity`

| Member | Description |
|---|---|
| `name: string` | Human-readable name |
| `active: boolean` | When `false`, `update` and `render` are skipped |
| `addComponent<T>(c: T): T` | Attach a component; sets `c.entity = this` |
| `getComponent<T>(Type): T \| undefined` | Find first component of type |
| `getComponents<T>(Type): T[]` | Find all components of type |
| `hasComponent<T>(Type): boolean` | Check existence |
| `removeComponent<T>(Type): void` | Detach and call `onDetach` |
| `destroy(): void` | Marks entity for removal |

#### `Transform`

| Member | Description |
|---|---|
| `position: Vector2` | Local position in world pixels |
| `scale: Vector2` | Local scale |
| `rotation: number` | Rotation in radians |
| `worldPosition: Vector2` | Computed world-space position (read-only) |
| `worldScale: Vector2` | Computed world-space scale (read-only) |
| `setParent(t \| null)` | Attach to a parent transform |
| `translate(delta)` | Adds delta to position |

#### `SpriteRenderer`

| Member | Description |
|---|---|
| `sprite: Sprite \| null` | The sprite to draw (set from a `SpriteSheet`) |
| `drawWidth: number \| null` | Override draw width (null = use sprite's width) |
| `drawHeight: number \| null` | Override draw height |
| `antiAlias: boolean` | Enable bilinear filtering (default `true`) |

Drawn centered on the entity's `worldPosition`.

#### `Animator`

Drives a `SpriteRenderer` by switching between named `AnimationClip`s.

```typescript
const anim = this.addComponent(new Animator())
anim.setClips({ idle: idleClip, run: runClip, jump: jumpClip })
anim.play('idle')
```

| Method | Description |
|---|---|
| `play(name)` | Switch to a looping clip |
| `playOnce(name, onFinish)` | Play once, call callback when done |
| `isPlaying(name)` | True if named clip is active |
| `getCurrentClipName()` | Name of the active clip |

#### `HealthComponent`

```typescript
const hp = this.addComponent(new HealthComponent(3))
hp.takeDamage(1)
hp.heal(1)
hp.ratio      // 0–1
hp.isDead     // hp <= 0
```

#### Custom components

```typescript
import { BaseComponent } from 'webpunk.ts'

class GravityComponent extends BaseComponent {
  velocityY = 0

  fixedUpdate(dt: number): void {
    this.velocityY += 900 * dt
    const t = this.entity.getComponent(Transform)!
    t.position.y += this.velocityY * dt
  }
}
```

---

### Camera & Layers

```typescript
import { Camera, FollowController } from 'webpunk.ts'
```

#### `Camera`

| Method | Description |
|---|---|
| `addWorldLayer(name, order, fn)` | Register a world-space layer; `fn` receives `(renderer, interpolation)`. Camera transform is applied automatically. |
| `addUILayer(name, order, fn)` | Register a screen-space layer; no camera transform. |
| `removeLayer(name)` | Remove a layer by name |
| `clearLayers()` | Remove all layers |
| `position: Vector2` | Camera world position (top-left corner) |
| `viewport: { x, y, width, height }` | Sub-rectangle of the logical screen the **world** renders into. Defaults to the full screen (set from the renderer's resolution). Shrink it to reserve margins for UI or create in-canvas letterbox bars. |
| `controller` | Assign an `ICameraController` for automatic movement |

Layer `order` values: lower numbers render first (behind). Use negative values for backgrounds.

When `viewport` is smaller than the logical screen, world layers are clipped and offset into it while UI layers still draw across the full screen ("UI in the margins"); the margins show the `clear()` colour. Mouse→world conversions should subtract `viewport.{x, y}` when you use a non-default viewport.

#### `FollowController`

Smoothly follows an entity, with optional deadzone and map clamping:

```typescript
const ctrl = new FollowController({
  lerpFactor: 0.1,                              // 0–1; lower = smoother
  deadzone:   { x: 8, y: 6 },                  // pixels before camera moves
  mapBounds:  { width: 1536, height: 512 },     // clamp to map edges
})
engine.camera.controller = ctrl
ctrl.follow(player)
```

#### Custom camera controller

```typescript
import type { ICameraController, ICamera } from 'webpunk.ts'

class ShakeController implements ICameraController {
  update(camera: ICamera, _dt: number): void {
    camera.position.x += (Math.random() - 0.5) * 4
    camera.position.y += (Math.random() - 0.5) * 4
  }
}
```

---

### Renderer

```typescript
import { CanvasRenderer } from 'webpunk.ts'
import type { IRenderer, TextStyle } from 'webpunk.ts'
```

#### `new CanvasRenderer(canvas, options?)`

| Option | Type | Default | Description |
|---|---|---|---|
| `resolution` | `{ width, height }` | `{ 320, 240 }` | Logical render resolution |
| `scaling` | `ScalingOptions` | `{ mode: 'integer' }` | Browser scaling strategy + upscale `filter` |

`ScalingOptions` = `{ mode: 'integer' \| 'fit' \| 'stretch' } | { mode: 'fixed'; scale: number }`, each optionally with `filter: 'pixelated' \| 'smooth'` (default `'pixelated'`). See [Choosing a resolution & scaling mode](#choosing-a-resolution--scaling-mode).

All coordinates and sizes are in **logical pixels** (your configured resolution, default 320 × 240). The renderer scales to the physical canvas automatically.

| Method | Description |
|---|---|
| `clear(color?)` | Fill the canvas. Defaults to black. |
| `drawImage(image, srcRect, dstRect)` | Draw a sprite or canvas region |
| `drawRect(rect, color, fill?)` | Draw a filled (default) or outlined rectangle |
| `drawCircle(center, radius, color, fill?)` | Draw a filled (default) or outlined circle |
| `drawLine(from, to, color, lineWidth?)` | Draw a line |
| `drawText(text, position, style)` | Draw text. `style: { color, size, font?, align?, baseline? }` — `align` is `'left'` \| `'center'` \| `'right'`, defaults to `'left'`; `baseline` is `'alphabetic'` \| `'top'` \| `'middle'` \| `'bottom'`, defaults to `'alphabetic'` (the canvas default — `position.y` is the text's baseline). Pass `x: cx` with `align: 'center'` to anchor text to the screen centre, or `baseline: 'top'` when `position.y` should be the top of the glyphs (what `UIText` uses internally). |
| `pushTransform(x, y, scaleX?, scaleY?)` | Save state and apply offset/scale |
| `popTransform()` | Restore previous transform state |
| `pushClip(rect)` / `popClip()` | Clip subsequent drawing to a logical-pixel rect (used by the camera viewport) |
| `setImageSmoothing(enabled)` | In-canvas sprite smoothing (`ctx.imageSmoothingEnabled`); does not touch the browser filter |
| `setDrawSmoothing(enabled)` | Toggle sprite smoothing for a single draw call |
| `scaleFilter` | Current upscale filter: `'pixelated'` \| `'smooth'` |
| `setScaleFilter(filter)` / `toggleScaleFilter()` | Set/toggle the upscale filter; persists across frames. The renderer upscales the logical buffer **in-canvas**, so `'smooth'` enables bilinear interpolation on that upscale (`ctx.imageSmoothingEnabled`) for a faux-CRT blur, while `'pixelated'` keeps crisp nearest-neighbour. The matching `canvas.style.imageRendering` is set too as a HiDPI hint. |
| `logicalWidth / logicalHeight` | The configured logical resolution (default 320 / 240) |

#### Runtime scale filter

Construct the renderer at any resolution, then toggle the upscale filter live — e.g. on the **P** key inside a scene's `update()` — to blur the whole screen to a faux-CRT look:

```typescript
const renderer = new CanvasRenderer(canvasEl)

// …later, inside a scene's update():
if (engine.input.isKeyPressed('KeyP')) engine.renderer.toggleScaleFilter()
```

---

### Input

```typescript
import { ActionMap, InputManager } from 'webpunk.ts'
```

#### `ActionMap` (preferred)

Define named actions in `main.ts`, check them in scenes and entities:

```typescript
// Define once in main.ts
engine.actions.defineAction('jump', [
  { type: 'key',   code: 'Space'    },
  { type: 'key',   code: 'ArrowUp'  },
  { type: 'mouse', button: 0        },
])

// Check anywhere you have IEngine
if (engine.actions.isActionPressed('jump')) { ... }  // true for one frame
if (engine.actions.isActionHeld('jump'))    { ... }  // true while held
if (engine.actions.isActionReleased('jump')){ ... }  // true on release
```

#### `InputManager` (raw, via `engine.input`)

```typescript
engine.input.isKeyHeld('ArrowRight')   // true while key held
engine.input.isKeyPressed('Space')     // true for one frame on press
engine.input.isKeyReleased('Escape')   // true for one frame on release
engine.input.mousePosition             // Vector2 in logical pixels
engine.input.isMousePressed(0)         // left button
```

---

### Collision

```typescript
import { BoxCollider, CircleCollider, CollisionFace, CollisionLayer } from 'webpunk.ts'
```

#### `BoxCollider`

`BoxCollider` takes no constructor arguments — create it, then set its properties
(`width` and `height` default to `16`):

```typescript
const bc = this.addComponent(new BoxCollider())
bc.width     = 12                       // collider size in logical pixels (default 16)
bc.height    = 12
bc.offset    = new Vector2(-6, -6)      // offset from entity position (centres the box)
bc.isTrigger = false                    // true = no physics response, just events
bc.isStatic  = false                    // true = immovable (for walls, platforms)
bc.layer     = CollisionLayer.Player    // which layer this collider sits on
bc.mask      = CollisionLayer.Enemy     // which layers this collider tests against

// Callbacks
bc.onCollisionEnter = (other, face) => { ... }
bc.onCollisionExit  = (other)       => { ... }
bc.onTriggerEnter   = (other)       => { ... }
bc.onTriggerExit    = (other)       => { ... }
```

Register in `onEnter`, unregister in `onExit`:

```typescript
onEnter(engine: IEngine): void {
  engine.collision.register(this._collider)
}
onExit(): void {
  engine.collision.unregister(this._collider)
}
```

#### Tile collision

```typescript
// Load a TileMap and hand it to the collision system
engine.collision.setTileMap(map)

// Resolve a BoxCollider against solid tiles (call in fixedUpdate)
const face = engine.collision.resolveTileCollision(this._boxCollider)
if (face === CollisionFace.Bottom) {
  // landed on ground
}
```

`CollisionFace` values: `None | Top | Bottom | Left | Right`

---

### Tilemap

```typescript
import { TiledJsonLoader, TileMapRenderer } from 'webpunk.ts'
import type { TileMap } from 'webpunk.ts'
```

#### Loading a map

Maps are created in [Tiled](https://www.mapeditor.org/) and exported as JSON (`.tmj`). Place them in `public/levels/`.

```typescript
async preload(engine: IEngine): Promise<void> {
  // The loader reads the tileset image referenced by the map, so you don't
  // need to load the tileset texture yourself.
  this._map = await new TiledJsonLoader(engine.assets).load('/levels/world.tmj')
}
```

#### Rendering a map

Attach a `TileMapRenderer` to an entity. It pre-bakes each tile layer to an `OffscreenCanvas` for fast rendering.

```typescript
const mapEntity = new Entity('map')
mapEntity.addComponent(new TileMapRenderer()).setMap(map)
// Render it inside a camera world layer:
engine.camera.addWorldLayer('tiles', 0, (r, ip) => mapEntity.render(r, ip))
```

#### Object layers

Use Tiled object layers to place spawn points, triggers, and other markers:

```typescript
const objLayer = map.objectLayers.find(l => l.name === 'entities')
for (const obj of objLayer?.objects ?? []) {
  if (obj.type === 'player_start') spawnPlayer(obj.x, obj.y)
  if (obj.type === 'enemy')        spawnEnemy(obj.x, obj.y)
  if (obj.type === 'coin')         spawnCoin(obj.x, obj.y)
}
```

#### `TileMap` — useful properties

| Member | Description |
|---|---|
| `widthInPixels / heightInPixels` | Map size in world pixels |
| `tileLayers` | Array of `TileLayerData` (name, tiles[][], collidable) |
| `objectLayers` | Array of `ObjectLayerData` (name, objects[]) |
| `getTileGid(layer, col, row)` | Get the global tile ID at a position |
| `isTileCollidableAt(col, row)` | True if the tile at (col, row) is solid |
| `isCollidable(worldX, worldY)` | True if world position is on a solid tile |
| `worldToTile(worldX, worldY)` | Convert world coords to `{ col, row }` |
| `tileToWorld(col, row)` | Convert tile coords to `Vector2` world position |

---

### Animation

```typescript
import { SpriteSheet, AnimationClipLoader } from 'webpunk.ts'
import type { AnimationClip, Sprite } from 'webpunk.ts'
```

#### `SpriteSheet`

Divides a texture into uniform tiles and returns `Sprite` objects:

```typescript
const sheet = new SpriteSheet(texture, 16, 16)   // tileWidth, tileHeight
const sprite = sheet.sprite(col, row)             // zero-based column and row
const frames = sheet.row(2, 0, 4)                 // row 2, starting at col 0, 4 frames
```

#### Building animation clips manually

```typescript
const clip: AnimationClip = {
  name:   'run',
  loop:   true,
  frames: sheet.row(1, 0, 6).map(sprite => ({ sprite, duration: 80 })),
}
```

#### Loading clips from a JSON file

Animation data can be stored as JSON and loaded via `AnimationClipLoader`:

```typescript
const loader = new AnimationClipLoader(engine.assets)
const clips  = await loader.load('/animations/player-animations.json')
```

---

### UI

```typescript
import {
  UIManager, UICanvas, UIElement, Anchor, BitmapFont,
  UIText, UIPanel, UIProgressBar, UIButton, UIImage, UIGrid,
  // Sprite skins & theming:
  UITheme, nineSlice, solid,
} from 'webpunk.ts'
```

UI elements are screen-space (overlay) widgets managed by `UIManager`, accessed via `engine.ui`. All coordinates and sizes are in logical pixels.

#### `UIManager`

| Method | Description |
|---|---|
| `add(canvas)` | Register an existing `UICanvas` and return it |
| `get(name)` | Find a canvas by name |
| `remove(name)` | Remove a canvas by name |
| `clear()` | Remove all canvases (called automatically when scenes exit) |
| `update(dt)` | Update all canvases (called by engine each frame) |
| `render(renderer, interpolation)` | Render all canvases (called by engine each frame) |

#### `UICanvas`

A named container for UI elements, rendered in sort order:

```typescript
const hud = engine.ui.add(new UICanvas('hud', 10))  // name, sortOrder

hud.addElement(new UIText())
hud.visible   = true
hud.sortOrder = 10
```

| Member | Description |
|---|---|
| `name` | Canvas identifier |
| `visible` | Show or hide all elements in this canvas |
| `sortOrder` | Render order (higher = on top) |
| `addElement(element)` | Add a UI element; calls `element.onAttach()` |
| `removeElement(element)` | Remove an element |

#### `UIElement` (base class)

The base `UIElement` class provides these shared members:

| Member | Description |
|---|---|
| `anchor` | `Anchor` enum for positioning (see below) |
| `offset` | `Vector2` offset from the anchor point |
| `width` | Element width in logical pixels |
| `height` | Element height in logical pixels |
| `visible` | Show or hide this element |
| `sortOrder` | Render order within the canvas (lower renders first) |
| `background` | `UIBackground \| null` — sprite/colour background strategy; `null` uses the widget's own colour fields. Set by a `UITheme` or directly (an explicit value always wins). |
| `themed` | When `false`, a `UITheme` will not assign a background to this element |
| `getPosition()` | Compute top-left position: `anchor + offset` |
| `getBounds()` | Get bounding `Rect` in logical pixels |
| `render(renderer, interpolation)` | Abstract — each widget implements this |
| `update(dt)` | Optional — override for animation or interaction |
| `onAttach()` | Optional — called when added to a canvas |

The framework ships with ready-made widgets (below), so you rarely subclass
`UIElement` directly. When you do need a bespoke widget, implement `render`:

```typescript
import { UIElement } from 'webpunk.ts'
import type { IRenderer } from 'webpunk.ts'

class Crosshair extends UIElement {
  render(renderer: IRenderer): void {
    const p = this.getPosition()
    renderer.drawRect({ x: p.x - 4, y: p.y, width: 8, height: 1 }, '#ffffff')
    renderer.drawRect({ x: p.x, y: p.y - 4, width: 1, height: 8 }, '#ffffff')
  }
}
```

#### Built-in widgets

Import any of these from `webpunk.ts` and add them with `canvas.addElement(...)`,
which returns the element so you can configure it inline.

**`UIText`** — a line of text.

| Property | Description |
|---|---|
| `text` | The string to draw |
| `color` | CSS colour (default `'#ffffff'`) |
| `fontSize` | Size in logical pixels used when `height` is left at `0` (default `8`) |
| `font` | CSS font family used when no `bitmapFont` is set (default `DEFAULT_FONT_FAMILY` — Science Gothic, sans-serif) |
| `bitmapFont` | Optional `BitmapFont` for pixel text |
| `fontScale` | Bitmap-font scale used when `height` is left at `0` |
| `textAlign` | `'left'` \| `'center'` \| `'right'` — alignment within the text's own box (default `'left'`) |

`UIText`'s `width`/`height` default to `0` ("auto"). Leave `height` at `0` and the
text renders at `fontSize`/`fontScale`; set an explicit `height` and the effective
font size/scale is derived to fit it instead. Leave `width` at `0` and the box
auto-sizes to the measured text; set an explicit `width` and use `textAlign` to
position the text (`'left'`, `'center'`, or `'right'`) within it.

**`UIPanel`** — a filled / outlined rectangle.

| Property | Description |
|---|---|
| `fillColor` | Background colour |
| `borderColor` | Border colour |
| `borderWidth` | Border thickness |
| `showFill` / `showBorder` | Toggle fill and border independently |

**`UIProgressBar`** — a fill bar for health, loading, etc., composed of `trackPanel`/
`fillPanel` (`UIPanel` children) plus an internal border overlay and an optional
centered `label` (`UIText`, created on first `showLabel()` call).

| Member | Description |
|---|---|
| `value` | Fill ratio `0.0`–`1.0` |
| `orientation` | `'horizontal'` (default) or `'vertical'` |
| `reversed` | Fill from the far end (right-to-left / bottom-to-top) |
| `fillColor` / `backgroundColor` / `borderColor` | Colours, used when no sprite background is set |
| `showBorder` | Draw the border overlay (default `true`) |
| `trackBackground` / `fillBackground` | Optional sprite/colour overrides for `trackPanel`/`fillPanel` — take priority over the theme's `progressTrack`/`progressFill` tokens |
| `fillMode` | `'crop'` (default) or `'stretch'` — how `fillPanel`'s background fills as `value` changes. `'crop'` reveals a growing window of the full-size sprite (crisp nine-slice edges); `'stretch'` scales `fillPanel` itself to the fill size |
| `trackPanel` / `fillPanel` | The underlying `UIPanel` children, exposed for direct customization |
| `label` | `UIText \| null` — the optional caption, created by `showLabel()` |
| `showLabel(text?)` | Creates (on first call) and shows a centered `label`, returning it for further configuration |

**`UIButton`** — a clickable button, composed of a `UIPanel` background (`bgPanel`)
and a `UIText` label. Pass `engine.input` to the constructor.

| Member | Description |
|---|---|
| `label` | The caption — a `UIText` child; set `button.label.text = 'Heal'` |
| `bgPanel` | The background panel — a `UIPanel` child |
| `onClick` | Callback fired on release inside the button |
| `hoverBackground` / `pressedBackground` | Optional per-state sprite/colour backgrounds; fall back to `background`/theme + a tint when unset |
| `hoverTint` / `pressedTint` | Colour overlay applied over the base background for states with no dedicated background |
| `textColor` | Overrides the theme/default text colour when set (default `null`) |
| `font` | CSS font family for the label when no `bitmapFont` is set (default `DEFAULT_FONT_FAMILY`) |
| `bitmapFont` / `fontSize` | Text-rendering options |

**`UIImage`** — draws a `Sprite`. Set `sprite`, plus optional `width` / `height` to scale.

**`UIGrid`** — a **layout container**, not a widget with its own visuals: it arranges
its children (any `UIElement`, added via the inherited `addChild()`) into a row,
column, or grid, computing each child's `offset` automatically — no manual
anchor/offset math needed for common layouts.

| Member | Description |
|---|---|
| `mode` | `'grid'` (default), `'row'`, or `'column'` |
| `columns` | Number of columns in `'grid'` mode (default `4`); ignored in `'row'`/`'column'` mode |
| `rows` | Optional explicit row count in `'grid'` mode — derived from child count when unset |
| `cellSize` | `null` (default) sizes each row/column dynamically from its children's own size; set a number to force uniform fixed-size cells |
| `padding` | Gap between cells, and around the outer edge, in logical pixels (default `2`) |

```typescript
const hotbar = hud.addElement(new UIGrid())
hotbar.mode     = 'row'
hotbar.cellSize = 20
hotbar.padding  = 2
for (const item of items) {
  const icon = hotbar.addChild(new UIImage())
  icon.sprite = item.sprite
  icon.width  = icon.height = 20
}
```

Build an inventory-style grid from `UIGrid` + `UIImage`/`UIText` children — there is no
separate sprite/quantity cell-data API; compose it from the base widgets instead.

#### `Anchor`

Position UI elements relative to the **configured logical resolution** (320 × 240 by default):

```typescript
import { Anchor } from 'webpunk.ts'

element.anchor = Anchor.TopLeft        // default
element.anchor = Anchor.TopCenter
element.anchor = Anchor.TopRight
element.anchor = Anchor.MiddleLeft
element.anchor = Anchor.Center
element.anchor = Anchor.MiddleRight
element.anchor = Anchor.BottomLeft
element.anchor = Anchor.BottomCenter
element.anchor = Anchor.BottomRight
```

The anchor resolves to a logical-pixel point, then `offset` is added. The points scale
with your resolution — for the default 320 × 240:
- `TopLeft = (0, 0)`, `TopCenter = (160, 0)`, `TopRight = (320, 0)`
- `Center = (160, 120)`, `BottomRight = (320, 240)`, etc.

The Engine sets the anchor reference size to the renderer's logical resolution
automatically. To resolve anchors yourself outside the Engine, call
`setAnchorCanvasSize(width, height)` (exported from `webpunk.ts`) first.

Use a negative `offset` to inset from the right/bottom edges — e.g. `Anchor.TopRight`
with `offset = new Vector2(-52, 6)` sits just inside the top-right corner.

#### Containers & nested anchoring

Any `UIElement` can hold children via `addChild()` — `UIPanel` is the common choice for
grouping widgets so they move together:

```typescript
const panel = hud.addElement(new UIPanel())
panel.anchor = Anchor.Center
panel.offset = new Vector2(-75, -35)
panel.width  = 150
panel.height = 70

// Anchors resolve relative to the panel's own bounds, not the whole canvas.
const title = panel.addChild(new UIText())
title.anchor = Anchor.TopCenter
title.offset = new Vector2(0, 4)   // 4px below the panel's top edge, centred in it

const closeBtn = panel.addChild(new UIButton(engine.input))
closeBtn.anchor = Anchor.TopRight
closeBtn.offset = new Vector2(-18, 2)   // inset from the panel's own top-right corner
closeBtn.label.text = 'X'
```

- Moving or resizing the parent (`panel.offset`, `panel.width`/`height`) moves and
  re-anchors every descendant with it — no manual repositioning needed.
- Nesting is unlimited — a panel can contain another panel, and so on.
- Only elements added directly to a `UICanvas` via `addElement` are top-level; those
  still anchor against the whole logical canvas, exactly as before.
- `addChild` detaches the element from any previous parent first, so reparenting is
  safe. `removeChild` detaches it again (its `parent` becomes `null`).
- A `UITheme` applied to a canvas (or via `setTheme`) walks the whole subtree, so
  themed backgrounds reach nested children too.

#### `BitmapFont`

Render crisp pixel text from a sprite sheet. Load from a JSON descriptor, or build
one directly from a loaded texture:

```typescript
import { BitmapFont } from 'webpunk.ts'

// JSON descriptor fields: { texture, charWidth, charHeight, chars, charsPerRow }
const font = await BitmapFont.load('/fonts/default.json', engine.assets)

// …or construct it manually:
const tex   = await engine.assets.loadTexture('/fonts/default.png')
const font2 = new BitmapFont({
  texture:     tex,
  charWidth:   6,
  charHeight:  8,
  chars:       'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,!?',
  charsPerRow: 16,
})
```

| Method | Description |
|---|---|
| `drawString(renderer, text, x, y, scale?)` | Draw text at a logical-pixel position |
| `measureString(text, scale?)` | Returns `{ width, height }` |
| `BitmapFont.load(path, assets)` | Static — load from a JSON descriptor |

Assign a `BitmapFont` to a `UIText` (or `UIButton`) through its
`bitmapFont` property to use it in place of the default canvas font.

#### Sprite skins & theming

Every background-bearing widget can render a **sprite (nine-slice) background** instead
of a flat rectangle, via a pluggable `UIBackground` strategy. When no background is set,
the widget uses its colour fields exactly as before — the colour look is always the
fallback, so existing UIs keep working unchanged.

```typescript
import { nineSlice, solid, UITheme } from 'webpunk.ts'

// A nine-patch from a sprite (zero insets = a plain stretched sprite):
panel.background = nineSlice(sheet.sprite(0, 0), { left: 4, top: 4, right: 4, bottom: 4 })

// Or the explicit colour strategy (the default look):
panel.background = solid({ fill: '#223044', border: '#48597a' })
```

**Themes.** A `UITheme` assigns backgrounds **and** text styling — colour tokens
(`colors.text` / `border` / `fill`) plus a `fontFamily` and an optional default
`BitmapFont` — to widgets by kind. Set one globally on the `UIManager`, or per `UICanvas`:

```typescript
// Procedural built-in skin — no art assets required:
engine.ui.setTheme(UITheme.createDefault())                       // global default

// Customise the colour tokens, font and corner radius. `fill` / `border` / `accent`
// are baked into the sprite backgrounds; `text` + `fontFamily` style every text widget:
engine.ui.setTheme(UITheme.createDefault({
  fill:       '#223044',
  border:     '#48597a',
  accent:     '#e0a030',
  text:       '#ffe9c0',
  fontFamily: '"Science Gothic", sans-serif',
  radius:     4,
}))

// Or load a real atlas (skin.json names regions, insets, font, fontFamily and colours):
engine.ui.setTheme(await UITheme.load('/ui/skin.json', engine.assets))

hudCanvas.setTheme(myOtherTheme)                                  // per-canvas override
```

Themes are applied when a widget is added (`canvas.addElement`) and re-applied to
existing children by `setTheme`. Applying a theme propagates `colors.text` to
`UIText.color` (and, in turn, `UIButton.label.color`), and `fontFamily` to each text
widget's `font` — so changing the theme's colour/font tokens restyles the **text** too,
not just the backgrounds.

**Precedence (the fallback guarantee):** an explicit `widget.background` you set wins
over a per-canvas theme, which wins over the global manager theme, which wins over the
widget's own colour fields. Opt a widget out of theming with `widget.themed = false`, or
force the colour look with `widget.background = solid({ … })`.

**Buttons** support per-state backgrounds (`hoverBackground` / `pressedBackground`); when
a state has none, the base background is drawn with a `hoverTint` / `pressedTint` (lighten
/ darken). **Progress bars** take a `trackBackground` + `fillBackground` with
`fillMode: 'stretch' | 'crop'`. **`UIImage`** can be drawn as a nine-slice by setting its
`insets`.

**Pixel-art vs HD.** Set `UITheme.smoothing` (default `false`, crisp), applied once per
canvas render. Sprite tints are pre-baked to a cached offscreen canvas, so tinting adds
no per-frame cost.

#### Custom composite widgets

`UITheme.applyTo` only ever dispatches on the two base components, `UIPanel` and
`UIText` — it has no special cases for `UIButton`/`UIProgressBar`/`UIGrid` or any other
widget. Build your own widget out of `UIPanel`/`UIText` children (`addChild`'d in the
constructor) and it is themed automatically, with **zero theme-side code**, because a
`UICanvas`'s theme-application walk recurses into every element's `children`:

```typescript
import { UIElement, UIPanel, UIText } from 'webpunk.ts'
import type { IRenderer } from 'webpunk.ts'

class HealthPip extends UIElement {
  readonly bg    = this.addChild(new UIPanel())
  readonly label = this.addChild(new UIText())

  render(_renderer: IRenderer, _ip: number): void {
    // children render themselves via the generic child walk — nothing to draw here
  }
}
```

If a child's background needs to change every frame based on the composite's own state
(hover/pressed, a fill percentage, etc. — this is how the built-in `UIButton` and
`UIProgressBar` implement their state feedback), set that child's `themed = false` and
read `this.appliedTheme` directly inside the composite's own `update(dt)`, reassigning
the child's `background`/`tint` fields each tick. Keep any "explicit override wins over
theme" field (e.g. a `textColor`) on the composite itself rather than writing it onto
the child directly — once a theme value is written into a child field, there's no way
to tell "the theme set this" apart from "the user explicitly set this".

#### Example: building a HUD

This is the themed HUD from the template's `GameScene` — a panel, label, health bar
and an interactive button, centred on screen. `addElement` returns the widget, so each
one is configured immediately after it is added. Applying `UITheme.createDefault()`
gives every widget a nine-slice sprite background; delete the `setTheme` call and the
same widgets fall back to their colour fields:

```typescript
import {
  UICanvas, UIPanel, UIText, UIProgressBar, UIButton, UITheme, Anchor, solid, Vector2,
} from 'webpunk.ts'
import type { IEngine } from 'webpunk.ts'

function buildHud(engine: IEngine): void {
  engine.ui.setTheme(UITheme.createDefault())
  const hud = engine.ui.add(new UICanvas('demo-hud', 100))   // name, sortOrder

  // Themed container panel (nine-slice background supplied by the theme).
  const panel  = hud.addElement(new UIPanel())
  panel.anchor = Anchor.Center
  panel.offset = new Vector2(-75, -35)
  panel.width  = 150
  panel.height = 70

  const title  = hud.addElement(new UIText())
  title.anchor = Anchor.Center
  title.text   = 'Themed HUD'
  title.offset = new Vector2(-67, -28)

  // Themed progress bar (sprite track + fill come from the theme).
  const health  = hud.addElement(new UIProgressBar())
  health.anchor = Anchor.Center
  health.offset = new Vector2(-67, -13)
  health.width  = 122
  health.height = 9
  health.value  = 0.6

  // Interactive themed button — hover/press reuse the theme's state tints.
  const heal   = hud.addElement(new UIButton(engine.input))
  heal.anchor  = Anchor.Center
  heal.label.text = 'Heal +10%'
  heal.offset  = new Vector2(-67, 3)
  heal.width   = 78
  heal.height  = 16
  heal.onClick = () => { health.value = Math.min(1, health.value + 0.1) }

  // Explicit background overrides the theme — this swatch keeps the flat colour
  // look even while a theme is active (precedence: explicit > theme > colours).
  const swatch      = hud.addElement(new UIPanel())
  swatch.anchor     = Anchor.Center
  swatch.offset     = new Vector2(19, 3)
  swatch.width      = 36
  swatch.height     = 16
  swatch.background = solid({ fill: '#2e7d46', border: '#8be0a4' })
}

// Canvases are removed automatically when the scene exits (engine.ui.clear()),
// or explicitly via engine.ui.remove('demo-hud').
```

---

### Audio

```typescript
import { AudioManager } from 'webpunk.ts'
```

Accessed via `engine.audio`. Audio files must be loaded with `engine.assets.loadAudio()` first.

```typescript
// In preload:
this._jumpSfx = await engine.assets.loadAudio('/sounds/sfx/jump.wav')
this._bgm     = await engine.assets.loadAudio('/sounds/music/level.wav')

// In onEnter / handlers:
engine.audio.playSFX(this._jumpSfx, 0.8)   // volume 0–1, default 1
engine.audio.playBGM(this._bgm, 500)        // 500ms fade-in
engine.audio.stopBGM(300)                   // 300ms fade-out
engine.audio.setSFXVolume(0.5)              // global SFX volume
engine.audio.setBGMVolume(0.7)              // global BGM volume
```

---

### Assets

```typescript
import { AssetLoader } from 'webpunk.ts'
```

Accessed via `engine.assets`. Assets are served from the `public/` folder.

```typescript
const texture = await engine.assets.loadTexture('/sprites/player.png')
const audio   = await engine.assets.loadAudio('/sounds/sfx/hit.wav')

// Batch preload with progress
await engine.assets.preloadTextures(
  ['/sprites/tiles.png', '/sprites/enemies.png'],
  (loaded, total) => reportProgress(loaded / total)
)
```

Assets are cached — loading the same path twice returns the cached value.

#### Fonts

Register custom fonts so the canvas renderer (and the UI text widgets) can use them.
Call these once during startup, before the first frame — the canvas falls back to a
web-safe family until a font is registered, so a failed load never blocks the game.

```typescript
// From a file in public/ (e.g. public/fonts/ScienceGothic.ttf):
await engine.assets.loadFont('Science Gothic', '/fonts/ScienceGothic.ttf')

// Optional FontFace descriptors (weight / style / unicode-range, etc.):
await engine.assets.loadFont('My Font', '/fonts/MyFont.woff2', { weight: '700' })

// …or pull one or more families from Google Fonts:
await engine.assets.loadGoogleFonts('Press Start 2P')
await engine.assets.loadGoogleFonts({ family: 'Inter', axis: 'wght@400;700' })
```

Once registered, use the family name anywhere a font is accepted — `renderer.drawText`,
a `UIText`/`UIButton` `font` property, or a `UITheme`'s `fontFamily`. The
framework's default theme uses **Science Gothic** with a `sans-serif` fallback
(`DEFAULT_FONT_FAMILY`); scaffolded projects ship the font in `public/fonts/` and load
it in `main.ts`. Font loading is a no-op in headless environments (no `FontFace`/`document.fonts`).

---

### Events

```typescript
import { EventEmitter } from 'webpunk.ts'
```

Accessed via `engine.events`. Events are typed via `GameEventMap` (see `src/events.d.ts`).

```typescript
// Listen
engine.events.on('coin:collected', ({ value }) => {
  this._score += value
})

// Emit
engine.events.emit('coin:collected', { value: 100 })

// Unsubscribe
engine.events.off('coin:collected', handler)

// Remove all handlers for an event
engine.events.clear('coin:collected')
```

Always call `off` or `clear` in `onExit` to prevent stale listeners.

---

### Save System

```typescript
import { SaveManager } from 'webpunk.ts'
```

Accessed via `engine.save`. Defaults to `localStorage`; swap the provider for IndexedDB, Tauri's filesystem, etc.

```typescript
// Save
await engine.save.save('player-data', { hp: 3, score: 1200 })

// Load (with fallback default)
const data = await engine.save.load('player-data', { hp: 3, score: 0 })

// Scoped sub-key
const slot1 = engine.save.slot('slot-1')
await slot1.save('progress', { level: 2 })

// Check existence
const hasSave = await engine.save.has('player-data')

// Delete
await engine.save.delete('player-data')
```

---

### Math

```typescript
import { Vector2, Rect } from 'webpunk.ts'
```

#### `Vector2`

```typescript
const v = new Vector2(10, 20)
v.add(other)        // returns new Vector2
v.sub(other)
v.scale(2)
v.normalize()
v.dot(other)
v.lerp(target, t)   // t = 0–1
v.magnitude
v.clone()

Vector2.ZERO   // (0, 0)
Vector2.UP     // (0, -1)
Vector2.DOWN   // (0,  1)
Vector2.LEFT   // (-1, 0)
Vector2.RIGHT  // ( 1, 0)
```

#### `Rect`

```typescript
const r = new Rect(x, y, width, height)
r.right           // x + width
r.bottom          // y + height
r.center          // Vector2
r.contains(point)
r.intersects(other)
r.intersection(other)   // Rect | null
r.clone()

Rect.fromCenter({ x, y }, width, height)
```

---

## Constants

```typescript
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from 'webpunk.ts'
// LOGICAL_WIDTH  = 320
// LOGICAL_HEIGHT = 240
```

Game-specific constants (gravity, speeds, tile size, etc.) belong in your game's `src/constants.ts`.

---

## Tweens

```typescript
import { Tween, Easing } from 'webpunk.ts'
import type { EasingFn } from 'webpunk.ts'
```

Tweens interpolate a `number` from one value to another over a fixed duration. They are **manually ticked** — call `tween.tick(dt)` inside your scene or component's `update(dt)`.

### `new Tween(options)`

| Option | Type | Description |
|---|---|---|
| `from` | `number` | Start value |
| `to` | `number` | End value |
| `duration` | `number` | Duration in milliseconds |
| `easing` | `EasingFn` | An `Easing.*` function or custom `(t) => number` |
| `onUpdate` | `(value: number) => void` | Called every tick with the current value |
| `onComplete` | `() => void` (optional) | Called once when the tween finishes (not fired for `loop` or `pingPong`) |
| `loop` | `boolean` (optional) | Restart from `from` when complete |
| `pingPong` | `boolean` (optional) | Reverse direction each time it completes, oscillating between `from` and `to` |

### Methods

| Member | Description |
|---|---|
| `tick(dt)` | Advance the tween by `dt` ms. Call in `update(dt)`. |
| `isComplete` | `true` once finished (non-looping, non-pingPong) or cancelled |
| `cancel()` | Stop immediately without firing `onComplete` |
| `reset()` | Restart from the beginning; clears a previous cancel |

### Examples

```typescript
// One-shot: fade an overlay out
const fade = new Tween({
  from: 1, to: 0, duration: 400,
  easing: Easing.easeOutQuad,
  onUpdate: (v) => { this._alpha = v },
  onComplete: () => engine.popScene(),
})
// In update(dt):
fade.tick(dt)
```

```typescript
// PingPong: pulse a UI element size from 7 → 9 → 7 continuously
const pulse = new Tween({
  from: 7, to: 9, duration: 900,
  easing: Easing.easeInOutQuad,
  pingPong: true,
  onUpdate: (v) => { this._textSize = v },
})
// In update(dt):
pulse.tick(dt)
// In onPause / onExit:
pulse.cancel()
```

### `Easing` functions

```typescript
Easing.linear
Easing.easeInQuad    / easeOutQuad    / easeInOutQuad
Easing.easeInCubic   / easeOutCubic   / easeInOutCubic
Easing.easeInBack    / easeOutBack    / easeInOutBack
// Custom:
const snap: EasingFn = (t) => t * t * t
```

All easing functions take a normalised time `t ∈ [0, 1]` and return a value in `[0, 1]`.

---

## Desktop Builds with Tauri

Add Tauri to any game project:

```bash
npm install --save-dev @tauri-apps/cli
npx tauri init
```

In `tauri.conf.json` set:
```json
"build": {
  "devUrl":  "http://localhost:5173",
  "distDir": "../dist"
}
```

`npm run build` still produces the `dist/` folder; `npx tauri build` wraps it into a native installer. No framework changes required.
