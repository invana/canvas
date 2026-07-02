# Collaborative State & Realtime Sync — Design Note

> **Status: DESIGN / ROADMAP — not shipped.** This is a forward-looking design note (sibling to
> `roadmap.md`, `unified-canvas-options-plan.md`, `store-owns-state-plan.md`). It captures how the
> Explorer canvas's *state* is managed today and how it grows into a near-realtime, multi-user,
> offline-capable collaboration system where the **frontend and `invana-backend` share the exact
> state of a user's analysis**. Nothing here is a guarantee about current exports.

## Why

Per `roadmap.md`, Invana Canvas is a **high-performance data investigation toolkit for your graphs**, not a viz library: behaviours,
layers, and layouts must be **editable live** — their options *are* the editable **state of the
visualisation**. The endgame is multi-user, real-time **+** offline collaboration, with full
observability (OTel) over how an analysis evolves.

## The load-bearing distinction: state vs. data

Everything below hinges on **not** putting bulk graph data into the sync/collaboration fabric.

| | **State** (sync this) | **Data** (never sync this) |
|---|---|---|
| Contents | config (layouts/layers/behaviours opts + `activeLayout`), node/edge templates, annotations, query refs, layout choice | live positions, pinned flags, streaming node/edge payloads |
| Size / rate | small, human-rate | millions of items, machine-rate |
| Home | `Canvas` config store → (future) CRDT doc | `GraphStore` / `ColumnStore` (typed arrays) |
| Observable / OTel? | yes — the point | no — version-bumped, render-only |

Rationale: immer/Map or a CRDT cloning 500k entries per mutation costs 5–50 ms; typed-array column
writes are ~10 ns. So data lives in `ColumnStore`; only the small authored state is synced.

## Four-layer state model

1. **Document** — CRDT, **persisted**, FE+BE: config + templates + annotations + query ref.
2. **Awareness / presence** — **ephemeral**, synced, *not persisted*: live cursors, selection,
   viewport, and user **status: active/idle/away**. Never enters the document (would persist every
   cursor move and bloat offline history).
3. **Local / transient** — idle timers, hover, in-flight gestures. Never synced.
4. **Hot data** — positions/streaming in `ColumnStore`. Never synced; backend query results stream
   in one-way; positions are derived locally by the layout.

## What exists today (the single source of truth)

The config-state surface is **already shipped** in-engine:

- `Canvas.get(): CanvasConfig` / `Canvas.update(patch)` — serialisable, deep-merge, patch-by-id.
  `CanvasConfig = { layers, behaviours, layouts, activeLayout }` (`packages/canvas/src/engine/CanvasConfig.ts`).
- `Canvas.update()` emits one coarse **`options:change`** `{ changedLayerIds, changedBehaviourIds }`
  (`Canvas.ts`, typed in `CanvasEventBus.ts`).
- `GraphCanvas extends Canvas` inherits it (`packages/graph/src/canvas/GraphCanvas.ts`); auto-runs `activeLayout`.
- React: `useGraphCanvasUpdate()` / `useGraphCanvasOptions()` (`packages/canvas-react/src/hooks/`) — subscribe to `options:change`.
- Consumers already react (e.g. `MiniMapLayer` repaints on `options:change`).

So "one state surface used by `@invana/canvas` + `@invana/canvas-react`" already exists. Collaboration
**backs that in-memory config with a synced document** and projects doc changes through the existing
`canvas.update()` seam — the engine does not change.

## Target architecture — near-realtime pub/sub

```
   ┌─ Client A ─────────────┐        ┌─ Client B ─────────────┐
   │ Yjs doc + Awareness    │        │ Yjs doc + Awareness    │
   │   │ observe               │      │   │ observe               │
   │   ▼ canvas.update(patch)  │      │   ▼ canvas.update(patch)  │
   │ Engine (ColumnStore)      │      │ Engine (ColumnStore)      │
   └──────┬────────────────────┘      └──────┬────────────────────┘
          │ ws (binary CRDT deltas)           │ ws
          ▼                                   ▼
   ┌──────────── ws / sync gateway (N stateless instances) ───────────┐
   │  Yjs sync protocol (doc) + Awareness relay                       │
   └──────┬───────────────────────┬───────────────────────┬──────────┘
          │ pub/sub fan-out         │ presence TTL          │ snapshots
          ▼                         ▼                        ▼
   ┌──────────── Redis ────────────────┐          ┌──── Postgres ────┐
   │ streams (doc update log) + pubsub  │          │ doc snapshots     │
   │ TTL keys (online / idle)           │          │ annotations rows  │
   └───────────────┬────────────────────┘          └────────┬─────────┘
                   │ same doc, as a peer                     │ materialize
                   ▼                                         ▼
        ┌──────────── invana-backend ───────────────────────────────┐
        │ headless Yjs peer (observes the doc) → runs queries/tasks   │
        │ streams DATA back on a SEPARATE data channel (→ ColumnStore)│
        └──────────────────────────────────────────────────────────┘
```

**Roles:**
- **Postgres** = durable source of truth (doc snapshots, annotations).
- **Redis** = realtime pub/sub fan-out across stateless gateway instances (horizontal scale) **+**
  ephemeral presence via TTL keys (expiry = idle/away).
- **invana-backend** = a **first-class peer of the same document**, not a polled API.

**How FE & BE share the *exact* state:** both hold the same CRDT doc, so
`materialize(doc)` is byte-identical on client and backend (CRDT convergence guarantee). The backend
reacts live via `doc.on('update', …)` or reads the latest snapshot from PG when cold. No drift.

## Three channels (different physics)

| Channel | Carries | Persisted | Transport |
|---|---|---|---|
| **Doc** | analysis state | ✅ PG | Yjs CRDT binary deltas |
| **Awareness** | cursors, selection, viewport, idle status | ❌ | Yjs Awareness / Redis TTL |
| **Data** | query results, streaming, positions | ✅ (backend) | separate binary stream (ideally Apache Arrow) → `ColumnStore` |

## Commands vs. state — driving an analysis collaboratively

Declarative state (current config) is doc fields. Imperative intents ("expand node X", "run pipeline
P") are an **append-only intent log inside the doc** (a Yjs array):

```jsonc
{ id: "op_8f3", by: "user:ravi", t: 1719…, kind: "expand",
  args: { nodeId: "n42", depth: 1 }, status: "pending" }
```

Flow: client appends intent → backend peer sees it → runs the query → **streams result nodes on the
data channel** (not the doc) → flips `status:"done"`. Benefits: every collaborator watches the intent
resolve in realtime; it is the **OTel/analytics trail**; and it is an **offline queue** (intents added
offline replay on reconnect). The doc holds only the *reference* (`query Q @ version V`), never the bytes.

## Idle detection — one mechanism, three consumers

An activity tracker (debounced `pointermove` / `pointerdown` / `wheel` / `keydown` / drag + the Page
Visibility API; this is *user-idle*, **not** `requestIdleCallback`). After N min of no cursor movement
→ `idle`, feeding: (a) publish `status:'idle'` to Awareness (peers grey the cursor); (b) emit an
idle/active transition as an **OTel event** ("active exploration time" analytics); (c) pause the force
sim / drop rAF while idle.

## Persistence & transport options

Durable truth in **Postgres**; **Redis** for realtime fan-out + ephemeral presence. Browser never
touches PG/Redis directly — through `invana-backend` over websocket. Two wirings:

- **(A) CRDT persisted into the DB — recommended for offline.** Yjs persisted via **`y-redis`**
  (Redis streams/pubsub + PG/S3 snapshots) or **Hocuspocus** (PG persistence + Redis multi-instance).
  Keeps clean offline-merge; DB is persistence.
- **(B) Postgres-native sync engine — DB *is* the model.** **ElectricSQL / Zero / PowerSync /
  Supabase Realtime** — realtime push, queryable rows, weaker offline-merge than a CRDT.

Redis alone is not the durable store (pair with PG).

## Why it's near-realtime (latency budget)

- **Optimistic local apply** → the acting user perceives 0 ms; sync is for *others*.
- **Binary CRDT deltas** → a slider change is tens of bytes, not a JSON doc.
- **Redis pub/sub** → in-memory fan-out, sub-ms server-side (~10–40 ms peer-perceived).
- **Debounced persistence** → PG writes batched, off the realtime path.
- **Throttled awareness** → cursors ~30–60 ms; idle cuts the rate to ~0.
- **Data stays out** → the sync fabric never blocks on big payloads.

## Observability (OTel)

The doc update stream and the intent log feed one pluggable OTel sink (keep the engine OTel-agnostic;
the app wires the exporter — mirrors the telemetry-middleware intent in `Store.ts` / proposal §6 Q10).
FE and BE emit the *same* spans because they observe the *same* ops. The CRDT op-log doubles as the
audit/analytics history.

## Prior art

Hot data → columnar/typed arrays everywhere (sigma+graphology, cytoscape `cy.batch()`, deck.gl GPU
attrs + Arrow, ECharts typed-array `SeriesData`, Graphistry/Perspective Arrow). Reactive store only
for small UI state at DOM scale — React Flow uses zustand (our scope). Borrow: **Apache Arrow** for
streaming import; graphology's model↔renderer split (≈ `GraphStore`↔`GraphLayer`).

## Roadmap phases

- **Phase A — OTel on state mutations.** Tap `options:change` → one span/event per `update()` with the
  diff; pluggable sink. Optionally thread named-action labels through `update()`.
- **Phase B — an editor for every Behaviour/Layer/Layout** (root rule 12) in `@invana/canvas-ui`,
  applied via `useGraphCanvasUpdate().update(...)`. Shell first (config-path → `FieldConfig[]`
  registry, reference editor `ThemeBehaviour`), then fan out hand-authored `@invana/forms` schemas.
- **Phase C — options → state rename** (wide, mechanical; coordinate across sessions).
- **Phase D — extend traced state to templates + document** for full save/load + OTel-over-everything.
- **Phase E — GPU-resident hot data** (scale path, benchmark-gated; *data* only, never the authored
  state; blocked by PixiJS buffer-sharing). Cheap win first: layout writes via the `silent`/bulk path
  + one memcpy upload.
- **Phase F — collaboration, presence & idle/analytics** (this note): Yjs doc + Awareness, PG+Redis,
  intent log, idle detection.

## Open decisions

1. **OTel granularity**: id-level diffs from `options:change` only, vs. named-action labels.
2. **OTel target**: spans (tracing) vs. structured events/metrics; which exporter.
3. **Collaboration backend**: CRDT (Yjs/Automerge) vs. sync engine over Postgres.
4. **Idle thresholds & states**: timeout (2–5 min); is `away` (tab hidden) distinct from `idle`?
5. **Document scope**: does the synced doc own templates + the node/edge document, or only config + refs?

## Hard invariant

**Doc + awareness sync; data + positions don't.** Keep that boundary and "frontend and backend know
the exact state of the user's analysis" is a *guarantee* (CRDT convergence), not best-effort.
