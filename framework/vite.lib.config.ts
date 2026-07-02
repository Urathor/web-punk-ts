import { defineConfig }     from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath }    from 'url'
import dts                  from 'vite-plugin-dts'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Library build for the published `webpunk.ts` package.
// Outputs:
//   dist/index.js   — bundled ESM; the internal `@engine/*` source alias is
//                     fully resolved/inlined here, so consumers need no alias.
//   dist/index.d.ts — type declarations; vite-plugin-dts rewrites the
//                     `@engine/*` alias to relative paths.
export default defineConfig({
  // The library build emits only code + declarations; do not copy public/ assets.
  publicDir: false,
  resolve: {
    alias: { '@engine': resolve(__dirname, 'src') }
  },
  define: {
    // By default Vite inlines `process.env.NODE_ENV` to the CURRENT build's mode
    // (production, since this is a `vite build`). That would permanently bake
    // `DEBUG_OVERLAY_ENABLED = false` into dist/index.js at publish time, so no
    // consumer could ever see the debug overlay in their own dev builds.
    //
    // The debug/DEBUG_OVERLAY_ENABLED check is meant to be resolved by the
    // CONSUMER's own bundler (based on *their* build mode), not by this package's
    // build. Re-defining the token as a no-op passthrough keeps the literal text
    // `process.env.NODE_ENV` in the emitted bundle so it survives untouched until
    // the consumer's bundler processes it and can tree-shake the debug module
    // out of their production build.
    'process.env.NODE_ENV': 'process.env.NODE_ENV'
  },
  plugins: [
    dts({
      tsconfigPath: resolve(__dirname, 'tsconfig.build.json'),
      entryRoot:    'src',
      include:      ['src'],
      exclude:      ['src/main.ts', 'tests', 'src/**/*.test.ts']
    })
  ],
  build: {
    target:      'es2022',
    outDir:      'dist',
    emptyOutDir: true,
    sourcemap:   true,
    lib: {
      entry:    resolve(__dirname, 'src/index.ts'),
      formats:  ['es'],
      fileName: () => 'index.js'
    }
  }
})
