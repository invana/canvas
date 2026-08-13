# CLAUDE.md — packages/canvas-store (`@invana/canvas-store`)

**The state machinery of the canvas.** The *language* of state (spec vocabulary,
`ReactiveStore` port contract, `CanvasView`, the `CanvasStore` interface, the
event bus classes, data primitives) lives one floor below in
`@invana/canvas-core`; this package supplies the **engines** behind those
contracts and re-exports the core vocabulary so kernel consumers import one
package.

## The one rule that defines this package

> **This is the only home of the state libraries.** `zustand` (the adapter),
> `immer` (the patch engine) and `rbush` (picking) are imported here and nowhere
> else in the engine — enforced by the `state`, `immer` and `core-purity` rows of
> `pnpm check-boundaries`. Everything else programs against the port.

## Layout

| Area | Contents |
|---|---|
| `port/` | the **engine** behind core's `ReactiveStore` contract: `patch.ts` (immer `produceWithPatches`), `store-core.ts` (`createStoreFromCell` — shared change/batch logic), `createMemoryStore` (zustand-free, still immer-backed), `createHistory` (undo/redo over the patch stream) |
| `adapters/` | `zustand.ts` — the repo's only zustand importer; the planned `yjs.ts` sibling is why the folder exists |
| `hit/` | picking: `HitIndex` (rbush) + `PickingIndex` (narrow phase over core's `shapeGeometry`) |
| `telemetry/` | `withTelemetry` port decorator, tracing/metrics/logging adapters, `wireTelemetry` |
| `CanvasStore.ts` | `createCanvasStore` — implements core's `CanvasStore` interface: builds the view store, instantiates the bus + theme, bridges `state:change` / `data:flush` / `specs:flush`, wires telemetry, fires `onCanvasStoreCreated` observers |

## Things worth knowing

- **`Layer.state` is built here, injected there:** the engine passes
  `createReactiveStore` into `CanvasContext.createStateStore`; core's `Layer`
  binds it at first mount. A Yjs-backed factory swaps in per-canvas at that seam.
- **`store.layer(id)` throws for custom sources** (a registered `GraphStore`
  etc.) — and the kernel's data *actions* (`store.actions.node.add` …) ride that
  accessor, so they target default `LayerData` stores only. Documented on
  `createActions`; unification over `DataSource` is deferred future work.
- **Patches are structural:** `StoreChange.patches` is typed with core's
  dependency-free `Patch`; immer's output satisfies it verbatim.

## Tests

`tests/` mirrors `src/`; suites for core-owned classes live in
`packages/canvas-core/tests/`. This package's tests may import core freely (it
is a real dependency).

## Build

`tsup` → ESM + `.d.ts` + sourcemaps, single entry. Dependency:
`@invana/canvas-core` (workspace). Public surface pinned by
`pnpm check-api-surface` (`api/canvas-store.surface.txt`).
