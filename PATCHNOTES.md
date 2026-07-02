# Patch Notes

Running release notes for **webpunk.ts** and the `create-webpunk` scaffolder.
Newest entries first.

## Unreleased

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
