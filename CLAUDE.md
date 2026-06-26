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
| `packages/canvas-react` | `@invana/canvas-react` | React bindings — declarative `<Canvas>` with JSX children mapped to layers, behaviours, layouts via context |
| `packages/canvas-ui` | `@invana/canvas-ui` | schema-driven editors (NodeStyle / hover-card / node structure + styling templates) + shared form helpers |
| `packages/canvas-designer` | `@invana/canvas-designer` | opt-in WYSIWYG **node card / template designer** (drag canvas, layers, undo/redo, save/load); emits `FreeformStructure` |
| `packages/graph` | `@invana/graph` | `GraphLayer`, `MiniMapLayer`, hover/click/lasso/brush/pan/drag behaviours |
| `packages/graph-layout-d3-force` | `@invana/graph-layout-d3-force` | `D3ForceLayout` (iterative) |
| `packages/graph-layout-elkjs` | `@invana/graph-layout-elkjs` | `ElkLayout` (one-shot; on `OneShotPositionLayout`) |
| `packages/graph-layout-d3-hierarchy` | `@invana/graph-layout-d3-hierarchy` | `D3HierarchyLayout` — tree / cluster / radial / pack / sunburst (one-shot) |
| `packages/graph-layout-geometric` | `@invana/graph-layout-geometric` | `GeometricLayout` — grid / snake / circular (one-shot, dependency-free) |
| `packages/graph-layer-d3-contour` | `@invana/graph-layer-d3-contour` | `DensityContourLayer` (d3-contour density overlay) |
| `packages/graph-layer-bubble-sets` | `@invana/graph-layer-bubble-sets` | `BubbleSetsLayer` (named-group annotation; bubblesets-js wrapper) |
| `packages/graph-datasets` | `@invana/graph-datasets` | sample graph data |
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
- **Toolbar components** (assembled toolbars in `packages/canvas-react/src/toolbars/`) carry the `*Toolbar` suffix — e.g. `CanvasControlsToolbar`, `GraphToolbar`. The dumb building blocks in `canvas-react/src/components/` (e.g. `ZoomControls`, `Panel`) do **not** — they're components, not toolbars.

---

## Global Coding Rules

> **Never `git commit` or `git push` unless I explicitly ask in the *current* message.** Prior-turn approval does **not** carry forward — each commit/push needs a fresh, explicit request from me. Don't commit as a side-effect of finishing a task, and don't offer to commit unprompted. Staging (`git add`) is only ever a step within a commit I asked for.

1. Don't write code unless we discuss and I give a go ahead.
2. Ask me questions before coding.
3. All new code goes in the active packages listed above.
4. No `pixi.js` imports outside `packages/canvas` internals.
5. No direct `new Graphics()` / `new Container()` outside `packages/canvas/src`.
6. Events go through `canvas.events` (canvas-wide) or `layer.events` (layer-scoped) per `architecture-proposal.md` §2.5 — never raw PixiJS events from outside the engine.
7. Behaviours don't auto-enable. Every behaviour (hover, select, drag, etc.) must be explicitly registered AND enabled by the developer.
8. Cross-layer dependencies are declared as explicit `*LayerId` option fields. Don't infer "the only graph layer".
9. Write TSDoc on all classes, public methods, and non-obvious variables.
10. **Do not write tests for `packages/canvas`.** No test files in that package unless explicitly asked.
11. **Do NOT create or modify Storybook stories unless I explicitly ask in the current message.** Shipping a new engine primitive (shape, connector, anchor, router, pathStyle, marker, decoration, effect, layer, behaviour, layout, graph-layer feature, control, etc.) does **not** require a story — land the code without one and don't offer to add one unprompted. Only when I ask for a story do you write it, and then place it per the namespacing in `apps/storybook/CLAUDE.md`. Path map (for when a story **is** requested):
    - shape → `Canvas/Concepts/Shapes/`
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
