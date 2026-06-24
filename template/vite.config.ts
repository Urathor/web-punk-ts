import { defineConfig }     from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath }    from 'url'
import { existsSync }       from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

// In this monorepo, alias the bare `webpunk.ts` import (and the framework's
// internal `@engine/*` imports) to the framework SOURCE, so live framework
// edits hot-reload without rebuilding the package. In a scaffolded project
// these paths do not exist, so Vite resolves the installed `webpunk.ts`
// package (its compiled dist) normally — no alias, nothing to configure.
const frameworkSrc   = resolve(__dirname, '../framework/src')
const devEngineAlias = existsSync(frameworkSrc)
  ? {
      'webpunk.ts': resolve(frameworkSrc, 'index.ts'),
      '@engine':    frameworkSrc,
    }
  : {}

export default defineConfig({
  publicDir: 'public',
  resolve: {
    alias: { ...devEngineAlias },
  },
  server: {
    fs: { allow: ['..'] },
  },
  build: {
    target: 'es2022',
  },
})

