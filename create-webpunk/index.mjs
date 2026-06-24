#!/usr/bin/env node
// Scaffolder for webpunk.ts games.
//
//   npm create webpunk@latest my-game
//   npx create-webpunk my-game
//
// Copies the bundled starter template into <target> and wires up the project
// name. The starter depends on the published `webpunk.ts` package.
import { cp, readFile, writeFile, readdir } from 'node:fs/promises'
import { existsSync }                       from 'node:fs'
import { fileURLToPath }                    from 'node:url'
import { dirname, resolve, basename }       from 'node:path'

const here        = dirname(fileURLToPath(import.meta.url))
const templateDir = resolve(here, 'template')

const GITIGNORE = `# dependencies
node_modules/

# build output
dist/

# vite cache
.vite/
*.local

# logs
*.log

# editor / OS
.DS_Store
Thumbs.db
`

function fail(message) {
  console.error(`\n  create-webpunk: ${message}\n`)
  process.exit(1)
}

const args   = process.argv.slice(2).filter((a) => !a.startsWith('-'))
const target = args[0] ?? 'webpunk-game'
const dest   = resolve(process.cwd(), target)
const name   =
  basename(target).replace(/[^a-z0-9._-]+/gi, '-').replace(/^[._-]+/, '').toLowerCase() ||
  'webpunk-game'

if (!existsSync(templateDir)) {
  fail(`bundled template not found at ${templateDir}\n  (Maintainers: run "npm run bundle:template" first.)`)
}

if (existsSync(dest)) {
  const entries = await readdir(dest).catch(() => [])
  if (entries.length > 0) fail(`target directory "${target}" already exists and is not empty.`)
}

await cp(templateDir, dest, { recursive: true })

// npm strips .gitignore from published tarballs, so write a fresh one.
await writeFile(resolve(dest, '.gitignore'), GITIGNORE)

// Set the project name from the target directory.
const pkgPath = resolve(dest, 'package.json')
const pkg     = JSON.parse(await readFile(pkgPath, 'utf8'))
pkg.name      = name
await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

console.log(`
  Created ${target}

  Next steps:
    cd ${target}
    npm install
    npm run dev
`)
