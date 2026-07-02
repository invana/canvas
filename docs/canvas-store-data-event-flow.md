# Canvas Store — Data Hierarchy, Data Flow & Event Flow

> **Status: DESIGN + AS-BUILT reference.** Companion to
> [`canvas-state-plan.md`](./canvas-state-plan.md). Shows the **shape** of
> `CanvasStore`, how a **data write** travels to the screen, and how every change
> is mirrored onto the **event bus**. Each section tags **✅ built** (matches the
> code in `packages/canvas-store/src`) vs **🔧 proposed** (decided in discussion,
> not yet code).
>
> Legend: `view` = reactive/small; `data` = typed-array/bulk; `events` = the bus.

---

## 0. The one-paragraph model

One `CanvasStore` per `Canvas`, holding **three siblings**: `view` (how it's
defined + viewed — reactive, small), `data` (what exists — bulk records, keyed by
**source** id, never reactive), and `events` (the bus + tap). The renderer is a
**pure projection**: `view` changes push targeted re-renders; `data` writes mark
dirty and emit **one coalesced flush per frame**; **both are mirrored onto
`events`** so a single tap sees the whole loop. A layer reads its **settings** from
`view` and its **data** from `data`, stitched into one `ctx.self` handle — it
*feels* owned, but the two halves live in two stores with two different physics.

---

## 1. Data hierarchy ✅ (built) + 🔧 (the `dataLayerId` pointer)

```
CanvasStore                                    ← one per Canvas
│
├── view : ReactiveStore<CanvasView>           ✅ reactive · immer · small · syncable
│   │
│   ├── definition          "what it IS" — persisted, converges (CRDT doc later)
│   │   ├── layers       : Record<layerId, LayerOptions>
│   │   │     └── e.g. "graph"   = { nodeRadius, color, dataLayerId: "graph" }   🔧 dataLayerId pointer
│   │   │         "minimap" = { scale,            dataLayerId: "graph" }   🔧 → shares one source
│   │   ├── behaviours   : Record<behaviourId, BehaviourOptions>   (enabled is explicit — rule 7)
│   │   ├── layouts      : Record<layoutId, LayoutOptions>
│   │   ├── activeLayout : layoutId | null
│   │   ├── templates    : NodeStructureTemplate[]
│   │   └── theme        : ThemeState
│   │
│   └── interaction         "the live view" — mostly ephemeral / per-user (Awareness later)
│       ├── selection : Set<id>          (D11 — the semantic set lives here)
│       ├── hover     : id | null
│       ├── states    : Record<stateName, Set<id>>   (highlighted / context-open / …)
│       ├── camera    : { x, y, zoom }   (ABSTRACT — renderer-agnostic, throttled)
│       └── viewMode  : 'select' | 'draw' | …
│
├── data : Record<sourceId, LayerData>          ✅ typed-array-bound · bulk · NEVER reactive
│   │                                              keyed by SOURCE id (many layers → one source)
│   └── "graph" : LayerData
│         ├── nodes       : Map<id, NodeRecord>      { id, x?, y?, …payload }   ← position is a node field
│         ├── edges       : Map<id, EdgeRecord>      { id, source, target, … }
│         ├── groups      : Map<id, GroupRecord>     { id, memberIds[], geometry? }   ← many-to-many
│         ├── annotations : Map<id, AnnotationRecord>{ id, kind, … }
│         └── (dirty sets + one coalesced `flush` per frame)
│
└── events : CanvasEventBus                       ✅ typed on/emit + publish + tap
      ├── on(type, fn)        typed global events
      ├── emit(type, payload) → typed listeners + tap
      ├── publish(type, …)    scoped/foreign events → tap only
      └── tap(fn, opts)       the whole stream (telemetry / collab)

  Accessors on the store:  layer(id) → LayerData (lazy)   ·   actions.* → named commands
```

### Why three siblings and not "data inside view.layers"

| Question | Answer |
|---|---|
| Why is `data` not nested under its layer? | **Two physics** — bulk data in the reactive store would make immer clone 50k records per layout tick. `view` stays small + reactive; `data` stays typed-array. |
| Why keyed by **source** id, not layer id? | **Many layers → one source.** `graph` + `minimap` both project `data["graph"]`; nesting would force the minimap to duplicate the nodes. |
| Then how does a layer "own" its data? | 🔧 `view.layers[id].dataLayerId` is a **pointer** (defaults to the layer's own id). The `ctx.self` facade (§4) stitches `settings` + `data` into one handle so it *reads* as owned. |

---

## 2. Data flow — write → trigger → flush → render

### 2.1 The three moves ✅ (`LayerData` / `DataStore`)

```
WRITE                          TRIGGER (deferred)            FLUSH (once)
─────                          ──────────────────            ────────────
data.addNode(n)   ─┐
data.addNode(n)    │ mark dirty   schedule() arms ONE        flush() drains dirty →
data.updateNode()  │ (added/      callback (the `scheduled`  ONE delta { added, changed,
data.applyPositions├─changed/      guard collapses N→1);     removed, moved, version }
   (bulk 50k)      │ removed/      DOES NOT emit yet          → every listener, once
   …               │ moved sets)
                  ─┘
        (silent, ~10ns/slot,                         (deferred until your code
         no notify, no immer)                         yields — see §2.3)
```

`moved` is split from `changed` so a position-only change updates a **transform
only** — no shape rebuild. That's the layout fast path.

### 2.2 The trigger — *when* flush fires ✅ (`FlushMode`)

`DataStore`/`LayerData` expose `setFlushMode(mode)` (default `'microtask'`); the
shared scheduler lives in `data/flush.ts`.

| Mode | Trigger | Use |
|---|---|---|
| `'frame'` | next `requestAnimationFrame` (microtask fallback where no rAF) | animated — force layout, drag (1 flush/frame regardless of write volume) |
| `'microtask'` | end of current JS tick | **kernel default** (no DOM assumption), tests, headless |
| `'manual'` | only `.flush()` | engine-driven (below), or exact-commit cases |

**Engine drives one clock** 🔧 — the renderer puts every store in `'manual'` and
pulls them from a single rAF loop, so the whole canvas commits on the same frame:

```ts
// @invana/canvas — one loop for the canvas
function frame() {
  for (const id in store.data) store.data[id].flush();   // pull all triggers, once/frame
  requestAnimationFrame(frame);
}
```

### 2.3 Why you never hand-write a trigger in a bulk update

JS is single-threaded: a microtask/rAF callback **cannot run while your function
is still running**. So a whole batch lands in one flush *automatically*:

```ts
for (const n of nodes) data.addNode(n);   // 50k writes — each arms the SAME deferred flush
// ── your code keeps running; flush has NOT fired ──
// → you yield → ONE flush with all 50k in the delta
```

You can't trigger mid-loop even if you tried. "Wait for all positions before
updating" is structurally guaranteed, not coordinated.

### 2.4 Who drains the flush (the render side) ✅

```
data["graph"].flush()  → delta { added:[…], moved:[…], removed:[…] }
   │
   ├─► GraphLayer(dataLayerId:"graph")  → create added · move moved (transform only) · dispose removed
   ├─► MiniMapLayer(dataLayerId:"graph")→ same delta, its own projection
   ├─► GroupLayer / TableLayer bound to "graph" → each projects the delta
   └─► activeLayout (on data change)    → derives x/y → applyPositions → 2nd flush → positions land
```

One data write → every projection of that source re-renders **only its delta**.
**React components do _not_ subscribe to bulk data** — the layer↔data path is
engine-internal; React reads `view` slices (+ small `data.meta` like counts).

---

## 3. Event flow — everything mirrored onto the bus ✅

The kernel **bridges** both stores onto `events`, so one `tap` reconstructs the
whole loop. (Wiring lives in `createCanvasStore`.)

```
        view.update(patch, action)                 data.addNode / applyPositions / …
                  │                                            │
   view.subscribeChanges(change)                     LayerData.flush() (per frame)
                  │                                            │
   ┌──────────────┴───────────────┐                           │
   │ emit 'state:change'          │                           │ emit 'data:flush'
   │   { action, changedPaths }   │                           │   { layerId, delta }
   │                              │                           │
   │ if action has ':' →          │                           │ (named writes also:
   │   publish '<domain>:<subj>:  │                           │  emit 'data:intent'
   │   <action>'  (granular,      │                           │  { action, layerId, ids })
   │   tap-only)                  │                           │
   └──────────────┬───────────────┘                           │
                  ▼                                            ▼
        ┌─────────────────────────────── CanvasEventBus ───────────────────────────────┐
        │  on(type,fn)  typed listeners      │      tap(fn)  the whole stream (envelope) │
        └───────────────────────────────────┴───────────────────────────────────────────┘
                  │                                            │
          engine / domain react                       telemetry · collaboration · audit
```

### 3.1 Event families (the map in `CanvasGlobalEvents`) ✅

| Family | Emitter | Examples | Purpose |
|---|---|---|---|
| **coarse / aggregate** | kernel | `state:change`, `data:flush`, `data:intent` | "something changed" + the bridge channels |
| **scene** | engine | `scene:layer:add`, `scene:behaviour:enable`, `scene:layout:add` | registry composition |
| **input** | engine | `input:node:click`, `input:node:hover`, `input:node:drag:start/end`, `input:background:contextmenu` | raw user input on elements — **behaviours consume these** |
| **layout** | engine | `layout:run:start/end/tick` | layout execution lifecycle |
| **render / canvas** | engine | `canvas:renderer:ready`, `render:loop:tick`, `canvas:message:show` | lifecycle |
| **granular `<domain>:<subject>:<action>`** | via `publish` | `view:layer:setStyle`, `data:node:add` | open-ended, **tap-only**, keyed by action label |

`emit` → typed listeners **and** tap. `publish` → **tap only** (scoped/foreign
events that aren't global-bus types). Every tap event is a structured envelope:
`{ type, timestamp, source: { kind, id }, payload }` — `kind` ∈ `canvas | layer |
behaviour | layout | store | data`.

### 3.2 The two channels carry the two physics

| | `view` change | `data` change |
|---|---|---|
| bus event | `state:change` (+ granular) | `data:flush` (+ `data:intent` for named writes) |
| granularity | **one per `update`** | **one per frame** (coalesced — never per node) |
| telemetry | `withTelemetry` (per update) | aggregate flush + intent log — **never per-element** |
| collab (later) | CRDT doc | data channel / never synced |

This is the load-bearing boundary: machine-rate data churn never produces
per-element bus traffic or per-element telemetry.

---

## 4. The `ctx.self` facade — where the loop meets a Layer/Behaviour/Layout 🔧

Every participant already receives a `CanvasContext` at `mount()`/`register()`
(✅ built — currently carries `events`, `camera`, `theme`, peer `layers`). Proposed
addition: the `store` + a scoped `self` handle.

```ts
interface CanvasContext {
  // …existing: events, camera, theme, layers, behaviours, world, stage…
  readonly store: CanvasStore;          // 🔧 whole kernel — deliberate cross-cutting access
  readonly self: {                      // 🔧 this participant's OWN slice (1:1, feels owned)
    readonly id: string;
    readonly settings: LayerOptions;    //  = view.definition.layers[id]      (reactive)
    readonly data: LayerData;           //  = store.layer(layers[id].dataLayerId) (bulk)
  };
}
```

```
   ctx.self          ← "the layer owns its settings + data"
   ┌──────┴───────┐
 self.settings   self.data
   │                │
 view.layers[id] ─dataLayerId─▶ data[sourceId]       cross-layer (rule 8): ctx.store.layer(otherId)
 (reactive)                      (bulk, shareable)    — explicit *LayerId option, never inferred
```

- **Layout** writes positions: `ctx.self.data.applyPositions(result)` → flush → render.
- **Behaviour** writes interaction: `ctx.store.view.update(s => { s.interaction.selection = … }, 'selection.set')` → `state:change`.
- **Layer** renders its delta: `ctx.self.data.on('flush', d => this.redraw(d))` + reads `ctx.self.settings`.

Convention over sandboxing: `self.*` + named `store.actions.*` for normal use;
raw `store` for the deliberate cross-layer reach.

---

## 5. End-to-end — one trip around the loop

```
 user clicks a node
   │  engine emits  input:node:click { layerId, id }            (events)
   ▼
 ClickSelectBehaviour (consumes input)
   │  ctx.store.view.update(s => s.interaction.selection = {id}, 'view:selection:set')
   ▼
 view (reactive) changes
   │  subscribeChanges → emit state:change + publish view:selection:set   (events: tap sees it)
   ▼
 GraphLayer (subscribed to that slice) → rerenderNode(id)  → highlight   (targeted, O(1))

 ── separately, data churn ──
 layout tick → ctx.self.data.applyPositions(50k)  → mark moved → schedule()
   │  next frame: flush → emit data:flush { layerId, delta:{ moved:[…] } }  (events)
   ▼
 GraphLayer + MiniMapLayer drain delta → update transforms only            (O(moved)/frame)
```

One tap on `events` sees all of it: `input:node:click` → `view:selection:set` /
`state:change` → `data:flush`. That single stream is what telemetry, collaboration,
and audit consume.

---

## 6. Status summary

| Piece | State |
|---|---|
| `CanvasStore { view, data, events, layer(), actions }` | ✅ built |
| `view` (definition + interaction), reactive port + zustand/memory adapters | ✅ built |
| `data` as `Record<id, LayerData>`, dirty-set + coalesced flush, `moved` split | ✅ built |
| `events` bus — typed `on`/`emit`, `publish`, `tap`; `state:change`/`data:flush`/`data:intent` bridges | ✅ built |
| Granular `<domain>:<subject>:<action>` via `publish` | ✅ built |
| `dataLayerId` pointer in `view.layers[id]` (defaults to own id) | 🔧 proposed (works today as a loose field; resolution is engine-side) |
| `FlushMode` (`frame`/`microtask`/`manual`) + `setFlushMode()` on `DataStore`/`LayerData` | ✅ built (kernel default `'microtask'`; `'frame'` falls back to microtask where no rAF) |
| engine single-rAF driver (flips stores to `'manual'`, drains all per frame) | 🔧 proposed (needs the engine to hold a `CanvasStore` — M0) |
| `ctx.store` + `ctx.self.{settings,data}` on `CanvasContext` | 🔧 proposed |
| Generic `DataStore<R>` in kernel; graph's `LayerData` → `@invana/graph` | 🔧 proposed (open) |
| Annotations as their own data source | 🔧 proposed (open) |

See [`canvas-state-plan.md`](./canvas-state-plan.md) §3–§9 for the rationale,
performance budgets, telemetry, and collaboration detail.
</content>
</invoke>
