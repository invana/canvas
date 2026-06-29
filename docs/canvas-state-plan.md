# Canvas State — plan (`@invana/canvas-state`)

> **Status: DESIGN / ROADMAP — not shipped.** The **foundation** doc for the
> reactive state layer: a renderer-agnostic, single source of truth behind a
> transferable port, built so **telemetry** and **realtime collaboration** attach
> as decorators/adapters without touching consumers. This is the umbrella that
> **sequences** the four existing state docs into one package; it does not restate
> their detail. Branch: `feat/canvas-state`.
>
> Consumers (the **Designer**, Explorer, editors, viewers) live in their own docs
> — see [designer-studio-plan.md](./designer-studio-plan.md). This doc owns the
> *state*; those own what sits on top of it.

## Goal

**One `CanvasState` per `Canvas`** — the single source of truth for everything a
canvas shows, consumed by React **and** plain-JS/engine code with **no duplicate
copies and no manual syncing**. The renderer is a **pure projection** of it:
state changes → the renderer re-renders. Packaged as **`@invana/canvas-state`** —
a **renderer-free leaf** (zero `@invana` deps, imports no drawing library), so the
*same* state survives a renderer swap, a backend swap (zustand → Yjs), and powers
telemetry over every change.

## Decisions locked

| # | Decision |
|---|---|
| C1 | **Dedicated `@invana/canvas-state` package, a renderer-free leaf.** Owns the `ReactiveStore<T>` port + adapters (zustand now; Yjs/telemetry later). **Zero `@invana` deps; imports no drawing library.** `@invana/canvas`, `@invana/graph`, `@invana/canvas-react` depend on it. **Relaxes the CLAUDE.md "`@invana/canvas` has no `@invana` deps; owns pixi" invariant → "…except `@invana/canvas-state`."** |
| C2 | **The state layer is renderer-agnostic.** pixi is one *adapter*. Nothing in `@invana/canvas-state` references a drawing lib; camera is an **abstract transform**, not a `pixi-viewport` handle — a future non-pixi renderer projects the same fields. |
| C3 | **One `CanvasState { view, data }` — not three branches.** `view` (`CanvasView`) = how the visualisation is defined + viewed. `data` (`CanvasData`) = the graph itself (`CanvasGraph`). **Position is a node field inside `data`, not a top-level compartment** — splitting it out would model a *storage* choice as a *domain* one. |
| C4 | **Renderer = pure projection of `CanvasState`** (unidirectional; `store-owns-state-plan.md` §0). The renderer re-renders on state updates at **every scale**: fine-grained reactive updates for `view`/structure, and a **batched, frame-coalesced typed-array flush** for machine-rate position churn — so the reactive store never sees per-frame float storms. The typed-array fast path is an **internal detail of `data`**, not a second source of truth. |
| C5 | **Program against `ReactiveStore<T>`, not zustand.** zustand is one adapter (`createConfigStore.ts`), the *only* file importing it (lint-enforced). Backend stays swappable (valtio / nanostores / Yjs-backed). |
| C6 | **Writes are declarative patches: `update(patch, action?)`.** No imperative mutators, no exposed immer drafts. The named `action` is threaded from day one (no-op today) — it powers OTel spans + CRDT history later. |
| C7 | **Telemetry is a port *decorator* (`withTelemetry`), not zustand middleware** — transfers across the backend swap; scoped to the `view` store, never the bulk data hot path. |

## The data model

```ts
// @invana/canvas-state — renderer-agnostic; imports no drawing library (C2)

/** One per Canvas — the single source of truth. The renderer is a pure
 *  projection of it (C4). A façade over two members with different physics. */
interface CanvasState {
  view: CanvasView;   // how it's defined + viewed   → reactive store (immer · observable · syncable)
  data: CanvasData;   // THE graph (CanvasGraph)      → structure + position + annotations
}
```

### `view` — the reactive store (`CanvasView`)

Everything an **editor** changes and a **viewer** needs to know *how to draw*.
Small, human-rate, serialisable → held by `ReactiveStore<T>` (zustand today, Yjs
later).

```ts
interface CanvasView {
  // ── definition: "what the visualisation IS" — persisted, shared/converged ──
  definition: {
    layers:       Record<string, LayerOptions>;      // keyed by instance id (≈ CanvasConfig.layers)
    behaviours:   Record<string, BehaviourOptions>;
    layouts:      Record<string, LayoutOptions>;
    activeLayout: string | null;                     // one runs at a time
    templates:    NodeStructureTemplate[];           // designer-authored card templates
    theme:        ThemeState;                         // mode + family + accent
  };
  // ── interaction: "the live view onto it" — mostly ephemeral / per-user ──
  interaction: {
    selection: ReadonlySet<string>;
    hover:     string | null;                         // presence; per-user in collab
    states:    Record<string, ReadonlySet<string>>;   // highlighted / context-open visual sets
    camera:    { x: number; y: number; zoom: number };// ABSTRACT transform (C2), throttled/ephemeral
    viewMode:  'select' | 'draw' | 'annotate' | string;
  };
}
```

`definition` → persisted + converged (CRDT doc later). `interaction` → throttled,
last-write-wins, **not** persisted (camera/hover are per-user awareness).

### `data` — the graph (`CanvasData` = `CanvasGraph`)

The thing being visualised. A node **has** a position — it's a node field, like
its label or payload (C3). Domain-agnostic container; the graph domain shape:

```ts
interface CanvasData {
  nodes:       Record<string, NodeRecord>;   // each node carries its position
  edges:       Record<string, EdgeRecord>;
  annotations: Annotation[];                 // small, authored
  query:       { refs: QueryRef[]; intents: IntentLogEntry[]; status: 'idle' | 'loading' | 'streaming' };
}

interface NodeRecord {
  id: string;
  x: number; y: number;        // POSITION IS A NODE FIELD — not a top-level branch (C3)
  payload: unknown;            // opaque domain data
  states: string[];            // data-driven active states
}
```

**Storage is an internal detail of `data` (C4), invisible at the API:**

- **Small / structural** changes (add/remove node, edit annotation, `status`) ride a
  **coarse flush** + may mirror into the reactive branch (so counts / annotations /
  intents are observable).
- **Machine-rate** fields (`x`, `y`, bulk `payload`, render `stateFlags`) are stored
  in **typed-array columns** (`GraphStore` / `ColumnStore`) and delivered to the
  renderer via a **batched, frame-coalesced flush** with **targeted** per-node
  re-render — never the per-field reactive/immer/CRDT path (which clones 500k rows at
  5–50 ms vs ~10 ns for a typed-array write).
- **Positions are derived, not synced.** The layout computes them locally; in collab
  the doc syncs the *layout choice + config* (in `view`) and node/edge *structure*,
  **not** the float stream. Each client recomputes positions. This is exactly why
  position must be *excludable* from sync — easy as a node field on a non-synced data
  branch, awkward if forced through the reactive document.

So the unified model holds at every scale: **the renderer reacts to `CanvasState`;
the engine just routes position churn through a typed-array fast path so the
reactive store never sees it.**

## The port

```ts
// @invana/canvas-state/src/ReactiveStore.ts — library-agnostic contract
export interface ReactiveStore<T> {
  getState(): T;
  /** declarative patch + optional named action — setState today, a Yjs txn later */
  update(patch: DeepPartial<T>, action?: string): void;
  subscribe(listener: (state: T, prev: T) => void): () => void;
}
// + a select(store, selector, equality?) helper so selector semantics survive a backend swap.
```

`view` is the `ReactiveStore<CanvasView>` (fine-grained, selector subscriptions —
editors bind here); `data`'s bulk columns use the `GraphStore`/`ColumnStore` coarse
`flush`. Both are reached through the one `CanvasState` handle.

## Subscriber model — who reads / who writes

Unidirectional: **every change is a write to a store first; rendering is a pure
projection** (C4). A viewer is the only role that reads **both** members.

| Role | Reads | Writes | How |
|---|---|---|---|
| **Editors** (`canvas-ui`) | `view.definition.*` (own slice) | `view.definition.*` | `useStore(view, sel)` · `view.update(patch, action)` (draft+Apply) |
| **Behaviours** (producers) | both | `view.interaction.*`, `data` structure + `data.query.intents` | `view.update(...)`; `data` mutators |
| **Layouts** (producers) | `data` (structure) + `view.definition.layouts` | `data` node `x`/`y` (typed-array fast path) | batched column writes → frame flush |
| **Viewers / visualisers** (layers, minimap, renderer adapter) | **both** | nothing (pure subscribers) | `view.subscribe` (*how*) + `data.on('flush')` (*what + where*) |
| **Scene tree / Inspector** (`canvas-designer`) | `view.definition` + `view.interaction.selection` | `view.interaction.selection`, `view.definition.*.enabled` | `useStore` + `update` |

```
         EDITORS ─┐                          ┌─ VIEWERS / VISUALISERS
   (write defn)   │   update(patch, action)  │   (subscribe → project → screen)
                  ▼                           ▲
            ┌─────────────────────────────────────┐
  BEHAVIOURS│  view   (ReactiveStore<CanvasView>) │  ← zustand now · Yjs later · withTelemetry decorator
 (interaction└─────────────────────────────────────┘
  + intents)        │ reads positions            ▲ writes x,y (typed-array fast path)
                    ▼                            │
            ┌─────────────────────────────────────┐
   LAYOUTS →│  data   (CanvasGraph; ColumnStore)  │  ← node fields; bulk x,y in typed arrays
            │         structure · annotations     │     coarse flush · NOT the reactive path
            └─────────────────────────────────────┘
```

## Collaboration & telemetry — how they attach

All three targets hang off the **one write seam** `view.update(patch, action?)`:

```ts
view.update({ layouts: { force: { charge: -200 } } }, 'force.charge');
// today        → store.setState(deepMerge(state, patch))      (zustand adapter)
// + telemetry  → sink.span(action, { diff: patch, ts })       (decorator, always)
// collab later → ydoc.transact(() => applyPatch(ymap, patch)) (Yjs adapter)
```

- **Telemetry decorator** — `withTelemetry(store, sink)` wraps any `ReactiveStore`,
  emits one OTel span/event per `update` with the diff + action label. Works
  identically over zustand or Yjs (C7). Scoped to `view`, never the data hot path.
- **Yjs adapter** — `createYjsConfigStore(ydoc)` implements the same port. Editors/
  viewers unchanged. `materialize(doc)` is byte-identical on every client *and*
  `invana-backend` (CRDT convergence) → "FE + BE share the exact state."

### Three channels (different physics)

| State (this model) | Channel | Persisted | Synced how |
|---|---|---|---|
| `view.definition` | **Doc** (CRDT) | ✅ Postgres | Yjs binary deltas — converged |
| `view.interaction` (selection, hover, **camera**) | **Awareness** | ❌ | throttled, per-user, last-write-wins |
| `data` structure + `annotations` + `query.intents` | **Doc / intent log** | ✅ | structure refs + append-only commands → backend executes |
| `data` node `x`/`y` + bulk `payload` | **Data channel / local** | ✅ backend | positions **derived locally**; payloads stream (Arrow) → `ColumnStore`; **never** the CRDT |

**Hard invariant: definition + awareness sync; positions + bulk payloads don't.**

### Five seams M1 must bake in (so telemetry/Yjs are drop-ins)

1. **Patch-only writes** to `view` — no imperative engine mutation from editors.
2. **Named `action` labels** (C6) — threaded now, no-op today.
3. **`actor?` on interaction writes** — unused single-user; the seam that makes presence per-user later without a signature change.
4. **Strict member discipline** — `view.interaction` separable from `view.definition`; `data`'s position/bulk columns never enter the reactive store.
5. **`@invana/canvas-state` renderer-free + zero-`@invana`-deps** (C1) — so the Yjs adapter + OTel decorator add no pixi/graph into the sync layer.

## Milestones (each keeps `pnpm check-types` green)

### S1 — the reactive store + package ◀ build first

Per [reactive-state-store-plan.md](./reactive-state-store-plan.md) phases 1–3,
landed in ordered sub-steps:

1. **Package + port** — create `@invana/canvas-state` (renderer-free leaf, C1);
   `ReactiveStore.ts` (port + `select()`); `createConfigStore.ts` (zustand adapter,
   only zustand importer); a **`Map`-backed test adapter** proving the swap.
2. **Back `Canvas.config`** — replace the plain object (`Canvas.ts:120`) as the
   `view.definition` store; `update()` writes a patch + still fans to `setOptions`
   + emits `options:change` (back-compat). **Load-bearing edit; `Canvas.ts` is
   no-test (rule 10) — stay behaviourally identical** (`options:change` payload,
   `_activate` ordering, late-layer catch-up at `Canvas.ts:184`).
3. **`useStore(store, selector)`** (`canvas-react`) via `useSyncExternalStore`;
   retire the copy-based `useGraphCanvasOptions`.
4. **Fold interaction state** into `view.interaction` — selection/hover (this is
   [store-owns-state-plan.md](./store-owns-state-plan.md); §2.1/2.2 done, selection
   set is its D4). Adds the `actor?` seam.
5. **Fold camera** — abstract `{x,y,zoom}` in `view.interaction.camera`;
   `pixi-viewport` becomes a *projector* of it; throttled/ephemeral writes (C2).
   `data` positions are untouched — they stay the typed-array fast path (C4).
6. **Lint guard** — `import … from 'zustand'` only in the adapter + `Store.ts`.

### S2 — telemetry ([collaborative-state-plan.md](./collaborative-state-plan.md) Phase A)

`withTelemetry(store, sink)` decorator; one span/event per `update(patch, action)`
with the diff; pluggable OTel sink. Promote `GraphStore.events` / behaviour emitters
to the tap (store-owns-state §6).

### S3 — collaboration (collaborative-state-plan Phase F)

Yjs adapter behind the port + **Awareness** channel (presence cursors / selection /
camera). PG snapshots + Redis fan-out; `invana-backend` as a doc peer; the
intent-log commands flow. Positions + bulk payloads stream on the separate data
channel, never the CRDT.

## Open questions

1. **`data` observability split** — which of `data` mirrors into the reactive branch
   (annotations, counts, `query` status — observable) vs stays coarse-flush only
   (structure)? *Lean: mirror the small/authored bits; structure + positions stay
   typed-array.*
2. **Interaction ownership** (S1.4) — `view` owns selection vs mirrors `GraphStore`
   presence. *Lean: own it.*
3. **`ColumnStore`/`GraphStore` placement** — physically move into
   `@invana/canvas-state`, or stay in `canvas`/`graph` and be *coordinated* by it?
4. **Selector/equality port surface** — keep `select(store, sel, eq?)` minimal,
   `Object.is` default.
5. **Collab backend** — Yjs/Automerge CRDT vs a Postgres sync engine
   (collaborative-state-plan open decision 3).

## Relationship to existing docs (this sequences them at the package level)

- [reactive-state-store-plan.md](./reactive-state-store-plan.md) — the port + adapter detail (**S1**).
- [store-owns-state-plan.md](./store-owns-state-plan.md) — interaction-state ownership (**S1.4**) + telemetry tap wiring (**S2**).
- [unified-canvas-options-plan.md](./unified-canvas-options-plan.md) — the config model **S1.2** re-backs as `view.definition`.
- [collaborative-state-plan.md](./collaborative-state-plan.md) — **S2/S3** detail (phases A–F), state-vs-data invariant, presence/idle, intent log.
</content>
