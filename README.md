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

- **Logical resolution:** 320 × 240 pixels, scaled up to fill the window at any screen size
- **Fixed timestep:** physics/logic run at 60 Hz; rendering interpolates between steps
- **Scene stack:** push, pop, and replace scenes — pause menus, transitions, and overlays are first-class
- **Entity/Component:** entities own components; components implement logic and rendering
- **Camera layers:** world-space layers (camera-transformed) and UI layers (screen-space) are registered as named callbacks
- **Tiled integration:** load `.tmj`/`.tmx` maps exported from [Tiled](https://www.mapeditor.org/)
- **Tauri-ready:** the Vite build output can be packaged as a desktop app with no framework changes

---

## Setting Up a New Game

### 1. Copy the template

The `template/` folder in this repo is the starting point for any new game. Copy it to a new location and rename it.

```
template/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── public/
│   └── css/
│       └── style.css
└── src/
    ├── main.ts          ← engine bootstrap + action bindings
    ├── constants.ts     ← game-specific constants (gravity, speeds, etc.)
    ├── events.d.ts      ← typed custom event declarations
    └── scenes/
        └── TitleScene.ts
```

### 2. Install dependencies

```bash
npm install
```

The template's `package.json` references the framework via a `file:` path pointing at the `framework/` folder in this repo. If you install the package from GitHub instead, change the dependency:

```json
"webpunk.ts": "github:your-username/web-punk-ts"
```

then run `npm install` again.

### 3. Start the dev server

```bash
npm run dev
```

### 4. Build for distribution

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
import { CanvasRenderer } from '@engine/renderer'
import { Engine          } from '@engine/engine'
import { TitleScene      } from './scenes/TitleScene'

const canvas   = document.getElementById('game-canvas') as HTMLCanvasElement
const renderer = new CanvasRenderer(canvas)
const engine   = new Engine({ canvas, renderer })

engine.actions.defineAction('move-right', [{ type: 'key', code: 'ArrowRight' }, { type: 'key', code: 'KeyD' }])
engine.actions.defineAction('move-left',  [{ type: 'key', code: 'ArrowLeft'  }, { type: 'key', code: 'KeyA' }])
engine.actions.defineAction('jump',       [{ type: 'key', code: 'Space'      }])
engine.actions.defineAction('confirm',    [{ type: 'key', code: 'Enter'      }])
engine.actions.defineAction('cancel',     [{ type: 'key', code: 'Escape'     }])

await engine.start(new TitleScene())
```

### `src/events.d.ts` — custom event types

Augment the framework's `GameEventMap` to add game-specific typed events:

```typescript
import '@engine/events/GameEvents'

declare module '@engine/events/GameEvents' {
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
import { Entity    } from '@engine/entities'
import { Transform } from '@engine/entities/components/Transform'
import { SpriteRenderer } from '@engine/entities/components/SpriteRenderer'
import { BoxCollider    } from '@engine/collision'

class Player extends Entity {
  constructor(texture: Texture, x: number, y: number) {
    super('player')
    const t  = this.addComponent(new Transform())
    const sr = this.addComponent(new SpriteRenderer())
    const bc = this.addComponent(new BoxCollider(14, 14))
    t.position.x = x
    t.position.y = y
    const sheet = new SpriteSheet(texture, 16, 16)
    sr.sprite = sheet.sprite(0, 0)
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

All imports use the `@engine` path alias, which is configured in `vite.config.ts` and `tsconfig.json`.

---

### Engine

```typescript
import { Engine     } from '@engine/engine'
import type { IEngine } from '@engine/engine/IEngine'
```

#### `new Engine(config)`

| Option | Type | Description |
|---|---|---|
| `canvas` | `HTMLCanvasElement` | The canvas element to render into |
| `renderer` | `IRenderer` | A `CanvasRenderer` instance |
| `debug` | `boolean?` | Enables debug overlay |
| `saveProvider` | `ISaveProvider?` | Custom save backend (defaults to `localStorage`) |

#### `IEngine` — properties available in scenes and entities

| Property | Type | Description |
|---|---|---|
| `renderer` | `IRenderer` | The active renderer |
| `assets` | `AssetLoader` | Load textures and audio |
| `input` | `InputManager` | Raw key/mouse state |
| `actions` | `ActionMap` | Named action bindings |
| `camera` | `Camera` | Camera position and layers |
| `collision` | `CollisionSystem` | Register/unregister colliders |
| `audio` | `AudioManager` | SFX and BGM playback |
| `events` | `EventEmitter<GameEventMap>` | Global typed event bus |
| `save` | `SaveManager` | Persistent save data |
| `debug` | `boolean` | Whether debug mode is active |
| `ui` | `UIManager` | Screen-space UI canvas management |

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
import type { IScene  } from '@engine/engine/IScene'
import type { IEngine } from '@engine/engine/IEngine'
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
import { FadeScene } from '@engine/engine'

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
import { Entity         } from '@engine/entities'
import { Transform      } from '@engine/entities/components/Transform'
import { SpriteRenderer } from '@engine/entities/components/SpriteRenderer'
import { Animator       } from '@engine/entities/components/Animator'
import { HealthComponent} from '@engine/entities/components/HealthComponent'
import { BaseComponent  } from '@engine/entities/BaseComponent'
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
import { BaseComponent } from '@engine/entities/BaseComponent'

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
import { Camera          } from '@engine/camera'
import { FollowController } from '@engine/camera'
```

#### `Camera`

| Method | Description |
|---|---|
| `addWorldLayer(name, order, fn)` | Register a world-space layer; `fn` receives `(renderer, interpolation)`. Camera transform is applied automatically. |
| `addUILayer(name, order, fn)` | Register a screen-space layer; no camera transform. |
| `removeLayer(name)` | Remove a layer by name |
| `clearLayers()` | Remove all layers |
| `position: Vector2` | Camera world position (top-left corner) |
| `controller` | Assign an `ICameraController` for automatic movement |

Layer `order` values: lower numbers render first (behind). Use negative values for backgrounds.

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
class ShakeController implements ICameraController {
  update(camera: Camera, _dt: number): void {
    camera.position.x += (Math.random() - 0.5) * 4
    camera.position.y += (Math.random() - 0.5) * 4
  }
}
```

---

### Renderer

```typescript
import { CanvasRenderer } from '@engine/renderer'
import type { IRenderer, TextStyle } from '@engine/renderer'
```

All coordinates and sizes are in **logical pixels** (320 × 240 space). The renderer scales to the physical canvas automatically.

| Method | Description |
|---|---|
| `clear(color?)` | Fill the canvas. Defaults to black. |
| `drawImage(image, srcRect, dstRect)` | Draw a sprite or canvas region |
| `drawRect(rect, color, fill?)` | Draw a filled (default) or outlined rectangle |
| `drawLine(from, to, color, lineWidth?)` | Draw a line |
| `drawText(text, position, style)` | Draw text. `style: { color, size, font?, align? }` — `align` is `'left'` \| `'center'` \| `'right'`, defaults to `'left'`. Pass `x: cx` with `align: 'center'` to anchor text to the screen centre. |
| `pushTransform(x, y, scaleX?, scaleY?)` | Save state and apply offset/scale |
| `popTransform()` | Restore previous transform state |
| `logicalWidth / logicalHeight` | Always 320 / 240 |

---

### Input

```typescript
import { ActionMap    } from '@engine/input'
import { InputManager } from '@engine/input'
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
import { BoxCollider    } from '@engine/collision'
import { CircleCollider } from '@engine/collision'
import { CollisionFace  } from '@engine/collision'
```

#### `BoxCollider`

```typescript
const bc = this.addComponent(new BoxCollider(width, height))
bc.offset    = new Vector2(0, 0)   // offset from entity position
bc.isTrigger = false               // true = no physics response, just events
bc.isStatic  = false               // true = immovable (for walls, platforms)
bc.layer     = 0b0001              // bitmask: which layer this collider is on
bc.mask      = 0b1111              // bitmask: which layers this collider hits

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
import { TiledJsonLoader } from '@engine/tilemap'
import { TileMapRenderer } from '@engine/tilemap'
import type { TileMap    } from '@engine/tilemap/TileMap'
```

#### Loading a map

Maps are created in [Tiled](https://www.mapeditor.org/) and exported as JSON (`.tmj`). Place them in `public/levels/`.

```typescript
async preload(engine: IEngine): Promise<void> {
  const tex = await engine.assets.loadTexture('/sprites/tiles.png')
  this._map = await TiledJsonLoader.load('/levels/world.tmj', engine.assets)
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
import { SpriteSheet        } from '@engine/animation'
import { AnimationClipLoader } from '@engine/animation'
import type { AnimationClip  } from '@engine/animation'
import type { Sprite         } from '@engine/animation'
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
import { UIManager    } from '@engine/ui'
import { UICanvas    } from '@engine/ui'
import { UIElement   } from '@engine/ui'
import { Anchor      } from '@engine/ui'
import { BitmapFont  } from '@engine/ui'
```

UI elements are screen-space (overlay) widgets managed by `UIManager`, accessed via `engine.ui`. All coordinates and sizes are in logical pixels.

#### `UIManager`

| Method | Description |
|---|---|
| `add(canvas)` | Create and register a `UICanvas` |
| `get(name)` | Find a canvas by name |
| `remove(name)` | Remove a canvas by name |
| `clear()` | Remove all canvases (called automatically when scenes exit) |
| `update(dt)` | Update all canvases (called by engine each frame) |
| `render(renderer, interpolation)` | Render all canvases (called by engine each frame) |

#### `UICanvas`

A named container for UI elements, rendered in sort order:

```typescript
const hud = new UICanvas('hud', 10)  // name, sortOrder
engine.ui.add(hud)

hud.addElement(new MyUIElement())
hud.visible = true
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

Subclass `UIElement` to create custom UI widgets:

```typescript
class TextLabel extends UIElement {
  text: string = ''
  color: string = '#ffffff'
  size: number = 12

  constructor(x: number, y: number, width: number, height: number) {
    super()
    this.offset = new Vector2(x, y)
    this.width = width
    this.height = height
  }

  render(renderer: IRenderer, _interpolation: number): void {
    renderer.drawText(this.text, this.getPosition(), {
      color: this.color,
      size: this.size,
      align: 'left',
    })
  }

  onAttach(): void {
    // Called when added to a canvas
  }
}
```

| Member | Description |
|---|---|
| `anchor` | `Anchor` enum for positioning (see below) |
| `offset` | `Vector2` offset from anchor point |
| `width` | Element width in logical pixels |
| `height` | Element height in logical pixels |
| `visible` | Show or hide this element |
| `sortOrder` | Render order within the canvas (higher = on top) |
| `getPosition()` | Compute top-left position: `anchor + offset` |
| `getBounds()` | Get bounding `Rect` in logical pixels |
| `render(renderer, interpolation)` | Override to draw the element |
| `update(dt)` | Override for animations or interaction logic |
| `onAttach()` | Override; called when added to a canvas |

#### `Anchor`

Position UI elements using anchors (like game engines):

```typescript
import { Anchor } from '@engine/ui'

const label = new TextLabel(10, 20, 100, 20)
label.anchor = Anchor.TopLeft        // default
label.anchor = Anchor.TopCenter
label.anchor = Anchor.TopRight
label.anchor = Anchor.MiddleLeft
label.anchor = Anchor.Center
label.anchor = Anchor.MiddleRight
label.anchor = Anchor.BottomLeft
label.anchor = Anchor.BottomCenter
label.anchor = Anchor.BottomRight
```

Anchor resolves to a logical pixel position on screen:
- `TopLeft = (0, 0)`, `TopCenter = (160, 0)`, `TopRight = (320, 0)`
- `Center = (160, 120)`, etc.

#### `BitmapFont`

Render bitmap text (pixel fonts). Requires a spritesheet and character mapping:

```typescript
const fontTexture = await engine.assets.loadTexture('/fonts/default.png')
const font = new BitmapFont(fontTexture, {
  charWidth: 6,
  charHeight: 8,
  charsPerRow: 16,
  baseline: 8,
})

// Render bitmap text
font.drawText(renderer, 'Hello World', x, y)
```

#### Example: HUD with score and health

```typescript
import { UICanvas, UIElement, Anchor } from '@engine/ui'
import { Vector2 } from '@engine/math'

class HUDCanvas extends UICanvas {
  private scoreLabel: TextLabel
  private healthLabel: TextLabel

  constructor() {
    super('hud', 100)

    this.scoreLabel = this.addElement(new TextLabel(10, 10, 100, 16))
    this.scoreLabel.anchor = Anchor.TopLeft

    this.healthLabel = this.addElement(new TextLabel(310, 10, 100, 16))
    this.healthLabel.anchor = Anchor.TopRight
    this.healthLabel.offset.x = -10
  }

  setScore(score: number): void {
    this.scoreLabel.text = `Score: ${score}`
  }

  setHealth(hp: number): void {
    this.healthLabel.text = `HP: ${hp}`
  }
}

// In your scene's onEnter:
const hud = new HUDCanvas()
engine.ui.add(hud)
```

---

### Audio

```typescript
import { AudioManager } from '@engine/audio'
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
import { AssetLoader } from '@engine/assets'
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

---

### Events

```typescript
import { EventEmitter } from '@engine/events'
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
import { SaveManager } from '@engine/save'
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
import { Vector2 } from '@engine/math'
import { Rect    } from '@engine/math'
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
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from '@engine/constants'
// LOGICAL_WIDTH  = 320
// LOGICAL_HEIGHT = 240
```

Game-specific constants (gravity, speeds, tile size, etc.) belong in your game's `src/constants.ts`.

---

## Tweens

```typescript
import { Tween, Easing } from '@engine/tween'
import type { EasingFn } from '@engine/tween'
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
