import { defineConfig } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  // Serve the games/assets/ folder as static files at the root URL.
  // e.g. games/assets/sprites/foo.png → accessible as /sprites/foo.png
  publicDir: resolve(__dirname, '../games/assets'),

  resolve: {
    alias: {
      '@engine': resolve(__dirname, 'src'),
      '@games':  resolve(__dirname, '../games')
    }
  },
  server: {
    fs: { allow: ['..'] }
  },
  build: {
    target: 'es2022'
  }
})
