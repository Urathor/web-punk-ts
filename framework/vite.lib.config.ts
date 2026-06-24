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
