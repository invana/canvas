# D13 — Data Ownership Reconciliation (`GraphStore` ↔ `LayerData`)

> **Status: DESIGN — decision needed before implementing Phase 3.** Companion to
> [`canvas-store-migration-plan.md`](./canvas-store-migration-plan.md) Phase 3.
> Written after reading `packages/graph/src/store/GraphStore.ts` end to end against
> the kernel's `packages/canvas-store/src/data/LayerData.ts`.

## The finding

Both are two-lane (`ColumnStore` hot + `Map` cold) bulk stores — but they are **two
parallel implementations at very different maturity**, with a **different event
contract**:

| | `GraphStore` (`@invana/graph`) | `LayerData` (kernel) |
|---|---|---|
| hot lanes | node `x/y/flags` **+ edge `srcSlot/dstSlot/flags`** | node `x/y/flags` only |
| adjacency | `outAdj`/`inAdj` `AdjacencyIndex` (O(1) degree/neighbours) | — |
| hierarchy | `childrenIndex` + cycle checks | `parentId` field only (no index) |
| out-of-order edges | `PendingEdges` buffer + TTL | — |
| presence state | `nodeRuntimeStates`/`edgeRuntimeStates` (+ doc∪runtime union reads) | — (lives in `view.interaction` plan-side) |
| **events** | **granular** `SourceEmitter`: `node:add`/`node:update{patch}`/`node:remove`/`edge:*`/`node:state`/`flush{counters}` | **one coalesced** `flush{ delta:{added,changed,removed,moved,movedAll} }` |
| coalescing | `FrameFlushScheduler` + dedup queues + batch | `scheduleFlush` + dirty sets + `moved`/`movedAll` |
| consumer | `GraphLayer` is wired to the **granular events** | the kernel `data:flush` bridge drains the **delta** |

**`GraphStore` is the battle-tested one; `LayerData` is the kernel's simpler
reimplementation of the same idea.** The duplication is the problem.

## Options

- **(A) `GraphStore` *becomes/extends* a kernel base** — ❌ blocked. The kernel
  (`canvas-store`) can't depend on `@invana/graph`, and `GraphStore` is *richer*
  than `LayerData`, so subclassing would invert the maturity. The migration plan's
  original tentative pick; reading the code rules it out.
- **(B) `LayerData` absorbs `GraphStore`'s features, `GraphStore` retires** — ❌
  wrong. Pulls graph-domain logic (adjacency, pending edges, edge slot maps) into
  the **domain-free** kernel, and throws away a mature, tested store.
- **(C) Interface, not inheritance** — ✅ **recommended.** The kernel defines a
  minimal `DataSource` **interface** (the ownership + lifecycle contract).
  `GraphStore` *implements* it and is **registered** into `CanvasStore.data[id]`.
  `GraphLayer` reads/subscribes `store.data[id]` instead of owning it privately.
  `LayerData` stays the kernel's **default/reference** `DataSource` for simple /
  non-graph sources (table, geo) and tests. **No merge, no inheritance.**

## The `DataSource` interface (proposed — kernel)

The minimal contract the kernel needs to *own* a source and *bridge* it to
`events`, that both `LayerData` and `GraphStore` already (nearly) satisfy:

```ts
interface DataSource {
  setFlushMode(mode: FlushMode): void;   // engine drives one rAF → 'manual'
  flush(): void;                          // drain pending → emit change
  readonly version?: number;              // monotonic (optional)
  onChange(listener: (c: DataChange) => void): () => void;  // the bridge subscribes here
}
```

`onChange` is the **one** convergence point. `CanvasStore.data` becomes
`Record<string, DataSource>`; `createCanvasStore` bridges each source's `onChange`
→ `data:flush` on `events`. Position fast-path, adjacency, etc. stay
source-specific (off the interface).

## The crux to resolve — the event model (C1 vs C2)

The bridge needs **one** change shape, but the two stores emit differently:

- **C1 (recommended): add a delta projection to `GraphStore`.** `GraphStore` keeps
  its granular events (so `GraphLayer` is **unchanged**) and additionally exposes
  `onChange(delta)` in the `LayerData` delta shape for the kernel bridge. Small,
  additive to `GraphStore`; zero `GraphLayer` churn.
- **C2: source-aware bridge** — the kernel adapts per source type. ❌ hacky; leaks
  source knowledge into the kernel.

→ **C1.** `LayerData.on('flush')` already *is* `onChange`; `GraphStore` gains a thin
`onChange` that maps its flush into the same delta envelope.

## Sub-steps (each green + revertible)

- [ ] **3.1a — Kernel: `DataSource` interface + registration.** Define `DataSource`;
  `CanvasStore.data: Record<string, DataSource>`; add `store.setSource(id, source)`;
  `store.layer(id)` keeps lazily creating a `LayerData` as the default. The
  `data:flush` bridge subscribes via `onChange`. *Additive; canvas-store tests stay
  green.*
- [ ] **3.1b — Graph: `GraphStore implements DataSource`.** Add the `onChange` delta
  projection (alongside the existing granular events) + `setFlushMode` parity.
  *Additive; GraphStore's many tests stay green — no behaviour change.*
- [ ] **3.2 — Graph: `GraphLayer` registers its store** into `ctx.store.setSource(id, store)`
  on mount (and resolves it from there), instead of owning it as a private field.
  `setData` / `<GraphLayer data>` route through the registered source. *Riskier —
  ownership move; verify with graph stories.*
- [ ] **3.3 — Engine: one rAF driver.** `Canvas` sets registered sources to
  `FlushMode:'manual'` and drains `flush()` once/frame.

## Risk

`GraphStore` has extensive tests — **3.1b must be strictly additive** (implement the
interface + add a projection; no behaviour change). **3.2** is the load-bearing
ownership move (`GraphLayer`), and the one step that needs **visual/story
verification**, which can't be done from type-check alone.

## Decision needed

1. Confirm **option (C)** — interface + registration, *no merge*.
2. Confirm **C1** — `GraphStore` gains an additive `onChange` delta projection; `GraphLayer` stays on granular events.

With those confirmed, **3.1a** (kernel-only, additive, safe) is the first step.
</content>
