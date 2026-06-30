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

## State & options

- [store-owns-state-plan.md](./store-owns-state-plan.md) — make `GraphStore` the single owner of interaction state.
- [store-owns-state-pseudocode.md](./store-owns-state-pseudocode.md) — companion pseudocode for the above.
- [unified-canvas-options-plan.md](./unified-canvas-options-plan.md) — one declarative, id-addressed `GraphCanvas` options object.
- [canvas-state-plan.md](./canvas-state-plan.md) — **the consolidated review doc** for `@invana/canvas-store`: concepts + data model (`CanvasStore { view, data }`), architecture + code/file structure, performance (the "state → targeted render" wiring), telemetry, collaboration, and the **migration from the existing engine + its impact/blast radius**. Sequences the four state docs below at the package level.
- [canvas-store-data-event-flow.md](./canvas-store-data-event-flow.md) — **the data hierarchy + flow companion**: the full `CanvasStore { view, data, events }` tree, the data write→trigger→flush→render path (incl. the `FlushMode` trigger), the bus event families + `state:change`/`data:flush` bridges, and the `dataLayerId` pointer + `ctx.self` facade. Tags ✅ built vs 🔧 proposed.
- [canvas-store-migration-plan.md](./canvas-store-migration-plan.md) — **the execution plan**: the phased, checklist-driven path from today's as-built kernel (Phase 0 done) to a fully-wired `canvas-store` driving the engine — kernel fast lane (Phase 1) → engine-under-the-store M0 (Phase 2) → data ownership D7 (Phase 3) → React reads, interaction/camera fold, drop-bridge, telemetry, collab, scale. Per-phase gates + revertibility; maps each cross-cutting decision to the phase that resolves it. The actionable companion to `canvas-state-plan.md` §10.
- [canvas-store-state-inventory.md](./canvas-store-state-inventory.md) — **the state census + type map**: every piece of state across canvas settings / layers / behaviours / layouts / styling / templates / theme / records, each with its **type definition**, **physics class** (definition / interaction / runtime / data-cold / data-hot / derived / handle), source-of-truth today, and **target home** in `canvas-store`. Includes the proposed kernel shape, per-instance config catalogs, the rendering-data-model type appendix, a source→target mapping table, and the 9 cross-cutting decisions.
- [reactive-state-store-plan.md](./reactive-state-store-plan.md) — single reactive store (zustand behind a transferable `ReactiveStore` port) for config + interaction state; no UI copies; telemetry decorator; CRDT-ready.
- [collaborative-state-plan.md](./collaborative-state-plan.md) — near-realtime, multi-user, offline collaboration on top of that store (CRDT doc + presence, PG/Redis, OTel).

## Architecture (3-package direction)

- [event-taxonomy.md](./event-taxonomy.md) — canonical event catalogue + the `<domain>:<subject>:<action>` bus naming scheme (telemetry / realtime / query), and the **state-ownership migration map** that moves all state + events out of the engine into `canvas-store`.
- [canvas-3-package-architecture.md](./canvas-3-package-architecture.md) — **draft**: target split into `canvas-store` (state + events) / `canvas` (orchestrator) / `canvas-pixijs` (renderer), with one end-to-end example (state + events + telemetry + history + rendering + layout updates) and the phased path (`IRenderer` abstraction gated to Phase 3).
- [canvas-renderer-split-plan.md](./canvas-renderer-split-plan.md) — **the concrete split plan**: a file census of `packages/canvas/src` (49/117 import pixi) classifying every subsystem as → `canvas-pixijs` (renderer) / stays in `canvas` (orchestrator) / deleted-or-relocated (state machinery) / straddler-split across the `IRenderer` seam, plus the hard parts and phasing (P0–P4). Anchored on the built `DataStore`.

## React / UI / apps

- [canvas-react-plan.md](./canvas-react-plan.md) — React entry-point (declarative `<Canvas>`).
- [graph-canvas-apps-plan.md](./graph-canvas-apps-plan.md) — `GraphCanvasApp` compound component.
- [designer-studio-plan.md](./designer-studio-plan.md) — **Designer** studio page (sibling of Explorer, on `GraphCanvasApp`); umbrella doc sequencing the state refactor → editor kit → page → telemetry → collaboration.
- [toolbars-plan.md](./toolbars-plan.md) — reusable toolbar building blocks + assembled toolbars.

## Engine features

- [text-labels-plan.md](./text-labels-plan.md) — text labels for nodes & edges.
- [badges-edges-plan.md](./badges-edges-plan.md) — badges on edges + node parity (draft).
