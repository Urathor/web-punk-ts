import { defineConfig } from 'vitest/config'
import { resolve      } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@engine': resolve(__dirname, 'src')
    }
  },
  test: {
    environment: 'jsdom',
    globals:     true,
    include:     ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include:  ['src/**/*.ts'],
      exclude:  ['src/**/*.d.ts', 'src/main.ts', 'src/style.css'],
    },
  }
})
