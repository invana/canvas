# CLAUDE.md — @invana/canvas monorepo

WebGPU-first canvas rendering engine + graph visualization toolkit. WebGL2 fallback automatic. pnpm + Turbo monorepo.

---

## Workspace

| Path | Package | Description |
|---|---|---|
| `packages/canvas` | `@invana/canvas` | engine (active, all new work here) |
| `packages/plugins-graph-data` | `@invana/plugins-graph-data` | ElementPlugin, GraphDataPlugin, nodes/edges, connectors, routers, animations |
| `packages/plugins-layouts-d3-force` | `@invana/plugin-layouts-d3-force` | D3 force layout plugin |
| `packages/plugins-example-datasets` | `@invana/plugin-example-datasets` | sample graph data |
| `packages/typescript-config` | `@repo/typescript-config` | shared tsconfig |
| `packages/eslint-config` | `@repo/eslint-config` | shared ESLint |
| `apps/storybook` | `@canvas/storybook` | stories (port 6006) |
| `apps/docs` | `@canvas/docs` | VitePress docs + TypeDoc API reference |

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
pnpm --filter @canvas/docs dev                 # → http://localhost:5173
pnpm --filter @canvas/docs build               # build docs site
```

Turbo pipeline: `build` depends on `^build`, outputs `dist/**`. All packages use **tsup** → ESM + `.d.ts` + sourcemaps, `pixi.js` external.

---

## Package / Plugin Naming

| Package | npm name |
|---|---|
| `packages/canvas` | `@invana/canvas` — the engine |
| `packages/plugins-graph-data` | `@invana/plugins-graph-data` — ElementPlugin + GraphDataPlugin |
| `packages/plugins-layouts-d3-force` | `@invana/plugin-layouts-d3-force` |
| `packages/plugins-example-datasets` | `@invana/plugin-example-datasets` |

Convention: `@invana/plugin-*` for official plugins, `invana-plugin-*` for community.

---

## Global Coding Rules

1. Dont write code unless we discuss and I give a go ahead.
2. Ask me questions before coding.
3. All new code goes in `packages/canvas`, `packages/plugins-graph-data`, or `apps/storybook`. Never touch legacy packages.
4. No `pixi.js` imports outside `packages/canvas` internals.
5. No direct `this._viewport`, `this._renderer`, `new Graphics()`, `new Container()` outside `packages/canvas/src`.
6. Events go through `canvas.events` (EventBus) — never raw PixiJS events from outside the core.
7. Plugins implement `CanvasPlugin`: `id`, `register(ctx)`, `destroy()`.
8. `graphics-utils/` is internal only — not re-exported from `packages/canvas/src/index.ts`.
9. Write TSDoc on all classes, public methods, and non-obvious variables.


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
