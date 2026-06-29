# CLAUDE.md — @invana/canvas monorepo

WebGPU-first canvas rendering engine + graph visualization toolkit. WebGL2 fallback automatic. pnpm + Turbo monorepo.

**Architecture rewrite in progress.** The long-form design rationale lives in `docs/architecture-proposal.md`. Day-to-day API and concept documentation lives in `apps/docs/` (VitePress) — that's the single source of truth for engine surfaces; consult it before referring back to the proposal. Design notes and `*-plan.md` docs live in the repo-root `docs/` folder (internal — **not** part of the VitePress site); `docs/README.md` indexes them and `roadmap.md` is the hub. Put new plans in `docs/`, not at repo root. All new code goes in the active packages listed below.

### Don't write API docs to `apps/docs/` unless explicitly asked

The plan is to wire up TSDoc + VitePress for automatic API doc generation — class / method / type references will be derived from the TSDoc comments on the source. Until then, **don't hand-author API reference pages in `apps/docs/`** (no `data-model.md`-style "here are all the public fields" pages, no per-class method tables). Instead:

- Write rich TSDoc comments on public classes, methods, types, and non-obvious internals — those become the source of truth.
- Limited exceptions, only when I ask: planning docs (`*-plan.md`), conceptual guides (`guide/architecture.md`-style mental-model pages), event catalogues that aren't 1:1 with code.
- Concept pages may *reference* types (`See GraphNode`) but shouldn't *redeclare* fields the TSDoc already covers — duplicates rot.

If I ask for "docs", "documentation", or "data model docs" without further qualification, ask whether I want a planning/concept doc or to update TSDoc on the source.

### `README.md` vs `roadmap.md` — current essentials vs. detail + status

- **`README.md`** = current essentials only: a **one-line "why"** (purpose, present tense — no "we're building…" / no roadmap), install, the package/workspace structure + responsibilities, and a link to the roadmap. Keep low-level feature detail (e.g. the full layout list) **out** of the README.
- **`roadmap.md`** = the detailed doc: the why + interaction loop, an **architecture diagram**, and **feature highlight tables with checklists + completion status** (✅ shipped / 🚧 in progress / 📋 planned). All planned/in-progress work and status lives here, never in the README.
- Design notes and `*-plan.md` live in `docs/` (indexed by `docs/README.md`).

---

## Workspace

All in-repo packages are `0.0.7` (except the `@repo/*` configs and the private `@canvas/*` apps). All new work goes in these — new architecture.

#### Engine core

| Path | Package | Role | 3rd-party deps |
|---|---|---|---|
| `packages/canvas-state` | `@invana/canvas-state` | **state layer (foundation).** `ReactiveStore<T>` port + adapters (zustand now; Yjs / telemetry later). Owns **one `CanvasState { view, data }` per `Canvas`**, the single source of truth the renderer is a *pure projection* of: **`view`** (`CanvasView` — layers / behaviours / layouts config, `activeLayout`, templates, theme, selection / hover / camera) on the reactive store; **`data`** (`CanvasData` = the graph — nodes incl. **position as a node field**, edges, annotations, query refs). Bulk fields (positions, payloads) are an **internal typed-array detail** of `data` (`ColumnStore` / `GraphStore`, coarse flush), **never** the reactive path. **Renderer-free leaf: zero `@invana` deps, imports no drawing library** — pixi is one adapter. See `docs/canvas-state-plan.md`. | `zustand`, `immer` (later `yjs`) |
| `packages/canvas` | `@invana/canvas` | engine — `Canvas`, `Layer`, `Behaviour`, `Layout` base classes, `ShapesRenderer`, built-in `BackgroundLayer` / `DevInfoLayer` / `LayersPanelLayer` / camera input behaviours. **The only package allowed to import `pixi.js`.** State lives in `@invana/canvas-state` (its sole `@invana` dep). | `pixi.js`, `pixi-viewport`, `rbush` (dep: `@invana/canvas-state`) |
| `packages/graph` | `@invana/graph` | graph domain on top of the engine — `GraphLayer`, `MiniMapLayer`, `GraphCanvas`, hover/click/lasso/brush/drag/select/context-menu/etc. behaviours, `OneShotPositionLayout` base | — (peer: `@invana/canvas`) |

#### Layouts (each wraps one algorithm; peer on `@invana/canvas` + `@invana/graph`)

| Path | Package | Role | 3rd-party deps |
|---|---|---|---|
| `packages/graph-layout-d3-force` | `@invana/graph-layout-d3-force` | `D3ForceLayout` (iterative, animated) | `d3-force` |
| `packages/graph-layout-elkjs` | `@invana/graph-layout-elkjs` | `ElkLayout` (one-shot) | `elkjs` |
| `packages/graph-layout-d3-hierarchy` | `@invana/graph-layout-d3-hierarchy` | `D3HierarchyLayout` — tree / cluster / radial / pack / sunburst (one-shot) | `d3-hierarchy` |
| `packages/graph-layout-d3-sankey` | `@invana/graph-layout-d3-sankey` | `D3SankeyLayout` (one-shot) | `d3-sankey` |
| `packages/graph-layout-geometric` | `@invana/graph-layout-geometric` | `GeometricLayout` — grid / snake / circular (one-shot, dependency-free) | — |

#### Graph overlay layers (peer on `@invana/canvas`; most also on `@invana/graph`)

| Path | Package | Role | 3rd-party deps |
|---|---|---|---|
| `packages/graph-layer-d3-contour` | `@invana/graph-layer-d3-contour` | `DensityContourFillLayer` + `DensityContourStrokeLayer` (d3-contour density overlay) | `d3-contour` |
| `packages/graph-layer-bubble-sets` | `@invana/graph-layer-bubble-sets` | `BubbleSetsLayer` (named-group annotation) | `bubblesets-js` |
| `packages/graph-layer-maplibre` | `@invana/graph-layer-maplibre` | `MapLayer` — MapLibre GL basemap; projects nodes onto a real world map (peer: `@invana/canvas` only) | `maplibre-gl` |

#### React + UI

| Path | Package | Role | 3rd-party deps |
|---|---|---|---|
| `packages/canvas-react` | `@invana/canvas-react` | React bindings — declarative `<Canvas>` mapping JSX children to layers/behaviours/layouts; hooks; assembled toolbars + dumb components; `GraphCanvasApp` | `lucide-react` (dep: `@invana/themes`) |
| `packages/canvas-ui` | `@invana/canvas-ui` | **engine-agnostic** React UI, two folder tracks: `editors/` (schema-driven state editors — NodeStyle / hover-card / node structure+styling + per-behaviour/layer/layout) and `views/` (presentational components — preview cards). No engine/`pixi` imports; `@invana/graph` used for **types only** | — |
| `packages/canvas-designer` | `@invana/canvas-designer` | the **canvas designer** — visual authoring for the visualisation's definition. Today: the **node template** surface (`src/templates/`) — opt-in WYSIWYG composite-card authoring (drag canvas, layers, undo/redo, save/load), emits `FreeformStructure`. **Planned:** studio shell + layout/behaviour/layer designers hosting `@invana/canvas-ui` editors (rule 12). Headless today — `@invana/graph` types only | — |

#### Data + shared config

| Path | Package | Role |
|---|---|---|
| `packages/graph-datasets` | `@invana/graph-datasets` | sample graph datasets (Les Misérables, scientists org chart, random tree, usecase demos) |
| `packages/typescript-config` | `@repo/typescript-config` | shared tsconfig (private) |
| `packages/eslint-config` | `@repo/eslint-config` | shared ESLint (private) |

#### Apps (private, not published)

| Path | Package | Role |
|---|---|---|
| `apps/storybook` | `@canvas/storybook` | stories (port 6006) — depends on **every** publishable package |
| `apps/docs` | `@canvas/docs` | VitePress docs + TypeDoc API reference (port 5173) |

### External `@invana/*` design-kit deps (NOT in this repo)

`@invana/ui`, `@invana/forms`, `@invana/themes`, `@invana/styling` are **published packages from the Invana design kit** (separate repo). They are consumed here as normal registry deps — there are no `packages/ui` / `packages/forms` / etc. folders. `canvas-ui` builds its editors on `@invana/forms` + `@invana/ui`; `canvas-react` pulls `@invana/themes` (+ `@invana/ui`, `@invana/graph` as peers). Don't try to `--filter` or build these locally; bump their versions like any third-party dep.

### Dependency layering (use when adding/bumping workspace deps)

```
@invana/canvas-state  (renderer-free leaf — zero @invana deps, no drawing-lib import; ReactiveStore port + CanvasView/CanvasData state)
   ▲   (consumed by canvas, graph, canvas-react)
   │
@invana/canvas  (owns pixi; its sole @invana dep is canvas-state)
   ▲
   ├── @invana/graph                         (peer: canvas; dep: canvas-state)
   │      ▲
   │      ├── graph-layout-*                 (peer: canvas, graph)   — d3-force/elkjs/d3-hierarchy/d3-sankey/geometric
   │      ├── graph-layer-d3-contour         (peer: canvas, graph)
   │      └── graph-layer-bubble-sets        (peer: canvas, graph)
   ├── graph-layer-maplibre                  (peer: canvas only)
   ├── @invana/canvas-react                  (peer: canvas, graph, ui, graph-layout-d3-force; dep: themes, canvas-state)
   ├── @invana/canvas-ui                     (peer: graph[types-only], ui, themes, styling, forms)
   └── @invana/canvas-designer      (peer: canvas-ui, graph, ui, forms)

@invana/graph-datasets                       (peer: graph)
```

Rules implied by this graph: cross-package engine deps are **`peerDependencies`** (+ mirrored in `devDependencies` for local builds), never plain `dependencies` — except `canvas-react`→`@invana/themes`, the foundational **`@invana/canvas-state`** dependency (a normal `dependency`, not a peer — the shared state leaf below the engine), and app deps. Keep all in-repo packages on the **same version** when bumping. A new layout/layer package peers on `@invana/canvas` (+ `@invana/graph` unless it's canvas-only like maplibre) and lists its single algorithm lib as a 3rd-party `dependency`. After adding a package, also add it to `apps/storybook`'s deps if it gets a story.

### The UI package (`@invana/canvas-ui`) — two tracks, where this is going

`canvas-ui` is engine-agnostic React UI (no engine/`pixi` imports; `@invana/graph` for **types only**), organised as **two folder-level tracks inside one package** — not separate packages (they share deps + the same consumers):

- **`editors/`** — schema-driven **state editors**: forms that edit a serialisable object and hand the patch back to the consumer. Today: `NodeStyleEditor`, `HoverPreviewCardEditor`, `NodeStructureEditor`, `NodeStylingEditor`, each an `editors/<surface>/` folder on the **`fields.ts` + `mapping.ts` + `<Editor>`** pattern (`defaults` + `fields` + `onSubmit`).
- **`views/`** — **presentational** components (props in → JSX, no form). Today: `preview-cards.tsx` (`NodePreviewCard` / `EdgePreviewCard`).
- **`shared/`** — colour utils + presets used by both.

Litmus for which track: *does it change state?* → `editors/`; *does it only display state?* → `views/`.

Where the **editors track** is heading: **an editor for every Behaviour, Layer, and Layout.** A class's constructor options *are* the editable **state of the visualisation** (we'll likely rename "settings"/"options" → "state" — a larger refactor, but that's what it is). Each becomes a UI surface here, so the **Invana building studio** and Storybook stories can let users edit live visualisation state — every story should be able to surface these editors via `GraphCanvasApp`. New behaviour/layer/layout ⇒ new `editors/<surface>/` (root rule 12). Apply path stays `useGraphCanvasUpdate().update(...)` → `setOptions`; init-only options remount via the canvas-react wrapper. Full rationale in `roadmap.md`.

Where the **views track** is heading: it's the home for the presentational UI currently in `canvas-react` (standing TODO to relocate `canvas-react`'s dumb components + assembled toolbars into `canvas-ui` `views/` + a `toolbars/` sibling, leaving `canvas-react` as engine-bindings-only). Until then, those **components + toolbars still live in `canvas-react`** and `views/` holds just the preview cards.

### The card / template stack — three layers, don't conflate them

"Composite node" spans three cleanly-separated layers. When something needs changing, change it at the right layer:

1. **Engine primitive** — `CompositeShape` (the `'composite'` shape kind: a borrowed root silhouette + `parts` + `label` children) in `packages/canvas/src/primitives/shapes/`. **Domain-free** — knows nothing about nodes/graphs; the renderer depends on it, not the reverse. Don't move it or leak graph concepts into it.
2. **Template model** — `NodeStructureTemplate` (`SimpleStructure` / `CardStructure` / `FreeformStructure`), styling templates, the `compileFreeform` → `CompositeShapeOption` compiler, and runtime fallback defaults (`BUILT_IN_STRUCTURES`) in `packages/graph/src/template/`. `FreeformStructure` is the designer-authored variant; it **compiles down to a `CompositeSpec`** rendered by layer 1.
3. **Authoring tool** — `@invana/canvas-designer` (above). Headless; emits a `FreeformStructure` JSON. **Ships its own default/starter node templates** (pure `FreeformStructure` JSON — distinct from graph's runtime `BUILT_IN_STRUCTURES`, which are different concerns: authoring presets vs runtime fallbacks). **Node-only today; an edge designer is planned.**

Flow: designer → `FreeformStructure` → `GraphLayer.nodeStructureTemplates` → `compileFreeform` → `CompositeSpec` → `CompositeShape` renders. No separate templates package for now (single runtime consumer; revisit only if a second one appears).

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
- Class suffixes by kind: `*Layer`, `*Behaviour`, `*Layout`, `*Renderer`. (See `docs/architecture-proposal.md` §5.)
- **Toolbar components** (assembled toolbars in `packages/canvas-react/src/toolbars/`) carry the `*Toolbar` suffix — e.g. `CanvasControlsToolbar`, `GraphToolbar`. The dumb building blocks in `canvas-react/src/components/` (e.g. `ZoomControls`, `Panel`) do **not** — they're components, not toolbars.

---

## Global Coding Rules

> **Never `git commit` or `git push` unless I explicitly ask in the *current* message.** Prior-turn approval does **not** carry forward — each commit/push needs a fresh, explicit request from me. Don't commit as a side-effect of finishing a task, and don't offer to commit unprompted. Staging (`git add`) is only ever a step within a commit I asked for.

1. Don't write code unless we discuss and I give a go ahead.
2. Ask me questions before coding.
3. All new code goes in the active packages listed above.
4. No `pixi.js` imports outside `packages/canvas` internals.
5. No direct `new Graphics()` / `new Container()` outside `packages/canvas/src`.
6. Events go through `canvas.events` (canvas-wide) or `layer.events` (layer-scoped) per `docs/architecture-proposal.md` §2.5 — never raw PixiJS events from outside the engine.
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
12. **Every new Behaviour, Layer, or Layout ships a settings editor in `@invana/canvas-ui`.** Its constructor options *are* the editable state of the visualisation (long-term we'll call this "state", not "settings" — a bigger refactor, but that's what it is). So whenever you add a behaviour/layer/layout, add a schema-driven editor for it to the editors package (`packages/canvas-ui/src/editors/<surface>/`, following the `fields.ts` + `mapping.ts` + `<Editor>` pattern). This is what exposes the visualisation's state to the **Invana building studio** and to stories — every story should be able to surface those editors in the UI via `GraphCanvasApp`. The editor stays headless/engine-agnostic per `packages/canvas-ui/CLAUDE.md`; the apply path is `useGraphCanvasUpdate().update(...)` → `setOptions` (init-only options remount via the canvas-react wrapper). See `roadmap.md`.

### State architecture — `@invana/canvas-state`: one `CanvasState { view, data }`

All canvas state is owned by **`@invana/canvas-state`** (see `docs/canvas-state-plan.md`, which sequences `docs/reactive-state-store-plan.md` + `docs/store-owns-state-plan.md` + `docs/collaborative-state-plan.md`). Each `Canvas` has **one `CanvasState`**; the renderer is a **pure projection** of it (state changes → re-render). Consumers — the engine, `canvas-react`, the `canvas-ui` editors, the Designer — read/write **through it**, never their own copy.

- **One `CanvasState { view, data }`, not separate data/positions branches.** **`view`** (`CanvasView`) = how the visualisation is defined + viewed (layers / behaviours / layouts config, `activeLayout`, templates, theme, selection / hover / camera). **`data`** = a **keyed registry of data layers** (`Record<string, DataLayer>` — graph / table / geo …, each a typed-array-backed `DataStore`; many view layers may project one data layer). **Position is a node field inside a data layer** (not a top-level compartment), and **groups** (bubble-sets / shaped containers) are a **keyed many-to-many `groups` collection** (`memberIds[]`, not `parentId`) whose encapsulating geometry is *derived* (like a layout, throttled for bubble-sets) — see `docs/canvas-state-plan.md` §3.1.
- **Storage physics is internal to each member, not a third branch.** Small / human-rate state (all of `view`; `data`'s annotations / query refs / counts) → the **reactive store** (immer-backed, observable, syncable). Machine-rate fields (`data`'s node `x`/`y`, bulk payloads, render flags) → **typed-array `ColumnStore` / `GraphStore`**, delivered to the renderer via a **batched, frame-coalesced flush** with targeted per-node re-render — **never** the reactive/immer/CRDT path (which clones at 5–50 ms vs ~10 ns). So the renderer reacts to `CanvasState` at every scale; the engine just routes position churn through the typed-array fast path. **Positions are derived locally by the layout and never synced.** Camera is an **abstract `{ x, y, zoom }` transform**, throttled / ephemeral — not a `pixi-viewport` handle (renderer-agnostic; pixi is one adapter).
- **Program against the `ReactiveStore<T>` port, not zustand directly.** zustand is one adapter (`packages/canvas-state/src/createConfigStore.ts`) — **no `import … from 'zustand'` outside that adapter** — so the backend stays swappable (valtio / nanostores / Yjs-backed for collaboration). `@invana/canvas-state` imports **no drawing library**.
- **Writes are declarative patches** (`update(patch, action?)` → `setState` now, a Yjs transaction later; the named `action` powers OTel + CRDT history). **Reads** go through `subscribe` / `useStore(store, selector)` (React via `useSyncExternalStore`). **UI components never keep their own copy** of canvas state — only ephemeral widget state and editor edit-drafts are local.
- **Telemetry is a port decorator** (`withTelemetry`), not a zustand middleware — transfers across the backend swap; scoped to the `view` reactive store, never the bulk data hot path.

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
