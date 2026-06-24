// Bundles the repo's canonical starter (../template) into ./template inside this
// package, minus dev cruft, and stamps the current webpunk.ts version into the
// scaffolded project's dependency so a new game pins the matching release.
//
// Runs automatically via `prepack` before `npm pack` / `npm publish`.
import { cp, rm, readFile, writeFile } from 'node:fs/promises'
import { existsSync }                  from 'node:fs'
import { fileURLToPath }               from 'node:url'
import { dirname, resolve, basename }  from 'node:path'

const here         = dirname(fileURLToPath(import.meta.url))
const pkgRoot      = resolve(here, '..')                   // create-webpunk/
const repoRoot     = resolve(pkgRoot, '..')                // monorepo root
const src          = resolve(repoRoot, 'template')         // canonical starter
const dest         = resolve(pkgRoot, 'template')          // bundled copy (shipped)
const frameworkPkg = resolve(repoRoot, 'framework', 'package.json')

const EXCLUDE = new Set(['node_modules', 'dist', '.vite', 'package-lock.json'])

if (!existsSync(src)) {
  console.error(`bundle-template: source template not found at ${src}`)
  process.exit(1)
}

await rm(dest, { recursive: true, force: true })
await cp(src, dest, {
  recursive: true,
  filter: (p) => {
    const name = basename(p)
    return !EXCLUDE.has(name) && !name.endsWith('.tsbuildinfo')
  },
})

// Stamp the framework version so scaffolded games pin a matching release.
const { version } = JSON.parse(await readFile(frameworkPkg, 'utf8'))
const tplPkgPath  = resolve(dest, 'package.json')
const tplPkg      = JSON.parse(await readFile(tplPkgPath, 'utf8'))
tplPkg.dependencies = { ...tplPkg.dependencies, 'webpunk.ts': `^${version}` }
await writeFile(tplPkgPath, JSON.stringify(tplPkg, null, 2) + '\n')

console.log(`bundle-template: ${src} -> ${dest} (webpunk.ts@^${version})`)
