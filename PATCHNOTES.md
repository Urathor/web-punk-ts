# Patch Notes

Running release notes for **webpunk.ts** and the `create-webpunk` scaffolder.
Newest entries first.

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
