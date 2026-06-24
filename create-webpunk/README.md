# create-webpunk

Scaffold a new [`webpunk.ts`](https://www.npmjs.com/package/webpunk.ts) game project.

```bash
npm create webpunk@latest my-game
# or
npx create-webpunk my-game
```

Then:

```bash
cd my-game
npm install
npm run dev
```

This creates a ready-to-run Vite + TypeScript project that depends on the
compiled `webpunk.ts` framework, with a title scene, a gameplay scene stub, and
input actions already wired up.

## Install the framework on its own

If you just want the engine in an existing project instead of scaffolding a new
one:

```bash
npm install webpunk.ts
```

```ts
import { Engine, CanvasRenderer } from 'webpunk.ts'
```
