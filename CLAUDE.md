# CLAUDE.md — @invana/canvas monorepo

WebGPU-first canvas rendering engine + graph visualization toolkit. WebGL2 fallback automatic. pnpm + Turbo monorepo.

### Where instructions live (keep this file lean)

This root `CLAUDE.md` holds only **monorepo-wide** concerns: the workspace map (one-line package roles), the dependency layering, the global coding rules, and cross-cutting architecture (the kernel). **Package- and app-specific rules live in that package's own `CLAUDE.md`** (`packages/<x>/CLAUDE.md`, `apps/<x>/CLAUDE.md`) — don't grow this file with detail that belongs to one package. When adding guidance, ask: *true across the repo?* → here; *about one package/app?* → its `CLAUDE.md`. Reference the package doc from here with a one-liner instead of inlining it.

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
| `packages/canvas-store` | `@invana/canvas-store` | **renderer-free kernel (foundation).** Owns **one `CanvasStore { view, data, events }` per `Canvas`** — the hub the engine writes to *and* subscribes from: **`view`** (`ReactiveStore<CanvasView>` — config + interaction state, behind the port: zustand now, Yjs later), **`data`** (owned, keyed `DataStore`s — the graph; positions/bulk are an internal typed-array detail, never the reactive path), **`events`** (the `CanvasEventBus` + tap), plus **telemetry** + **history**. **Renderer-free leaf: zero `@invana` deps, imports no drawing library** — pixi is one adapter. See `docs/canvas-state-plan.md`. | `zustand`, `immer` (later `yjs`) |
| `packages/canvas` | `@invana/canvas` | the **renderer-agnostic orchestrator** over `@invana/canvas-store` — `Canvas`, `Layer`, `Behaviour`, `Layout`, registries, the **spec vocabulary** (`specs/`), **picking** (`hit/`), **connector geometry** (`connectors/` — routers, path styles, anchors, sampling), badge placement, tweens, camera semantics, SVG export, and the **renderer contract** (`renderer/IRenderer.ts`) + its headless double. **Imports no drawing library.** Deps: `@invana/canvas-store`, `rbush`; `@invana/renderer-pixijs` is an *optional peer*, lazily imported as the default backend. | `rbush`, `immer`, `zustand` (dep: `@invana/canvas-store`) |
| `packages/renderer-pixijs` | `@invana/renderer-pixijs` | **the PixiJS drawing backend — the only package in the repo that imports a drawing library.** Implements `IRenderer` / `ISurface` / `IElementRenderer` / `ICameraBinding`: the pixi `Application`, the viewport binding, all of `primitives/` (shapes, connectors, decorations, effects, markers, paint), textures and fonts. Enforced by `pnpm check-boundaries`. See its `CLAUDE.md`. | `pixi.js`, `pixi-viewport` (peers: `@invana/canvas`, `@invana/canvas-store`) |
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
| `packages/canvas-react` | `@invana/canvas-react` | **headless React binding layer** — declarative `<Canvas>` / `<GraphCanvas>` roots, contexts, null-rendering layer/behaviour/layout wrappers, and store/engine hooks. Renders **no application UI**; **never imports `@invana/ui`**. See its `CLAUDE.md`. 🚧 UI still migrating out per `docs/ui-consolidation-plan.md`. | `lucide-react` (dep: `@invana/themes`) |
| `packages/canvas-ui` | `@invana/canvas-ui` | **the React UI kit** — all pixels (components, toolbars, menus, editors, view panels, `GraphCanvasApp`) built **on** canvas-react's hooks, so it couples to `@invana/canvas-store` and is **live by default**. Owns `@invana/ui`; pixi never enters. See its `CLAUDE.md`. | — |
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

`@invana/ui`, `@invana/forms`, `@invana/themes`, `@invana/styling` are **published packages from the Invana design kit** (separate repo). They are consumed here as normal registry deps — there are no `packages/ui` / `packages/forms` / etc. folders. `canvas-ui` builds its UI on `@invana/forms` + `@invana/ui`; `canvas-react` pulls `@invana/themes` (+ `@invana/graph` as a peer) but — as the headless layer — **not** `@invana/ui`. Don't try to `--filter` or build these locally; bump their versions like any third-party dep.

### Dependency layering (use when adding/bumping workspace deps)

```
@invana/canvas-store  (renderer-free KERNEL — zero @invana deps, no drawing-lib import; store + events + telemetry + history)
   ▲   (consumed by canvas, graph, canvas-react)
   │
@invana/canvas  (renderer-AGNOSTIC orchestrator: specs, picking, geometry, camera, the IRenderer
   ▲             contract + headless double. Imports NO drawing library.)
   │
   ├── @invana/renderer-pixijs   (the pixi BACKEND — peer: canvas + canvas-store; owns pixi.js
   │                              + pixi-viewport. canvas declares it an OPTIONAL PEER and
   │                              resolves it by lazy import() when no `renderer` is supplied.)
   ├── @invana/graph                         (peer: canvas; dep: canvas-store)
   │      ▲
   │      ├── graph-layout-*                 (peer: canvas, graph)   — d3-force/elkjs/d3-hierarchy/d3-sankey/geometric
   │      ├── graph-layer-d3-contour         (peer: canvas, graph)
   │      └── graph-layer-bubble-sets        (peer: canvas, graph)
   ├── graph-layer-maplibre                  (peer: canvas only)
   └── @invana/canvas-react                  (HEADLESS bindings — peer: canvas, graph, graph-layout-d3-force; dep: themes, canvas-store; NO @invana/ui)
          ▲
          └── @invana/canvas-ui              (the React UI KIT / all pixels — peer: canvas-react, canvas[types], graph[types], graph-layout-d3-force, ui, themes, styling, forms)
                 ▲
                 └── @invana/canvas-designer (peer: canvas-ui, graph, ui, forms)

@invana/graph-datasets                       (peer: graph)
```

> 🚧 The **canvas-react → canvas-ui** re-split (headless vs pixels; UI moving out of canvas-react, dep direction flipping to canvas-ui → canvas-react) is **in progress** — see `docs/ui-consolidation-plan.md`. The graph above shows the **target**; some UI still physically sits in canvas-react until the phased move completes.

**The renderer boundary is the load-bearing rule here.** A drawing library may be imported *only*
inside a backend package. `pnpm check-boundaries` (`scripts/check-renderer-boundary.mjs`) fails the
build on a violation and runs as part of the root `pnpm lint`; an ESLint `no-restricted-imports`
rule surfaces it in the editor too (it can only warn — the shared config loads
`eslint-plugin-only-warn`). If the engine needs something from a backend, add it to the contract in
`packages/canvas/src/renderer/IRenderer.ts` and implement it there. See `docs/renderer-split-design.md`.

Rules implied by this graph: cross-package engine deps are **`peerDependencies`** (+ mirrored in `devDependencies` for local builds), never plain `dependencies` — except `canvas-react`→`@invana/themes`, the foundational **`@invana/canvas-store`** dependency (a normal `dependency`, not a peer — the shared kernel below the engine), and app deps. Keep all in-repo packages on the **same version** when bumping. A new layout/layer package peers on `@invana/canvas` (+ `@invana/graph` unless it's canvas-only like maplibre) and lists its single algorithm lib as a 3rd-party `dependency`. After adding a package, also add it to `apps/storybook`'s deps if it gets a story.

### The two React packages — headless bindings vs the UI kit

The split axis is **headless vs pixels** (the React Flow split). Detailed rules live in each package's `CLAUDE.md`; the one-line litmus for any React file:

> **Draws UI the user sees?** → `@invana/canvas-ui`. **Adapts the engine to React *without* drawing UI** (renders `null`, provides a context, or is a hook)? → `@invana/canvas-react`.

- **`@invana/canvas-react`** — headless bindings only: roots, contexts, null-rendering wrappers, store/engine hooks. Never imports `@invana/ui`, draws no application UI. See `packages/canvas-react/CLAUDE.md`.
- **`@invana/canvas-ui`** — the UI kit: `components/` · `toolbars/` · `menus/` · `panels/` (store-connected) · `editors/` (schema editors, controlled + connected wrappers) · `view-panels/` (presentational `*ViewPanel` surfaces) · `apps/` (`GraphCanvasApp`) · `hooks/` (UI-only turnkey). Built on canvas-react's hooks, so it couples to `canvas-store` and is live by default. See `packages/canvas-ui/CLAUDE.md`.

New behaviour/layer/layout ⇒ still ships a schema editor in `canvas-ui/editors/<category>/<surface>/` (`<category>` = `behaviours`/`layers`/`layouts`; high-level/aggregate editors live in the top-level `editor-panels/`, a sibling of `editors/`) — root rule 12. Full plan + move manifest: `docs/ui-consolidation-plan.md`.

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
- **Toolbar components** (assembled toolbars in `packages/canvas-ui/src/toolbars/`) carry the `*Toolbar` suffix — e.g. `CanvasControlsToolbar`, `GraphToolbar`. The dumb building blocks in `canvas-ui/src/components/` (e.g. `ZoomControls`, `Panel`) do **not** — they're components, not toolbars. (Both live in `@invana/canvas-ui`, the UI kit — see `docs/ui-consolidation-plan.md`; some still physically in `canvas-react` mid-migration.)

---

## Global Coding Rules

> **Never `git commit` or `git push` unless I explicitly ask in the *current* message.** Prior-turn approval does **not** carry forward — each commit/push needs a fresh, explicit request from me. Don't commit as a side-effect of finishing a task, and don't offer to commit unprompted. Staging (`git add`) is only ever a step within a commit I asked for.

1. Don't write code unless we discuss and I give a go ahead.
2. Ask me questions before coding.
3. All new code goes in the active packages listed above.
4. **No drawing-library import outside a backend package.** `pixi.js` / `pixi-viewport` belong to `packages/renderer-pixijs` and nowhere else — not in `@invana/canvas`, not in `@invana/graph`, not in a story. Enforced by `pnpm check-boundaries`.
5. No direct `new Graphics()` / `new Container()` outside `packages/renderer-pixijs/src`. A layer draws by publishing **specs** or through `surface.overlay(...)`; it never constructs a display object.
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
12. **Every new Behaviour, Layer, or Layout ships a settings editor in `@invana/canvas-ui`.** Its constructor options *are* the editable state of the visualisation (long-term we'll call this "state", not "settings" — a bigger refactor, but that's what it is). So whenever you add a behaviour/layer/layout, add a schema-driven editor for it to the editors package (`packages/canvas-ui/src/editors/<category>/<surface>/` where `<category>` is `behaviours`/`layers`/`layouts` — high-level/aggregate editors go in the top-level `packages/canvas-ui/src/editor-panels/`; follow the `fields.ts` + `mapping.ts` + `<Surface>EditorPanel` pattern). **The class must also declare `override readonly kind = '<surface>'`** — a stable, minification-safe discriminator matching its editor's registry key (the base `Behaviour`/`Layer`/`Layout` declare `readonly kind?: string`). That's what lets domain-free tooling (`CanvasSettingsEditorPanel`) resolve an instance's editor without an `instanceof` map. This is what exposes the visualisation's state to the **Invana building studio** and to stories — every story should be able to surface those editors in the UI via `GraphCanvasApp`. The **controlled** editor stays a pure form (state in → patch out); a thin **connected wrapper** does the store wiring so consumers drop it in with no bridge — apply path `useGraphCanvasUpdate().update(...)` → `setOptions` (init-only options remount via the canvas-react wrapper). See `packages/canvas-ui/CLAUDE.md`, `docs/ui-consolidation-plan.md`, and `roadmap.md`.

13. **No hand-rolled CSS in React UI.** Don't write inline `style={{…}}` objects, `CSSProperties` consts, or raw CSS for *static* presentation. Use **`@invana/ui` components** for chrome (`Card`/`CardHeader`/`CardContent`, `Separator`, `Badge`, `Button`, `Alert`, …) and **Tailwind design-token utility classes** via `className` for layout/spacing/type (`flex`, `flex-col`, `gap-4`, `p-4`, `bg-card`, `text-muted-foreground`, `text-xs`, …). The design-kit Tailwind theme is assumed present (it works in Storybook too). The **only** allowed inline `style` is a genuinely **dynamic runtime value Tailwind can't express**: a computed colour (`style={{ background: hex }}`), a cursor / absolute coordinate (`style={{ left: x, top: y }}`), or a prop-driven pixel size (`style={{ width: imageSize }}`). Static `display`/`flex`/`gap`/`padding`/`font`/`colour` literals are violations — convert them. Applies to `@invana/canvas-ui`, `@invana/canvas-react`, `@invana/canvas-designer`, and stories. **Exempt:** the engine roots' canvas-host `<div>` sizing (`Canvas`/`GraphCanvas`/`useCanvasEngine`) — that's structural layout of the render surface, not chrome. `preview-cards.tsx` is the reference for the target style.

14. **When I paste an error log, stack trace, screenshot of a broken render, or otherwise report a bug: diagnose first, then ask before fixing.** Investigate as deeply as you need — grep, read source, run `check-types` / tests, reproduce it in Storybook — then **report the diagnosis and stop**: what's actually wrong, the root cause with `file:line`, why it produces the symptom I showed, and the fix you propose (a sentence or two, not a patch). Then ask for confirmation and **wait** for it. A pasted error is a request to *explain*, not a standing go-ahead to edit — the diagnosis is often the whole deliverable, and a wrong guess applied silently costs more than the question. This is rules 1–2 restated for the debugging path, so the same exception applies: if that same message also says "fix it" / "please fix this" (or I confirm afterwards), land the fix. Read-only investigation never needs permission.

15. **Every feature or fix gets an RFC in `docs/rfcs/` before the code.** When I ask for a new capability or to fix something, write the document first — `docs/rfcs/feat/YYYY-MM-DD-<slug>.md` for a new capability, `docs/rfcs/fix/YYYY-MM-DD-<slug>.md` for something already shipped that behaves wrong — then **summarise it in chat and stop**. I approve it whole, in part ("rows 1–5 only"), or send it back; only then do you implement, and afterwards you update the RFC's `Status`. The format lives in [`docs/rfcs/README.md`](./docs/rfcs/README.md) — read it before writing one. RFCs are **table-first**: they're decision history destined for a knowledge graph, so tables carry the content, prose is capped at a line or two per heading, every row has a stable append-only ID (`S1` / `F3` / `D-2` / `V1`), and every reference to a real thing uses the entity vocabulary (`pkg:` · `file:…#L430` · `sym:` · `story:` · `doc:` · `rfc:` · `dataset:`) rather than English. YAML front matter (`id` · `type` · `status` · `opened`/`decided`/`landed` · `packages` · `relations`) is the machine-readable half. Sections: **symptom (+ what you ruled out) → diagnosis as a causal chain with `file:line` (+ the confirming test) → prior art → fix table (`ID · Kind · Status · File · Change · Effect · Risk · Depends on`) → blast radius, upstream *and* downstream → verification (including a control that works today) → decisions → append-only history.** **Status is per row, not just per RFC** — each fix row is `proposed`/`accepted`/`landed`/`deferred`/`rejected`/`superseded` and each check is `pending`/`pass`/`fail`/`skipped`, because the usual outcome is "rows 1–5 yes, row 6 later"; a rejected row is **kept, never deleted** — the rejection is the record. A fix row is `landed` only when every check covering it passes, and the RFC is `landed` only when every row is `landed`/`rejected`/`superseded`. Two things that are always required: **name the downstream consumers** that could break (packages, stories, published API, serialised state, docs — "various stories" is not a blast radius), and **separate the defect from the dressing** — a change that hides the symptom without removing the cause gets its own row and says so. Check `docs/` first: for several areas the design of record already exists as a `*-plan.md`, and the RFC then scopes the *landing*, not the design. This does not apply to trivial mechanical edits (a rename, a typo, a value tweak I dictate) or to read-only investigation.

### Kernel architecture — `@invana/canvas-store`: `CanvasStore { view, data, events }`

The renderer-free kernel **`@invana/canvas-store`** owns all canvas state **and** the event bus (see `docs/canvas-state-plan.md`, which sequences `docs/reactive-state-store-plan.md` + `docs/store-owns-state-plan.md` + `docs/collaborative-state-plan.md`). Each `Canvas` has **one `CanvasStore`**; **`@invana/canvas` is the pixi renderer over it** — it *writes* to the kernel (behaviours → `store.update`, pixi input → `events`) and *subscribes* to it to render (the renderer is a **pure projection** of state; state changes → re-render). `canvas-react`, the `canvas-ui` editors, and the Designer also read/write **through it**, never their own copy. **State** = the value (`CanvasView` / data records); **store** = the reactive container; **events** = the bus — the store owns its *change* events (its change stream) and is a *source* on `events`; the kernel owns the bus (input/lifecycle/render flow in via the engine).

- **One `CanvasStore { view, data, events }`.** **`view`** (`ReactiveStore<CanvasView>`) = how the visualisation is defined + viewed (layers / behaviours / layouts config, `activeLayout`, templates, theme, selection / hover / camera). **`data`** = a **keyed registry of data sources** (`Record<string, DataStore>` — graph / table / geo …; many view layers may project one source). **`events`** = the `CanvasEventBus` + tap. **Position is a node field inside a data source** (not a top-level compartment), and **groups** (bubble-sets / shaped containers) are a **keyed many-to-many `groups` collection** (`memberIds[]`, not `parentId`) whose encapsulating geometry is *derived* (like a layout, throttled for bubble-sets) — see `docs/canvas-state-plan.md` §3.1.
- **Storage physics is internal to each member, not a third branch.** Small / human-rate state (all of `view`; `data`'s annotations / query refs / counts) → the **reactive store** (immer-backed, observable, syncable). Machine-rate fields (`data`'s node `x`/`y`, bulk payloads, render flags) → **typed-array `ColumnStore` / `GraphStore`**, delivered to the renderer via a **batched, frame-coalesced flush** with targeted per-node re-render — **never** the reactive/immer/CRDT path (which clones at 5–50 ms vs ~10 ns). So the renderer reacts to `CanvasStore` at every scale; the engine just routes position churn through the typed-array fast path. **Positions are derived locally by the layout and never synced.** Camera is an **abstract `{ x, y, zoom }` transform**, throttled / ephemeral — not a `pixi-viewport` handle (renderer-agnostic; pixi is one adapter).
- **Program against the `ReactiveStore<T>` port, not zustand directly.** zustand is one adapter (`packages/canvas-store/src/adapters/zustand/createReactiveStore.ts` — the *only* zustand importer) behind the same core (`createStoreFromCell`); `createMemoryStore` is a dep-free reference adapter proving the swap. **No `import … from 'zustand'` outside that adapter** — so the backend stays swappable (valtio / nanostores / Yjs-backed for collaboration). `@invana/canvas-store` imports **no drawing library**.
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
