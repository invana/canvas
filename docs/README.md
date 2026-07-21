# Design notes & plans

Internal design rationale and implementation plans for the `@invana/canvas`
monorepo. **Not** part of the published VitePress site (`apps/docs/`) — these are
working design-of-record documents. Day-to-day API/concept docs live in
`apps/docs/`; the product "why" + direction lives in [`../roadmap.md`](../roadmap.md).

> New plans/design notes go **here** (`docs/`), not at the repo root.

## Architecture

- [architecture-proposal.md](./architecture-proposal.md) — target Layer / Behaviour /
  Layout / Renderer architecture for the rewrite. Long-form rationale; partially
  implemented. Referenced by `§`-number from source TSDoc across `packages/canvas`.
- [canvas-engine-types.md](./canvas-engine-types.md) — **the `@invana/canvas` engine type reference (as-built)**: the full public type surface grouped by subsystem — primitives (geometry · shapes · fills · stroke · labels · connectors/anchors/routers/pathStyles/markers · decorations · effects), engine (Canvas/config · Camera · Context · Events incl. the full `CanvasGlobalEvents` + renderer event maps · Renderer · Theme), and abstractions (Layer/Behaviour/Layout bases + built-ins · Store/DirtyBatcher/ColumnStore · registries). The renderer layer the graph types compile down to; companion to the state inventory. Notes the source≠docs naming caveats (`PrimitivesRenderer`, `BaseShapeSpec`, …).

## Implemented (kept as design-of-record)

- [canvas-templates-plan.md](./canvas-templates-plan.md) — canvas templates & theming (runtime implemented).
- [element-detail-value-rendering-plan.md](./element-detail-value-rendering-plan.md) — detail views + extensible property rendering.

## Data model

- [data-types-instances.md](./data-types-instances.md) — input vs stored instances (NodeData/NodeOption split, G6-aligned).
- [data-types-implementation-plan.md](./data-types-implementation-plan.md) — phasing for the data-model migration.
- [node-edge-options-plan.md](./node-edge-options-plan.md) — **superseded** (data-model layer) by `data-types-instances.md`; render-shape decisions still hold.
- [node-styling-unification-plan.md](./node-styling-unification-plan.md) — **one tiny semantic node-styling API** (`primaryColor` / `label` / `showLabel` / `size` / `icon` / `shape`) that styles **both** simple shapes and composite/template nodes, hiding the flat `NodeStyle`. Composite = a shape kind extending `CompositeShape` (registered like any shape; explicit w/h, no scalar size); templates take `primaryColor`; content-LOD (semantic zoom) deferred into the template. Phased impl + deferred declarative-template form.

## State & options

- [store-owns-state-plan.md](./store-owns-state-plan.md) — make `GraphStore` the single owner of interaction state.
- [store-owns-state-pseudocode.md](./store-owns-state-pseudocode.md) — companion pseudocode for the above.
- [unified-canvas-options-plan.md](./unified-canvas-options-plan.md) — one declarative, id-addressed `GraphCanvas` options object.
- [canvas-state-plan.md](./canvas-state-plan.md) — **the consolidated review doc** for `@invana/canvas-store`: concepts + data model (`CanvasStore { view, data }`), architecture + code/file structure, performance (the "state → targeted render" wiring), telemetry, collaboration, and the **migration from the existing engine + its impact/blast radius**. Sequences the four state docs below at the package level.
- [canvas-store-data-event-flow.md](./canvas-store-data-event-flow.md) — **the data hierarchy + flow companion**: the full `CanvasStore { view, data, events }` tree, the data write→trigger→flush→render path (incl. the `FlushMode` trigger), the bus event families + `state:change`/`data:flush` bridges, and the `dataLayerId` pointer + `ctx.self` facade. Tags ✅ built vs 🔧 proposed.
- [canvas-store-d13-data-ownership.md](./canvas-store-d13-data-ownership.md) — **the D13 decision doc** (Phase 3 gate): reconciling graph's mature `GraphStore` with the kernel's `LayerData` — recommends *interface, not inheritance* (kernel `DataSource` interface + registration; `GraphStore` implements it; no merge), with the event-model crux (granular vs delta) resolved via an additive `onChange` projection on `GraphStore`. Sub-steps 3.1a–3.3.
- [canvas-store-migration-plan.md](./canvas-store-migration-plan.md) — **the execution plan**: the phased, checklist-driven path from today's as-built kernel (Phase 0 done) to a fully-wired `canvas-store` driving the engine — kernel fast lane (Phase 1) → engine-under-the-store M0 (Phase 2) → data ownership D7 (Phase 3) → React reads, interaction/camera fold, drop-bridge, telemetry, collab, scale. Per-phase gates + revertibility; maps each cross-cutting decision to the phase that resolves it. The actionable companion to `canvas-state-plan.md` §10.
- [canvas-store-state-inventory.md](./canvas-store-state-inventory.md) — **the state census + type map**: every piece of state across canvas settings / layers / behaviours / layouts / styling / templates / theme / records, each with its **type definition**, **physics class** (definition / interaction / runtime / data-cold / data-hot / derived / handle), source-of-truth today, and **target home** in `canvas-store`. Includes the proposed kernel shape, per-instance config catalogs, the rendering-data-model type appendix, a source→target mapping table, and the 9 cross-cutting decisions.
- [reactive-state-store-plan.md](./reactive-state-store-plan.md) — single reactive store (zustand behind a transferable `ReactiveStore` port) for config + interaction state; no UI copies; telemetry decorator; CRDT-ready.
- [collaborative-state-plan.md](./collaborative-state-plan.md) — near-realtime, multi-user, offline collaboration on top of that store (CRDT doc + presence, PG/Redis, OTel).

## Architecture (3-package direction)

- [event-taxonomy.md](./event-taxonomy.md) — canonical event catalogue + the `<domain>:<subject>:<action>` bus naming scheme (telemetry / realtime / query), and the **state-ownership migration map** that moves all state + events out of the engine into `canvas-store`.
- [canvas-3-package-architecture.md](./canvas-3-package-architecture.md) — **draft**: target split into `canvas-store` (state + events) / `canvas` (orchestrator) / `canvas-pixijs` (renderer), with one end-to-end example (state + events + telemetry + history + rendering + layout updates) and the phased path (`IRenderer` abstraction gated to Phase 3).
- [canvas-renderer-split-plan.md](./canvas-renderer-split-plan.md) — **the concrete split plan**: a file census of `packages/canvas/src` (49/117 import pixi) classifying every subsystem as → `canvas-pixijs` (renderer) / stays in `canvas` (orchestrator) / deleted-or-relocated (state machinery) / straddler-split across the `IRenderer` seam, plus the hard parts and phasing (P0–P4). Anchored on the built `DataStore`.
- [renderer-pixijs-extraction-plan.md](./renderer-pixijs-extraction-plan.md) — **the P2 execution plan** (post kernel+seam): move drawing out of `canvas` into a new `@invana/renderer-pixijs`. Key finding — drawing already sits behind one imperative seam (`PrimitivesRenderer`; `graph` has zero pixi), so it's an interface-extraction, not a rewrite. Two interfaces (`IRenderer` lifecycle + `IPrimitivesRenderer` drawing), the 45-file census, the three hard parts (spec-type split · `ISurface` handle · camera/viewport rewire), and phasing P2.0–P2.4. Chooses the imperative model (store-projection = later north star).

## Operations / domain API

- [graph-canvas-operations.md](./graph-canvas-operations.md) — the **GraphCanvas operations layer**: graph verbs (focus / focusNeighbours / isolate / select-subtree / collapse / pin / remove) modelled as the **query → primitive action → composite op** stack, with a decomposition catalog. Composites batch kernel primitives + `GraphStore` queries; none live in the kernel (domain-free). Notes the view-vs-data batching split + undo semantics.

## React / UI / apps

- [ui-consolidation-plan.md](./ui-consolidation-plan.md) — **the headless-vs-pixels re-split** of `@invana/canvas-react` + `@invana/canvas-ui`: canvas-react becomes the **headless binding layer** (roots, contexts, null-rendering wrappers, store hooks — never imports `@invana/ui`), canvas-ui becomes the **React UI kit** (components, toolbars, menus, editors, views, `GraphCanvasApp`) built on canvas-react's hooks so it couples to `canvas-store` and is live by default. Dependency flips to **canvas-ui → canvas-react**; the 23 `@invana/ui` files + all pixels move out of canvas-react; editors keep a **controlled inner + connected wrapper** (packages the per-consumer `SettingsPanel` bridge once). Move manifest + 8-phase migration (P0 instructions → P7 connected wrappers).
- [canvas-react-plan.md](./canvas-react-plan.md) — React entry-point (declarative `<Canvas>`).
- [graph-canvas-apps-plan.md](./graph-canvas-apps-plan.md) — `GraphCanvasApp` compound component.
- [designer-studio-plan.md](./designer-studio-plan.md) — **Designer** studio page (sibling of Explorer, on `GraphCanvasApp`); umbrella doc sequencing the state refactor → editor kit → page → telemetry → collaboration.
- [toolbars-plan.md](./toolbars-plan.md) — reusable toolbar building blocks + assembled toolbars.
- [node-style-live-binding-plan.md](./node-style-live-binding-plan.md) — **store-bound node-style editing**: a `useNodeStyleEditor(nodeId)` hook + `<GraphNodeStyleEditor>` drop-in (canvas-react) that seed a headless canvas-ui editor from `resolveNodeStyle`, stay reactive via `useGraphEvent('node:update')`, and write back live via `updateNode` (raw-`style` spread, history-coalesced) — so editors reflect the canvas and auto-sync without hand-wired `onSubmit`/`updateNode`. Also fixes the "Size shows 0" symptom (unset `size` override) by dropping raw `size` from the Simple basics tier. Live-vs-Apply, the wholesale-style footgun, and why `useStore` can't read nodes.

## Performance & scale

- [large-graph-performance-plan.md](./large-graph-performance-plan.md) — **rendering perf on large, crowded graphs** (the ~5k-node / ~28.6k-edge "hairball"): the symptom, the telemetry-measured root cause (no viewport culling + one `Graphics` per edge → ~110k display objects re-rendered every frame; the `layers` phase dominates pan/drag/layout; loose edge bboxes make hover hit-test expensive), the **zoom-regime framing** (culling wins zoomed-in; batching + LOD win zoomed-out; neither is universal), the render options (A culling · B edge batching · C zoom-LOD · D cache path samples · E gate edge hit-test by zoom · F frame-coalesced flush · G hover fast-path), and — for **hovering the *right* edge in a crowd** — the edge-pick **correctness** analysis (nearest-wins is technically right but flickers / is ambiguous / invisible when edges are near-coincident) with its own options (H segment-level hit index · I stable nearest + hysteresis · J node-incidence bias · K node-hover-first · L ambiguity picker) and the "reliable-when-separable, graceful-when-not" stance. Recommended phasing: cheap standalone wins + edge-pick stability first → segment index → culling → batching/LOD. Companion to the `feat/canvas-telemetry-otel` observability work.

## Engine features

- [text-labels-plan.md](./text-labels-plan.md) — text labels for nodes & edges.
- [badges-edges-plan.md](./badges-edges-plan.md) — badges on edges + node parity (draft).
- [per-element-visibility-plan.md](./per-element-visibility-plan.md) — **first-class per-element hide/show** for nodes & edges (single + batched bulk), a `hidden` flag stored as a `flags`-column bit (sibling of `pinned`) with the effective-visibility rule (edge hidden if an endpoint is) owned by `GraphStore`. Culls from render/hit-test/bounds/camera/layout/labels/minimap (not `alpha 0`), fixing invisible-but-clickable; `node:visibility`/`edge:visibility` events (derived-only incident-edge cascade), serialization round-trip, and `Layer.setVisible` + `scene:layer:visibilitychange` for whole-layer visibility.
