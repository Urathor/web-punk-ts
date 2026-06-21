import { defineConfig }    from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath }    from 'url'
import { existsSync }       from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Resolve engine src: check all three possible locations in priority order.
// When deployed outside this workspace:
//   1. Change the dependency in package.json to the published package URL, e.g.
//      "@tb/game-fw": "github:your-org/game-fw" or "@tb/game-fw": "^0.1.0"
//   2. Run `npm install` — the first path below is picked up automatically.
const engineSrc =
  existsSync(resolve(__dirname, 'node_modules/webpunk.ts/src'))
    ? resolve(__dirname, 'node_modules/webpunk.ts/src')                   // standalone install
    : existsSync(resolve(__dirname, '../node_modules/webpunk.ts/src'))
      ? resolve(__dirname, '../node_modules/webpunk.ts/src')              // npm workspace (hoisted)
      : resolve(__dirname, '../framework/src')                             // repo sibling

export default defineConfig({
  publicDir: 'public',
  resolve: {
    alias: { '@engine': engineSrc }
  },
  server: {
    fs: { allow: ['..'] }
  },
  build: {
    target: 'es2022'
  }
})
