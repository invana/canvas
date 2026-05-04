# CLAUDE.md — @invana/canvas monorepo

WebGPU-first canvas rendering engine + graph visualization toolkit. WebGL2 fallback automatic. pnpm + Turbo monorepo.

**Architecture rewrite in progress.** The new architecture is described in `architecture-proposal.md` and the storybook port is tracked in `migration-storybook-inventory.md` (both at repo root). All new code goes in the new packages listed below.

---

## Workspace

### Active packages (new architecture — all new work here)

| Path | Package | Description |
|---|---|---|
| `packages/canvas` | `@invana/canvas` | engine — `Canvas`, `Layer`, `Behaviour`, `Layout` base classes, `ShapesRenderer`, built-in `BackgroundLayer` / `DevInfoLayer` / `CameraInputBehaviour` |
| `packages/graph` | `@invana/graph` | `GraphLayer`, `MiniMapLayer`, hover/click/lasso/brush/pan/drag behaviours |
| `packages/graph-layout-d3-force` | `@invana/graph-layout-d3-force` | `D3ForceLayout` |
| `packages/graph-layout-elkjs` | `@invana/graph-layout-elkjs` | `ElkLayout` |
| `packages/graph-datasets` | `@invana/graph-datasets` | sample graph data |
| `packages/typescript-config` | `@repo/typescript-config` | shared tsconfig |
| `packages/eslint-config` | `@repo/eslint-config` | shared ESLint |
| `apps/storybook` | `@canvas/storybook` | stories (port 6006) |
| `apps/docs` | `@canvas/docs` | VitePress docs + TypeDoc API reference |

Per-package coding rules → see each package's own `CLAUDE.md`.

### Deprecated packages (do NOT search or read by default)

These hold the previous implementation, kept temporarily as a feature-completeness reference. **Do not search, grep, read, or import from them unless I explicitly ask.** When a request would normally pull them into scope (e.g. "find where X is implemented", "how did the old plugin work"), ignore them and tell me you skipped them — wait for me to opt in.

| Path | Package |
|---|---|
| `packages/canvas-deprecated` | `@invana/canvas-deprecated` |
| `packages/plugins-shapes-deprecated` | `@invana/plugins-shapes-deprecated` |
| `packages/plugins-graph-data-deprecated` | `@invana/plugins-graph-data-deprecated` |
| `packages/plugins-layouts-d3-force-deprecated` | `@invana/plugin-layouts-d3-force-deprecated` |
| `packages/plugins-layouts-elkjs-deprecated` | `@invana/plugin-layouts-elkjs-deprecated` |
| `packages/plugins-example-datasets-deprecated` | `@invana/plugin-example-datasets-deprecated` |

When invoking grep / find / Explore agents, scope to the active paths above (or exclude `*-deprecated`). Same for the `Read` tool: don't open `*-deprecated` files unless asked.

---

## Commands

```bash
pnpm install                                    # install all
pnpm build                                      # turbo build (deps first)
pnpm dev                                        # turbo watch
pnpm check-types                                # turbo tsc --noEmit
pnpm lint / pnpm format
pnpm --filter @invana/canvas build              # single package
pnpm --filter @canvas/storybook dev             # → http://localhost:6006
pnpm --filter @canvas/docs dev                  # → http://localhost:5173
pnpm --filter @canvas/docs build                # build docs site
```

Turbo pipeline: `build` depends on `^build`, outputs `dist/**`. All packages use **tsup** → ESM + `.d.ts` + sourcemaps, `pixi.js` external.

---

## Naming convention

- Official packages: `@invana/<domain>` for cores, `@invana/<domain>-<feature>` for extensions.
- Community packages: `invana-<domain>-<feature>` (unscoped).
- No `plugin` / `plugins` in package names — that's an implementation detail.
- Class suffixes by kind: `*Layer`, `*Behaviour`, `*Layout`, `*Renderer`. (See `architecture-proposal.md` §5.)

---

## Global Coding Rules

1. Don't write code unless we discuss and I give a go ahead.
2. Ask me questions before coding.
3. All new code goes in the active packages listed above. Never touch `*-deprecated` packages, and never read from them without my explicit ask (see the deprecated section).
4. No `pixi.js` imports outside `packages/canvas` internals.
5. No direct `new Graphics()` / `new Container()` outside `packages/canvas/src`.
6. Events go through `canvas.events` (canvas-wide) or `layer.events` (layer-scoped) per `architecture-proposal.md` §2.5 — never raw PixiJS events from outside the engine.
7. Behaviours don't auto-enable. Every behaviour (hover, select, drag, etc.) must be explicitly registered AND enabled by the developer.
8. Cross-layer dependencies are declared as explicit `*LayerId` option fields. Don't infer "the only graph layer".
9. Write TSDoc on all classes, public methods, and non-obvious variables.
10. **Do not write tests for `packages/canvas`.** No test files in that package unless explicitly asked.

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
- Note: the existing graphify output indexed the pre-rewrite codebase. Treat it as stale until a fresh `graphify update .` runs against the new active packages.
