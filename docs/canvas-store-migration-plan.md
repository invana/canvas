# Canvas Store — Migration Plan (execution)

> **Status: ACTIVE PLAN.** The actionable, phased path from *today's* as-built
> kernel to a fully-wired `@invana/canvas-store` driving the engine. This is the
> **execution checklist**; the design rationale + blast-radius analysis live in
> [`canvas-state-plan.md`](./canvas-state-plan.md) §10 (M0–M5). Type/shape
> references: [`canvas-store-state-inventory.md`](./canvas-store-state-inventory.md)
> (what state exists) and [`canvas-engine-types.md`](./canvas-engine-types.md)
> (the engine surface). Branch: `feat/canvas-store-events`.
>
> **Strategy: strangler, not rewrite.** The kernel slides *under* the existing
> engine; the old path keeps flowing; consumers migrate one at a time; the old path
> is deleted last. **Every phase keeps `pnpm check-types` + tests green and is
> independently revertible.**

## Invariants (must hold at every phase)

1. **Nothing machine-rate touches the reactive store** — positions/bulk never enter immer/CRDT.
2. **One flush per frame** regardless of write volume; **targeted render** (O(delta), `moved` ≠ `changed`).
3. **Idle readers cost 0** — structural sharing + selector equality.
4. Each phase: types green, tests green, **revertible**; the hot path is never in the reactive loop.

---

## Phase 0 — Kernel scaffold + fast-lane primitives ✅ DONE

Shipped (this branch): `ReactiveStore` port + zustand/memory adapters · `CanvasView`
(`definition` incl. `canvas` scene slice · `interaction` incl. `focus`/`transientPins` ·
`runtime`) · `events` bus + `state:change`/`data:flush`/`data:intent` bridges + tap ·
`telemetry` · `history` · `actions` · `theme` (`ResolvedTheme`/`CanvasThemeState`) ·
geometry vocabulary · **`ColumnStore` + `DirtyBatcher` relocated (D1)** · `LayerData`
(cold) · **92 tests**.

**Gap this plan closes:** the hot lane is *exported but unwired* — `LayerData` still
holds `x/y` as object fields; `ColumnStore` is unused. And the engine doesn't consume
the kernel at all yet.

---

## Phase 1 — Kernel fast lane (in `canvas-store`; no engine work) 🚧 IN PROGRESS

Make the "~10 ns/slot, zero-GC" path real. Self-contained — the flush/delta API stays
(almost) identical, so this lands with no downstream change.

- [x] **1a — Two-lane `LayerData`**: cold `Map<id, record>` (payload, minus `x/y`) + hot `ColumnStore<{x:'f32', y:'f32', flags:'u8'}>` (positions + `HAS_POSITION`/`PINNED`/`DISABLED`/`HIDDEN` bits via `NODE_FLAG`). `node(id)` stitches both lanes on read; the `flush` delta shape is unchanged (plus the additive `movedAll` flag below).
- [x] **1b — Layout fast-path API**: `positions` (the raw `ColumnStore` — hold col ref + slot, write in place) + `touchPositions()` (one O(1) all-moved flush); plus `setPositionsBulk(ids, Float32Array)` and `applyPositions(iterable)` for precise/partial updates; `setNodeFlag`/`nodeFlags` for flag bits.
- [x] **1e — `query`/stream status** on the source: `status` (`idle|loading|streaming|error`) + `onStatus` + the `intents` audit log.
- [x] **1f — Micro-benchmark** (`bench/positions.bench.ts`, `pnpm bench`) — results below.
- [ ] **1c — Fold onto `DirtyBatcher`** — *deferred.* `LayerData`'s inline dirty sets work + are tested; the relocated `DirtyBatcher` is exported for the **render side** (its real consumer). Pure refactor, no functional gain.
- [ ] **1d — Edge slot maps** (`source`/`target` as `Uint32` columns → O(1) adjacency + GPU path) — *deferred to when adjacency/GPU is needed.*

**Benchmark (50k nodes/sweep; one sweep = one full-graph layout tick):**

| Path | full-graph ticks/sec | vs object baseline |
|---|---|---|
| raw `ColumnStore` direct slot writes | ~39,700 | 26× |
| **`LayerData.positions` + `touchPositions()`** (force-sim path) | ~33,800 | **~26× — only 1.18× off raw** |
| `Map<id,{x,y}>` object writes (baseline) | ~1,500 | 1× |
| `setPositionsBulk` / `applyPositions` (precise-id, all 50k) | ~170 | — |

**Design refinement the bench surfaced:** when *every* node moves, `flush()` must
**not** enumerate an N-id `moved` array (the O(N) string alloc dwarfed the writes).
Fixed by adding `NodeDelta.movedAll: boolean` — the force-sim tick signals "all moved"
as a flag (O(1)); the renderer iterates the position column. The precise-id APIs build a
`moved` id set and are for **partial** updates — don't hand them all 50k ids; use the
`positions` + `touchPositions` path for full-graph ticks.

**Packages:** `@invana/canvas-store` only. **Gate:** bench ✅ + **performance validation
suite** (`tests/performance.test.ts` — G1 coalescing · G2 targeted/`movedAll` · G3
idle-wake + structural sharing · G4 typed-array hot lane · G5 `DirtyBatcher` O(changed)
+ throughput bounds) ✅ + 112 tests green ✅. **Revertible:** yes — API additive, no consumers yet.

---

## Phase 2 — Engine under the store (M0: zero behaviour change)

> **Groundwork already landed (`8fc8f30`):** `@invana/canvas` now depends on the
> kernel and **re-exports `ColumnStore`/`DirtyBatcher` from `@invana/canvas-store`**
> (D1) — its own copies are deleted; `@invana/graph`'s `GraphStore` keeps importing
> them via `@invana/canvas` unchanged. The engine does **not** yet create or use a
> `CanvasStore` — that's this phase.

The kernel becomes the observable truth *beneath* the existing apply path.

- [x] **2.1 — Construct.** `Canvas` creates a `CanvasStore` (`readonly store`) in its constructor → zero behaviour change.
- [x] **2.3 — Back config with `view.definition`, then make it authoritative.** `Canvas.update(patch)` writes `store.view.definition` (per-id deep-merge, untouched slices keep identity) + the `setOptions` fan-out + `options:change`. **`this.config` is now removed — `view.definition` is the single source of truth**; `Canvas.get()` projects from it, and the internal reads (late-layer catch-up, `refresh()`'s `activeLayout`) read the store. (Renderer-split kernel+seam step.)
- [x] **2.4 — Expose the store.** `canvas.store` (read-only) **and `ctx.store`** on `CanvasContext` — every layer/behaviour/layout receives the kernel at mount/register.
- [x] **2.2 — Reconcile the event bus (decision E1) — DONE (renderer-split, full rename).** `canvas` **deleted its own `events/` module** (`CanvasEventBus`/`CanvasEvent`/`EventEmitter`/`SourceEmitter`) and re-exports the kernel's; `canvas.events` **is** `store.events` (one bus). The kernel `CanvasGlobalEvents` became the **typed superset** and every emitter/subscriber across `canvas` + `graph` + `canvas-react` was renamed to the taxonomy names (`layer:added`→`scene:layer:add`, `camera:pan`→`input:camera:pan`, `renderer:initialised`→`canvas:renderer:ready`, `message`→`canvas:message:show`, …; `options:change` kept `@deprecated` until Phase 6). Kernel bus gained `off()`; `SourceEmitter.setBus` accepts `undefined`. **Also landed: the `IRenderer` seam** (`canvas-store/src/renderer/IRenderer.ts` — types only) so the renderer can be extracted next.
  - ⚠ **Storybook stories not renamed** (root rule 11 — needs explicit go-ahead): the `Conncepts/Events/*` demo stories still reference the old event names.

**Packages:** `@invana/canvas`. **Gate:** `canvas` type-checks ✅ + 133 existing tests green ✅; behaviour additive (mirror only). **Verify next:** Visualiser/MiniMap visual parity vs `main` (needs a story run). **Revertible:** yes — addition under the old path.

---

## Phase 3 — Data ownership move (D7)

`CanvasStore` *owns* the per-source data; layers read/subscribe instead of owning a store.

> **Decision D13 — resolved: *interface, not inheritance* (option C).** Reading
> `GraphStore` showed it is **far more mature** than `LayerData` (adjacency,
> pending-edge buffer, hierarchy index, presence), so subclassing is wrong. The
> kernel defines a minimal `DataSource` interface; `GraphStore` *implements* it and
> is *registered* via `store.setSource(id, …)`; `LayerData` stays the default. No
> merge. Full design + event-model resolution (C1) in
> [`canvas-store-d13-data-ownership.md`](./canvas-store-d13-data-ownership.md).

- [x] **3.0 — Re-export shim** (`8fc8f30`): `ColumnStore`/`DirtyBatcher` relocated to the kernel; `canvas` re-exports; `GraphStore` unchanged.
- [x] **3.1a — Kernel `DataSource` interface + registration.** `DataSource` (`onFlush`/`setFlushMode`/`flush`); `CanvasStore.data: Record<string, DataSource>`; `store.setSource(id, src)` + `store.source(id)`; `layer(id)` keeps lazily creating the default `LayerData` (guards if a custom source was registered); the `data:flush` bridge subscribes via `onFlush` (with re-bridge cleanup). `LayerData` gained `onFlush`. *canvas-store types + 112 tests green; canvas types green.*
- [x] **3.1b — `GraphStore implements DataSource`.** Added `onFlush` (a `LayerFlush` projection in `doFlush`: position-only updates → `moved`, else `changed`; edges added/changed/removed; groups/annotations empty; guarded so pure state-toggles + silent sim-tick writes don't emit) + `setFlushMode` (kernel `'manual'`→manual i.e. engine-driven, `'frame'`/`'microtask'`→frame scheduler; native `'sync'` stays the ctor default) + `'manual'` short-circuit in `scheduleFlushIfNeeded`. `canvas` re-exports `DataSource`/`FlushMode`/`LayerFlush`/`NodeDelta`/`KindDelta` from the kernel (extends the D1 re-export) so graph imports them via `@invana/canvas`. *Strictly additive — graph types clean, all 43 `GraphStore` tests green.* (Pre-existing unrelated failure: `template/compile.test.ts` `compileCard` label `maxLines` — not from this change.)
- [x] **3.2 — `GraphLayer` registers its store** on mount via `ctx.store.setSource(this.id, this.store)` (additive: the layer still owns the reference + renders from its granular events; registration makes the kernel own the source as `data[id]` and bridge `onFlush` → `data:flush`). *Type-checks clean across graph + canvas; `GraphStore` tests green.* ⚠ `GraphLayer` has no unit tests (pixi-context — story-tested), so **runtime/visual verification pending**.
- [x] **3.3 — Single canvas clock.** `Canvas.tickOnce` drains every registered `store.data` source's `flush()` once per frame, **before** the layer flush (so a source's delta marks its layer dirty in the same tick). *Additive* — `flush()` no-ops when nothing is pending, so 'sync'/'frame' sources are unaffected; switching a source to `'manual'` (the true single-clock optimisation) is the opt-in follow-up that needs visual verification. *canvas 133 tests green.*

**Packages:** `@invana/graph`, `@invana/canvas`. **Risk:** Med–High — biggest blast radius (§10.3); the `GraphStore`↔`LayerData` reconciliation (D13) is the load-bearing call.

---

## Phase 4 — Granular reads + React binding (M1, D5)

- [ ] `useStore(store, selector)` in `@invana/canvas-react` via `useSyncExternalStore` (+ `select` equality).
- [ ] Migrate readers **one at a time** off the coarse `options:change` to slice-scoped subscriptions: `useGraphCanvasOptions` (drop the copy anti-pattern), `MiniMapLayer`, the `canvas-ui` editors.

**Packages:** `@invana/canvas-react`, `@invana/canvas-ui`. **Gate:** idle components don't re-render on unrelated change. **Risk:** R4 (selector instability) — module-scope/`useCallback` selectors.

---

## Phase 5 — Fold interaction + camera (M2, D3/D11) + resolve the state model

- [ ] Behaviours write selection/hover/states/camera via `view.update(patch, action)` (the action layer already exists).
- [ ] Move presence (`GraphStore.nodeRuntimeStates`) → `view.interaction.states`; wire `focus` (highlight-neighbourhood) and `transientPins` (drag locks) — both already in the view shape.
- [ ] **Resolve the 3-way `states` split** (inventory §11.1): catalogue → `definition.styling`; document flags (`disabled`) → `data`; presence → `interaction.states`. Renderer reads the union.

**Packages:** `@invana/graph`, `@invana/canvas`. **Gate:** `rerenderNode(id)` granularity preserved; hover-sweep over 50k stays one focus update + one dim/frame.

---

## Phase 6 — Drop the bridge (M3)

- [ ] Remove the back-compat `options:change` re-emit once no consumer depends on it (confirm via grep + the migrated readers from Phase 4).

**Gate:** nothing subscribes to the legacy event. **Revertible:** re-add the one re-emit line.

---

## Phase 7 — Telemetry wired (M4)

- [ ] App wires an OTel adapter to the `TelemetrySink` (`action` → span/metric name, `changedPaths` → attributes, sampling at the sink). Engine stays exporter-agnostic. Additive — everything already flows through `update`.

---

## Phase 8 — Collaboration (M5)

- [ ] Yjs/Automerge adapter behind the `ReactiveStore` port (`update` → a Yjs txn) + **Awareness** for presence. Consumers unchanged.
- [ ] Enforce the three-channel split: `definition` → Doc; `interaction` → Awareness; `data` positions/bulk → **never** the CRDT.
- [ ] History delegates to Yjs `UndoManager` (same `createHistory` surface).

---

## Phase 9 — Scale path (benchmark-gated, optional)

- [ ] GPU-resident position buffer (share the `Float32Array` with a WebGPU-compute layout — no CPU readback).
- [ ] Group geometry derivers (throttled for bubble-sets); `groups` as first-class many-to-many (inventory §11.6).

---

## Sequencing

```
Phase 0 ✅ ─► Phase 1 (kernel fast lane) ─► Phase 2 (engine M0) ─► Phase 3 (data ownership D7)
                                                   │
                                                   ├─► Phase 4 (React reads) ─► Phase 6 (drop bridge) ─► Phase 7 (telemetry)
                                                   └─► Phase 5 (interaction/camera + states split)
                                                                                                     └─► Phase 8 (collab) ─► Phase 9 (scale)
```

Phase 1 is independent and unblocks confidence in the perf model. Phases 2→3 are the
load-bearing engine integration. 4 and 5 can proceed in parallel after 3. 6 depends on 4.

## Cross-cutting decisions — where each is resolved

| Decision (inventory §11) | Resolved in |
|---|---|
| 3-way `states` split | Phase 5 |
| Two-lane `data` (hot/cold) | **Phase 1** |
| Derived-written-back behaviours | Phase 3/5 (decide: store vs re-derive) |
| Function-valued config / serialisability | Phase 8 (CRDT forces it; keep loose till then) |
| Live handles as options | Phase 2 (renderer-side injection) |
| Group model unification | Phase 9 |
| Interaction scattered → store | Phase 5 |
| Camera ownership under basemap | Phase 5 |
| Auxiliary stores (history/clipboard) | Phase 6/8 |

## Blast radius (per the design-of-record)

See [`canvas-state-plan.md`](./canvas-state-plan.md) §10.3 for the file-level impact table
(Canvas.ts, GraphStore/GraphLayer ownership, `useGraphCanvasOptions`, the
`ColumnStore`/`DirtyBatcher` relocation shims). This plan's Phase 2–3 are exactly those
load-bearing edits; Phase 1 has none (kernel-internal).
</content>
