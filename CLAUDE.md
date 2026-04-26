# CLAUDE.md — @invana/canvas monorepo

WebGPU-first canvas rendering engine + graph visualization toolkit. WebGL2 fallback automatic. pnpm + Turbo monorepo.

---

## Workspace

```
packages/
  canvas/              @invana/canvas          — engine (active, all new work here)
  canvas-utils/        @invana/canvas-utils    — math/color/geometry helpers
  layouts-d3-force/    @invana/layouts-d3-force — D3 force layout plugin
  example-datasets/    @invana/example-datasets — sample graph data
  typescript-config/   @repo/typescript-config — shared tsconfig
  eslint-config/       @repo/eslint-config     — shared ESLint
apps/
  storybook/           @canvas/storybook       — stories (port 6006)
  ts-doc/              @canvas/ts-doc          — TypeDoc API docs (port 7000)
```

Per-package coding rules → see each package's own `CLAUDE.md`.

---

## Commands

```bash
pnpm install                                    # install all
pnpm build                                      # turbo build (deps first)
pnpm dev                                        # turbo watch
pnpm check-types                                # turbo tsc --noEmit
pnpm lint / pnpm format
pnpm --filter @invana/canvas build              # single package
pnpm --filter @canvas/storybook dev            # → http://localhost:6006
pnpm --filter @canvas/ts-doc build             # → http://localhost:7000
```

Turbo pipeline: `build` depends on `^build`, outputs `dist/**`. All packages use **tsup** → ESM + `.d.ts` + sourcemaps, `pixi.js` external.

---

## Package / Plugin Naming

| Package | npm name |
|---|---|
| `packages/canvas` | `@invana/canvas` — the engine |
| `packages/layouts-d3-force` | `@invana/layouts-d3-force` → future: `@invana/plugin-layout-force` |
| future `packages/plugin-graph` | `@invana/plugin-graph` |

Convention: `@invana/plugin-*` for official plugins, `invana-plugin-*` for community.

---

## Global Coding Rules

1. All new code goes in `packages/canvas` and `apps/storybook`. Never touch legacy packages.
2. No `pixi.js` imports outside `packages/canvas` internals.
3. No direct `this._viewport`, `this._renderer`, `new Graphics()`, `new Container()` outside `packages/canvas/src`.
4. Events go through `canvas.events` (EventBus) — never raw PixiJS events from outside the core.
5. Plugins implement `CanvasPlugin`: `id`, `register(ctx)`, `destroy()`.
6. `graphics-utils/` is internal only — not re-exported from `packages/canvas/src/index.ts`.
7. Write TSDoc on all classes, public methods, and non-obvious variables.

---

## TypeScript Config (all packages)

```json
{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": { "outDir": "./dist", "rootDir": "./src", "paths": { "@/*": ["./src/*"] } }
}
```

---

## graphify

Knowledge graph at `graphify-out/`.

- Before answering architecture questions, read `graphify-out/GRAPH_REPORT.md`.
- If `graphify-out/wiki/index.md` exists, navigate it instead of reading raw files.
- For "how does X relate to Y", prefer `graphify query/path/explain` over grep.
- After modifying source files, run `graphify update .` (AST-only, no API cost).
