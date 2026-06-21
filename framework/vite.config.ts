import { defineConfig } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@engine': resolve(__dirname, 'src')
    }
  },
  build: {
    target: 'es2022'
  }
})
