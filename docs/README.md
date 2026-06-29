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
- [reactive-state-store-plan.md](./reactive-state-store-plan.md) — single reactive store (zustand behind a transferable `ReactiveStore` port) for config + interaction state; no UI copies; telemetry decorator; CRDT-ready.
- [collaborative-state-plan.md](./collaborative-state-plan.md) — near-realtime, multi-user, offline collaboration on top of that store (CRDT doc + presence, PG/Redis, OTel).

## React / UI / apps

- [canvas-react-plan.md](./canvas-react-plan.md) — React entry-point (declarative `<Canvas>`).
- [graph-canvas-apps-plan.md](./graph-canvas-apps-plan.md) — `GraphCanvasApp` compound component.
- [toolbars-plan.md](./toolbars-plan.md) — reusable toolbar building blocks + assembled toolbars.

## Engine features

- [text-labels-plan.md](./text-labels-plan.md) — text labels for nodes & edges.
- [badges-edges-plan.md](./badges-edges-plan.md) — badges on edges + node parity (draft).
