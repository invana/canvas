# CLAUDE.md — @invana/canvas monorepo

WebGPU-first canvas rendering engine + graph visualization toolkit. WebGL2 fallback automatic. pnpm + Turbo monorepo.

**Architecture rewrite in progress.** The long-form design rationale lives in `architecture-proposal.md` at repo root. Day-to-day API and concept documentation lives in `apps/docs/` (VitePress) — that's the single source of truth for engine surfaces; consult it before referring back to the proposal. Standalone `*-plan.md` files have been consolidated into `apps/docs/`; don't create new ones. All new code goes in the active packages listed below.

### Don't write API docs to `apps/docs/` unless explicitly asked

The plan is to wire up TSDoc + VitePress for automatic API doc generation — class / method / type references will be derived from the TSDoc comments on the source. Until then, **don't hand-author API reference pages in `apps/docs/`** (no `data-model.md`-style "here are all the public fields" pages, no per-class method tables). Instead:

- Write rich TSDoc comments on public classes, methods, types, and non-obvious internals — those become the source of truth.
- Limited exceptions, only when I ask: planning docs (`*-plan.md`), conceptual guides (`guide/architecture.md`-style mental-model pages), event catalogues that aren't 1:1 with code.
- Concept pages may *reference* types (`See GraphNode`) but shouldn't *redeclare* fields the TSDoc already covers — duplicates rot.

If I ask for "docs", "documentation", or "data model docs" without further qualification, ask whether I want a planning/concept doc or to update TSDoc on the source.

---

## Workspace

### Active packages (new architecture — all new work here)

| Path | Package | Description |
|---|---|---|
| `packages/canvas` | `@invana/canvas` | engine — `Canvas`, `Layer`, `Behaviour`, `Layout` base classes, `ShapesRenderer`, built-in `BackgroundLayer` / `DevInfoLayer` / `CameraInputBehaviour` |
| `packages/graph` | `@invana/graph` | `GraphLayer`, `MiniMapLayer`, hover/click/lasso/brush/pan/drag behaviours |
| `packages/graph-layout-d3-force` | `@invana/graph-layout-d3-force` | `D3ForceLayout` |
| `packages/graph-layout-elkjs` | `@invana/graph-layout-elkjs` | `ElkLayout` |
| `packages/graph-layer-d3-contour` | `@invana/graph-layer-d3-contour` | `DensityContourLayer` (d3-contour density overlay) |
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
11. **Every new engine primitive ships with a Storybook story.** Adding a shape, connector, anchor, router, pathStyle, marker, decoration, effect, layer, behaviour, layout, or graph-layer feature (e.g. a new `NodeShapeKind`) to `packages/canvas` or `packages/graph` is incomplete until there's a `.stories.ts` file demonstrating it under `apps/storybook/stories/<Package>/<Area>/` per the namespacing in `apps/storybook/CLAUDE.md`. Path map:
    - shape → `Canvas/Shapes/`
    - connector / anchor / router / pathStyle / marker → `Canvas/Connectors/{Anchors,Routers,PathStyles,ConnectorTypes}/`
    - decoration → `Canvas/Decorations/{Shapes,Connectors}/`
    - effect → `Canvas/Effects/{Shapes,Connectors}/`
    - layer → `Canvas/Layers/` (or `Graph/Layer/` for graph-domain layers)
    - behaviour → `Canvas/Behaviours/` (or `Graph/Behaviours/`)
    - layout → `graph-layouts/<flavour>/` (where `<flavour>` is the package name minus the `graph-layout-` prefix — e.g. `@invana/graph-layout-d3-force` → `graph-layouts/d3-force/`). See `apps/storybook/CLAUDE.md` for the full layout-namespacing rule.
    - graph node/edge feature → `Graph/Nodes/` or `Graph/Edges/`

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
