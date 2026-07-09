# Patch Notes

Running release notes for **webpunk.ts** and the `create-webpunk` scaffolder.
Newest entries first.

## 0.2.8

### Canvas UI System
- **Fixed: `UIPanel.showFill`/`showBorder` now actually work when a `background` is
  assigned** — previously `UIPanel.render()` returned before ever checking these
  flags once any background (theme-assigned or explicit) was set, so toggling them
  silently did nothing for any themed/sprite-backed panel. `UIBackground` gained
  optional `showFill?`/`showBorder?` properties; `UIPanel` now writes its own flags
  onto whatever background is assigned before drawing, with no `instanceof`/
  concrete-type knowledge of the background strategy. `SolidColorBackground` honors
  them; a nine-slice sprite background has no separate fill/border layer to toggle
  and silently ignores them (a documented limitation, not a bug — the look is baked
  into the art).
- **`generateNineSliceSprite(opts)`** — the procedural rounded-rect tile generator
  previously private inside `UITheme.createDefault()` is now a public factory
  (`framework/src/ui/backgrounds/generate.ts`, exported from `webpunk.ts`). Bakes one
  tile to its own offscreen canvas and returns a `NineSliceBackground` (falling back
  to a `SolidColorBackground` when no 2D canvas context is available, e.g. headless).
  Usable directly to build custom generated skins, not just internally.
- **`ThemeSkin` + `UITheme.skins` registry — themes can now hold multiple named
  skins.** Each widget category's background is no longer a single fixed field on
  `UITheme`; a `ThemeSkin` is a matched bundle (`panel`, `button`, `buttonHover`,
  `buttonDown`, `buttonTint`, `progressTrack`, `progressFill`, plus an optional
  per-skin `font`/`fontFamily` override) and `UITheme.skins: Record<string,
  ThemeSkin>` holds any number of them by name (always at least `'default'`).
  `theme.addSkin(name, skin)` registers more; a widget opts into one via its own new
  `skinName` field (default `'default'`) — inherited from `UIElement`, so any widget
  (built-in or custom) supports skin selection with zero extra plumbing. Every
  `ThemeSkin` field is optional and procedurally generated when omitted, so
  `new ThemeSkin()` alone reproduces the default look. `UITheme.createDefault()` and
  `UITheme.load()` both now funnel through `ThemeSkin` — one canonical construction
  path instead of duplicated generation/parsing logic.
- **Breaking:** `UITheme.panel` / `buttonHover` / `buttonPressed` / `progressTrack` /
  `progressFill` / `buttonHoverTint` / `buttonPressedTint` (flat fields) are removed
  — use `theme.skins.default.*` (or `theme.getSkin(name)`) instead. `buttonTint` is
  now a single field per skin (instead of separate hover/pressed tints); hover
  applies it at its own strength, pressed applies it more intensely (`1.5×`, capped
  at `1`) so both states stay visually distinct from one tint definition. No
  back-compat shim, consistent with this codebase's existing precedent for internal
  UI restructurings.
- **Fixed: a one-sprite `ThemeSkin` (only `panel`/`button` supplied) now tints that
  sprite for hover/pressed feedback, instead of swapping to an unrelated
  procedurally-generated tile.** `ThemeSkin` only auto-generates *distinct*
  `buttonHover`/`buttonDown` tiles when the caller didn't supply their own
  `panel`/`button` art either (preserving the default skin's classic
  lighter-hover/darker-pressed look); when the caller *did* supply real art but left
  hover/pressed unset, those fields now default to the same reference as `button`,
  and `UIButton` tints that shared reference via `buttonTint` instead of drawing it
  as untinted "dedicated" art. A genuinely distinct hover/pressed sprite (explicitly
  supplied) is still drawn as-is, untinted.

## 0.2.7

A SOLID/professional-standards remediation pass (see `docs/solid-review-tasklist.md`)
focused on removing extensibility traps and hygiene issues in the collision system,
tightening a handful of interfaces, splitting up `Engine`, and relaxing scene
ergonomics. No public rendering/gameplay behavior changes — this release is almost
entirely internal cleanup plus a few small, backwards-compatible API additions.

### Collision System
- **Collider shape polymorphism** — `CollisionSystem.testPair()` no longer branches
  on `instanceof BoxCollider`/`instanceof CircleCollider`; pairs are now resolved via
  a `shape`-keyed registry (`ColliderPairTests.ts`). Adding a third collider shape no
  longer means hunting down three separate `instanceof` chains.
- **No more silent non-collisions** — an unrecognized shape pair now logs a one-time
  dev-gated warning instead of silently reporting "no overlap."
- **`drawDebug(renderer)` and `containsPoint(point)` added to colliders** — fixes two
  pre-existing bugs: circles rendered as squares in the debug overlay, and circles
  couldn't be clicked/inspected in the debug inspector. Both now work correctly for
  `CircleCollider`.
- **Tile collision stays `BoxCollider`-only by design** — but now logs a one-time
  dev-gated warning when a non-box collider coexists with an active tilemap, instead
  of failing without explanation.

### Interfaces
- `IRenderer.getDebugStats?(): RendererDebugStats` — implemented by `CanvasRenderer`;
  removes an `(this.renderer as any)` reach-in that used to live in `Engine`.
- `Entity.getAllComponents(): readonly IComponent[]` — a supported way to enumerate
  every component on an entity (used by the debug overlay's inspector; previously
  required piercing the private `_components` field).
- `IAudioManager.isBgmPlaying: boolean` — replaces an `(audio as any).currentBGMSource`
  reach-in previously needed by the debug overlay.

### Scene Lifecycle (`IScene`)
- `onExit`, `onPause`, `onResume`, and `fixedUpdate` are now **optional** on `IScene`
  (matching the existing `preload?` treatment) — only `onEnter`, `update`, and
  `render` remain required. Non-breaking: existing scenes that implement all methods
  keep working unchanged; new scenes can omit whichever lifecycle hooks they don't
  need (e.g. a menu scene with no physics can skip `fixedUpdate` entirely).
- `SceneManager` call sites updated to optional-chain these methods.
- The `template/` starter scenes (`TitleScene`/`GameScene`) had their now-unneeded
  empty lifecycle method bodies removed.

### Engine Internals
- `Engine` no longer carries loose FPS/frame-time counter fields or debug-hotkey
  handling directly — that behavior moved to two new internal classes,
  `FrameStats` (`framework/src/engine/`) and `DebugController`
  (`framework/src/debug/`). This is purely an internal reorganization for
  maintainability (SRP); `Engine`'s public surface is unchanged.
- The debug-overlay's zero-cost production strip is preserved and verified: the
  literal `process.env.NODE_ENV !== "production"` check still appears unresolved in
  the built `dist/index.js`, so debug code is dead-code-eliminated from production
  bundles exactly as before.

### Quick Wins
- Named-const hoisting for previously-magic strings: `HealthEvent.Died`/
  `HealthEvent.Damaged` (was raw `'health:died'`/`'health:damaged'` string literals,
  now exported from `webpunk.ts` for type-safe event listening), `PREVENTED_KEYS` in
  `InputManager`, and `TILE_LAYER_TYPE`/`OBJECT_LAYER_TYPE`/`COLLIDABLE_PROPERTY_KEY`
  in `TiledJsonLoader`.
- `Animator.play()`/`playOnce()` now share a single dev-gated warning path for a
  missing clip, instead of one warning unconditionally and the other failing
  silently.
- **`Animator` decoupled from `SpriteRenderer`** — `Animator` no longer imports or
  directly mutates `SpriteRenderer`; it emits an `AnimatorEvent.Frame` event on the
  entity's local event bus, which `SpriteRenderer` subscribes to on attach. No
  consumer-facing change.
- `Entity`'s internal ID counter can now be reset via the exported (test-only)
  `resetEntityIdCounter()`, so tests no longer leak entity IDs across suites.

### Tests
- Added `MockAssetLoader` and `MockAudioProvider` to `framework/tests/mocks/`
  alongside the existing `MockInputManager`.
- Added 30 new tests covering `Animator` playback/looping/`playOnce`,
  `AnimationClipLoader` JSON parsing, `TiledJsonLoader` and `TileMap`, and
  `AudioManager` (via a fake Web Audio graph, since jsdom has no real
  implementation) — bringing the suite to 219/219 passing across 29 files.

## 0.2.6

### ⚠ Breaking Changes (UI widget composition)
`UIButton`, `UIProgressBar`, and `UIGrid` were rebuilt as compositions of the base
`UIPanel`/`UIText` widgets (or, for `UIGrid`, repurposed into a layout container) as
part of a wider push to make custom composite widgets themeable for free. Migration:

| Old | New |
|---|---|
| `button.label = 'text'` | `button.label.text = 'text'` (`label` is now a `UIText` child) |
| `button.normal` / `.hover` / `.pressed` (`ButtonColors`) | removed — use `hoverBackground`/`pressedBackground`, or let the default background auto-tint via `hoverTint`/`pressedTint` |
| `UITheme.buttonNormal` | removed — buttons fall back to the generic `panel` theme token |
| `progressBar.trackColor`/`fillColor` still work | now backed internally by `trackPanel`/`fillPanel` children — no consumer-facing change, but `trackBackground`/`fillBackground` can now be set for sprite tracks/fills |
| `grid.setCell(row, col, { sprite, quantity, selected })` / `getCell`/`clearCell` (`GridCell`) | removed entirely, no shim — `UIGrid` is now a layout container: add any `UIElement` via `addChild()` and set `mode`/`columns`/`rows`/`cellSize`/`padding` to arrange them |
| `UITheme.gridCell` / `.gridSelected` | removed — `UIGrid` no longer themes itself |

See the widget-by-widget bullets below for full detail on each rewrite.

### Canvas UI System
- **Container widgets & parent-relative anchoring** — any `UIElement` can now hold
  children via `addChild()`/`removeChild()` (`UIPanel` is the common container).
  `anchor`/`offset` on a child resolve relative to its parent's own bounds instead of
  the whole logical canvas, so moving or resizing a container moves/re-anchors its
  entire subtree with it. Nesting is unlimited. `UICanvas.update()`/`.render()` and
  `UITheme` application now recurse into child subtrees automatically. Top-level
  elements added directly via `addElement` are unaffected — they still anchor against
  the whole canvas exactly as before. Added `resolveAnchorInRect(anchor, bounds)` to
  `Anchor.ts` (exported from `webpunk.ts`) as the parent-bounds-aware counterpart to
  `resolveAnchor`.
- **Theme propagation to late-added children** — a child attached via `addChild()`
  after its parent has already joined a themed `UICanvas` is now themed immediately,
  instead of only widgets present at the time the canvas's theme was applied. Added
  `UITheme.applyToSubtree(el)` as the single recursive theming helper, used by both
  `UICanvas` and `addChild()`.
- **`UIText.textAlign`** — `'left'` | `'center'` | `'right'` (default `'left'`),
  controlling how text sits within its own box.
- **`UIText` dynamic sizing** — `width`/`height` default to `0` ("auto"). With
  `height` unset, `fontSize`/`fontScale` are used as-is; with `height` set, the
  effective font size/scale is derived to fit it. With `width` unset, the box
  auto-sizes to the measured text; with `width` set, `textAlign` positions the text
  within it.
- **`UIButton`** constructor now takes `IInputManager` instead of the concrete
  `InputManager`, matching the rest of the interface-first system fields.
- **Nine-slice overflow fix** — `computeNineSlice` no longer lets corners overflow
  past the destination bounds when a widget's width/height is smaller than its
  insets on that axis (e.g. a progress bar shorter than `top + bottom`). Corner
  and edge thickness now scale down proportionally to fit, mirroring how CSS
  `border-image` handles undersized boxes.
- **`UITheme` now only themes base components** — `UITheme.applyTo` dispatches
  solely on `UIPanel`/`UIText`; it no longer special-cases `UIButton`,
  `UIProgressBar`, or `UIGrid`. Those widgets read `this.appliedTheme` directly at
  render time instead, preserving identical visuals. This means any custom
  `UIElement` subclass built from `UIPanel`/`UIText` children is themed
  automatically with zero theme-side code — the first step towards composable
  custom widgets. **Breaking:** `UITheme.buttonNormal` is removed (buttons now
  fall back to the generic `panel` token for their base look); the
  `buttonNormal?` key in `UIThemeData` JSON descriptors is also gone.
- **`UIProgressBar` rebuilt as a composition of `UIPanel`/`UIText` children** —
  `trackPanel`/`fillPanel` (plus an internal border overlay) are now real children
  (`addChild`'d, visible via `bar.children`) instead of hand-drawn rects, and an
  optional centered `label: UIText` can be added via `showLabel(text)`. `value`/
  `orientation`/`reversed`/`fillMode`/`backgroundColor`/`fillColor`/`borderColor`/
  `showBorder`/`trackBackground`/`fillBackground` all keep their existing meaning
  and visuals — this is an internal restructuring, not a behavior change. A themed
  bar's `trackPanel`/`fillPanel` now read the `progressTrack`/`progressFill` theme
  tokens directly (still overridable via the widget's own `trackBackground`/
  `fillBackground` fields).
- **`UIButton` rebuilt as a composition of a `UIPanel` background (`bgPanel`) and a
  `UIText` label** — hover/pressed feedback now swaps `bgPanel.background` to the
  theme's `buttonHover`/`buttonPressed` token (or, without dedicated art, tints the
  base background via a new `UIPanel.tint` field). `onClick`/`hoverBackground`/
  `pressedBackground`/`hoverTint`/`pressedTint`/`textColor`/`font`/`bitmapFont`/
  `fontSize` all keep their existing meaning. **Breaking:** `label` is now a `UIText`
  child instead of a plain string — use `button.label.text = 'Heal'` instead of
  `button.label = 'Heal'`; the `normal`/`hover`/`pressed` `ButtonColors` fields (and
  the `ButtonColors` type) are removed, replaced by `bgPanel`'s own default look
  (`#334466` fill / `#6688aa` border) plus tinting.
- **`UIGrid` repurposed from a sprite/quantity cell-data widget into a general-purpose
  layout container** — instead of holding cell data, it now arranges its `addChild`'d
  children (any `UIElement`) into a row, column, or grid via new `mode: 'row' |
  'column' | 'grid'`, `columns`, `rows`, `cellSize`, and `padding` fields, computing
  each child's `offset` automatically (dynamic sizing from each child's own bounds by
  default, or uniform fixed-size cells when `cellSize` is set). Layout only recomputes
  when something actually changes (own knobs, child count, or a child's measured
  size), and `getBounds()` auto-sizes from the computed layout unless an explicit
  `width`/`height` is set. The pure layout math is exposed as `computeGridLayout()`
  (plus `GridLayoutMode`/`GridLayoutOptions`/`GridLayoutResult` types) from
  `webpunk.ts` for standalone use/testing. **Breaking:** the entire old API —
  `GridCell`, `setCell`/`getCell`/`clearCell`, and `UIGrid` drawing its own cell
  rects/sprites/quantity text — is removed with no back-compat shim; build
  inventory/hotbar UIs by adding `UIImage`/`UIText`/`UIButton` children instead. The
  now-unused `gridCell`/`gridSelected` `UITheme` tokens are also removed (`UIGrid` no
  longer themes itself or reads `appliedTheme` at all).

### Interfaces
- **Full interface-first `IEngine`/`Engine` surface** — every system field on `Engine`
  and `IEngine` is now typed by interface instead of concrete class:
  `ICamera`, `ISceneManager`, `IAssetLoader`, `IInputManager`, `IActionMap`,
  `ICollisionSystem`, `IAudioManager`, `IUIManager`, `ISaveManager`,
  `IEventEmitter<TMap>` (joining the existing `IRenderer` / `IDebugger`). Each
  concrete class (`Camera`, `SceneManager`, `AssetLoader`, `InputManager`,
  `ActionMap`, `CollisionSystem`, `AudioManager`, `UIManager`, `SaveManager`,
  `EventEmitter`) now `implements` its matching interface and is exported
  alongside it. `Engine` still constructs every concrete system internally
  (unchanged composition-root behavior) — only the publicly-visible *type* of
  each field changed, so game code that only reads `engine.camera`,
  `engine.assets`, etc. is unaffected. Custom `ICameraController`
  implementations, `AnimationClipLoader`, and `TiledJsonLoader` now depend on
  `ICamera` / `IAssetLoader` rather than the concrete classes.

### Debug Overlay
- **Library-build debug-strip fix** — `vite.lib.config.ts` now passes
  `process.env.NODE_ENV` through unresolved (`define: { 'process.env.NODE_ENV':
  'process.env.NODE_ENV' }`) instead of letting Vite's default production mode
  bake in a literal `"production"` at framework-publish time. Previously this
  permanently disabled the debug overlay for every consumer of the published
  `webpunk.ts` package, regardless of the consumer's own build mode. The strip
  decision is now correctly deferred to each consumer's own bundler.

### Bug Fixes
- **`UIProgressBar` crop-mode fill was invisible** — `fillMode: 'crop'` (the
  default) drew the revealed fill via a parent-level `render()` override, which
  `UICanvas`'s render walk always calls *before* any children — so the opaque
  `trackPanel` (rendered right after, as the first child) painted straight over
  it. Fixed by introducing an internal `ClippedPanel` (a `UIPanel` that clips its
  own render to a local reveal rect) for `fillPanel`, so it now renders itself in
  the correct z-order — after `trackPanel`, before the border overlay — via the
  normal recursive child-render walk. No API changes.
- **`UIText` vertical centering was off** — canvas text was always drawn with the
  browser's default `textBaseline: 'alphabetic'`, while widgets like `UIButton`
  and `UIProgressBar` computed their label's vertical offset assuming the text's
  top-left corner (not its baseline) landed at that position, shifting labels
  upward out of visual center. Added an optional `baseline` field to
  `TextStyle`/`IRenderer.drawText`, and `UIText` now renders with `baseline:
  'top'` so its box's top edge lines up with the actual top of the glyphs.
  Other direct `renderer.drawText(...)` call sites (debug overlay, FPS counter,
  scene-authored text) are unaffected — they keep the previous default.

## 0.2.3

### Debug Overlay
- **Build-Time Debug Overlay Fix** — fixed an issue where the debug overlay was completely missing in games built using the npm package, as well as when running with source aliases in a monorepo development server. Gating checks were transitioned to check both `import.meta.env.DEV` (for source-mapped dev builds) and a deferred `process.env.NODE_ENV !== 'production'` check. This ensures `DebugOverlay` is preserved in the library bundle but remains fully tree-shakable in the consumer's production build.

## 0.2.1

### Fonts
- **`AssetLoader.loadFont(family, url, opts?)`** — register a custom font (`.ttf` / `.otf` / `.woff` / `.woff2`) via the `FontFace` API and reference it by family name. Optional `weight` / `style` / `display`. Idempotent per `family|url`, and a safe no-op in headless environments (no `FontFace` / `document.fonts`).
- **`AssetLoader.loadGoogleFonts(...families)`** — inject one or more Google Fonts (with `preconnect` hints) and resolve once they are ready to paint. Accepts a family name or `{ family, axis }`. Never rejects on a CDN failure.
- New exported types **`FontFileOptions`** and **`GoogleFont`**.
- New **`DEFAULT_FONT_FAMILY`** constant (`"Science Gothic", sans-serif`).
- Bundled the **Science Gothic** font under `public/fonts/` (framework + scaffolded template).

### Rendering
- **`IRenderer.drawCircle(center, radius, color, fill?)`** — new renderer primitive for filled (default) or outlined circles, implemented on `CanvasRenderer` (and the test `MockRenderer`).
- `CanvasRenderer.drawText` now defaults to `DEFAULT_FONT_FAMILY` instead of `monospace`; the `TextStyle.font` doc was updated to match.

### UI theming
- **`UITheme.fontFamily`** token (defaults to `DEFAULT_FONT_FAMILY`); propagated to `UIText`, `UIButton`, and `UIGrid` for their canvas-text fallback.
- **`UITheme.createDefault({ … })`** gains a `fontFamily` option (alongside `fill` / `border` / `accent` / `text` / `radius` / `smoothing`).
- **`UITheme.load()`** JSON descriptor gains a `fontFamily` field.
- Applying a theme now also propagates `colors.text` to widget text colours and `fontFamily` to widget fonts — not just backgrounds.
- `UIText` / `UIButton` / `UIGrid` honor a themeable `font` family for their canvas-text fallback.

### Template
- `main.ts` loads the default font (`Science Gothic`) at startup with a safe `try/catch` fallback, so a missing font never blocks startup.
- `GameScene.ts` calls `UITheme.createDefault({ … })` with an explicit, commented palette so the theme colours are easy to customize.

### Docs
- README: documented the font API (`loadFont` / `loadGoogleFonts`), `DEFAULT_FONT_FAMILY`, and the `fontFamily` theme token plus the `createDefault` options.

### Tests
- Added `AssetLoader` font-loading tests and expanded `UITheme` font/colour propagation tests.

### Packaging
- `webpunk.ts` and `create-webpunk` bumped to **0.2.1**; the scaffolded template now pins `webpunk.ts@^0.2.1`.
