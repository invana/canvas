# Per-element visibility (hide/show) plan

**Status:** implemented (design-of-record). Goal: a first-class **hidden/visible** concept for individual
graph nodes and edges — single + bulk (batched) — that the renderer, hit-test,
bounds/camera, layout, labels/LOD, and minimap **all honor**, plus events and
serialization. Round out whole-layer `ILayer.visible` with an event + setter.
Backward compatible.

Related: [`store-owns-state-plan.md`](./store-owns-state-plan.md) (GraphStore as
state owner), [`graph-canvas-operations.md`](./graph-canvas-operations.md)
(graph verbs — `isolate`/`focus` will compose on this), [`event-taxonomy.md`](./event-taxonomy.md)
(bus naming), [`canvas-engine-types.md`](./canvas-engine-types.md) (`ILayer` /
`CanvasGlobalEvents`).

---

## 1. Motivation

`GraphStore` and `GraphLayer` expose **whole-layer** visibility only
(`ILayer.visible`) plus runtime **states** (`setNodeState`/`setEdgeState`;
canonical set `hovered · selected · highlighted · dimmed · disabled`). There is
**no per-element hide.** Consumers that want to hide one node/edge today register
a fake `hidden` style-state that drives `alpha → 0` — which:

- does **not** remove the element from **hit-testing** (invisible but still
  clickable — a real bug),
- does **not** remove it from **bounds / `fitContent`**, **layout**, or the
  **minimap**,
- forces every consumer to **hand-roll the incident-edge cascade** (hide a node ⇒
  hide its edges),
- is fragile: a data-feed update that replaces `states[]` silently un-hides it.

We want **real, first-class visibility** — culled from the GPU batch, skipped by
hit-test, excluded from bounds/layout — owned by the store so the subtle
effective-visibility rule lives in exactly one place.

## 2. Decisions (design review, 2026-07-11)

1. **`hidden` is a first-class explicit flag, a sibling of `pinned`** — not a
   style-state. It lives as a **bit in the typed-array `flags` column** (like
   `pinned`), not in cold storage, on **both** nodes and edges.
2. **Delivered all at once** — one branch/PR covering store → layer → renderer →
   hit-test → bounds/camera → layouts → labels/minimap → selection/clipboard →
   layer visibility → serialization → tests.
3. **Derived-only incident-edge cascade.** Hiding a node makes its incident edges
   *effectively* hidden **without** marking them explicitly hidden and **without**
   emitting per-edge events. Only **explicit** changes emit
   `edge:visibility`; consumers derive incident state via `isEdgeVisible()` and
   react to `node:visibility`. Avoids O(E) event storms and matches "hiding a
   node visually removes its incident edges without marking them explicitly
   hidden."
4. **API + events + serialization only, no UI now.** This extends the
   store/layer — it is **not** a new Behaviour/Layer/Layout, so root-rule 12's
   mandatory `canvas-ui` editor does not apply. A layers/visibility panel is a
   separate follow-up.
5. **Naming defaults:**
   - Event shape: a single `node:visibility { id, hidden }` /
     `edge:visibility { id, hidden }` (not a `shown`/`hidden` pair).
   - Whole-layer event: `scene:layer:visibilitychange { id, visible }` — follows
     the existing `scene:layer:add` / `scene:layer:remove` bus convention (the
     brief wrote `layer:visibilitychange`; we conform to the `scene:layer:*`
     namespace already on `CanvasGlobalEvents`).
6. **Layout excludes hidden by default.** `includeHidden?: boolean` (default
   `false`) on the layout options; excluded nodes keep **frozen** (untouched)
   positions. **Showing does not re-run layout** — a re-shown node reappears at
   its last frozen position; re-layout stays an explicit user/app action.
7. **Clipboard skips hidden** on copy/cut. Hiding **clears all runtime states**
   (selection, hover, highlight) so a re-shown element returns clean and no
   ghost state points at an invisible element.
8. **Tests land in `packages/graph` only.** Root-rule 10 forbids test files in
   `packages/canvas`, so `Layer.setVisible` ships untested there; the store +
   layer behaviour is fully covered from `packages/graph`.
9. **No `parentId` cascade.** Hiding a node hides **only that node** (its incident
   edges derive as effectively hidden); descendants stay visible. Subtree hiding
   remains the separate group-collapse concern.
10. **Topology queries stay visibility-blind.** `neighbors` / `degree` /
    adjacency / `nodes()` / `edges()` report **true graph topology** and ignore
    hidden — only the visual / selection / bounds / layout layers filter by
    visibility (via `isNodeVisible` / `includeHidden`). Data and presentation
    stay cleanly separated.
11. **Hiding a whole layer also suppresses hit-test + bounds** for its elements —
    the layer-level analog of the per-element cull; no invisible-but-clickable at
    layer granularity (§8).

## 3. Effective-visibility rule (owned by the store)

The single subtle definition consumers keep re-implementing — own it once:

- A **node** is **effectively hidden** iff it is **explicitly hidden**. (No
  `parentId` cascade — a hidden parent does not hide its descendants; decision 9.)
- An **edge** is **effectively hidden** iff it is **explicitly hidden** *or*
  **either endpoint is effectively hidden**. (So hiding a node visually removes
  its incident edges without marking them explicitly hidden.)
- **Showing a node** re-shows an incident edge **only if** that edge is not
  explicitly hidden **and** its other endpoint is visible.

This rule governs **rendering/interaction only**. It does **not** alter
`GraphStore` topology queries (`neighbors` / `degree` / `nodes()` / `edges()`),
which stay visibility-blind (decision 10).

`isNodeVisible` / `isEdgeVisible` compute this; `isNodeHidden` / `isEdgeHidden`
return the **explicit** flag (O(1) via the flags column). Edge effective
visibility is computed lazily (O(1): explicit bit + two `isNodeHidden` endpoint
checks) — no derived "effectively hidden edge" set to keep in sync.

## 4. Data model — `GraphStore` (`packages/graph`)

`GraphNode`/`GraphEdge` live in `store/types.ts`. `pinned` is stored as
`FLAG_PINNED = 1 << 0` in the `flags` u8 column; `FLAG_TOMBSTONE = 1 << 1` is
taken — so:

```ts
const FLAG_PINNED    = 1 << 0;
const FLAG_TOMBSTONE = 1 << 1;
const FLAG_HIDDEN    = 1 << 2;   // NEW — node flags column and edge flags column
```

- **Types** (`store/types.ts`): add `hidden?: boolean` to `GraphNode` and
  `GraphEdge` (sibling of `pinned`). Accepted on `addNode`/`addEdge`/
  `updateNode`/`updateEdge`.
- **Storage**: mirror the `pinned` mechanics exactly —
  - `installNode` / `installEdge`: seed `flags` with `node.hidden ? FLAG_HIDDEN : 0`.
  - `getNode` / `getEdge`: reconstruct `hidden` from the flag on read.
  - `updateNode` / `updateEdge`: flip the bit when `'hidden' in patch`.
  - `compact`: strip on rebuild like the tombstone/pinned handling.
- **Explicit-hidden indexes**: a `Set<string>` of explicitly-hidden node ids and
  a `Set<string>` for edges, kept in step with the flag, for O(1)
  `hiddenNodeCount()` / cheap `hiddenNodes()` iteration. (Edges already have a
  `flags` column carrying only `FLAG_TOMBSTONE` today — `FLAG_HIDDEN` slots in.)

## 5. Store API (source of truth, batched)

Mirror the full set for **nodes and edges**. Single ops are usable inside a
caller's `store.batch()`; bulk ops **wrap themselves in one `store.batch()`** →
one flush → one paint.

```ts
// single — nodes (mirror for edges)
hideNode(id): void
showNode(id): void
setNodeHidden(id, hidden): void
toggleNodeHidden(id): boolean        // returns new state
isNodeHidden(id): boolean            // explicit flag, O(1)
isNodeVisible(id): boolean           // effective visibility

// bulk — one batch → one flush
hideNodes(ids: Iterable<string>): void
showNodes(ids: Iterable<string>): void
setNodesHidden(ids: Iterable<string>, hidden: boolean): void

// iteration / counts (e.g. a layers panel)
hiddenNodes(): IterableIterator<string>
hiddenNodeCount(): number

// convenience
showAllHidden(): void                          // clear every explicit hidden flag (nodes + edges)
hideNodesByPredicate(fn: (n: GraphNode) => boolean): void
```

Edge mirror: `hideEdge` / `showEdge` / `setEdgeHidden` / `toggleEdgeHidden` /
`isEdgeHidden` / `isEdgeVisible` / `hideEdges` / `showEdges` / `setEdgesHidden` /
`hiddenEdges` / `hiddenEdgeCount`.

Each mutation bumps `store.version` and enqueues a visibility event (§9),
coalesced per flush like existing add/remove.

## 6. `GraphLayer` convenience (`packages/graph`)

Expose the same `hide*/show*/toggle*/isHidden/isVisible` on `GraphLayer`,
delegating to the store, so callers who already hold the layer (they call
`layer.focusNode`/`focusNodes`/`focusEdges`) don't reach into the store.

The **node hide/show path on the layer applies the endpoint cascade** to
incident edges — i.e. it triggers a re-render of the node's incident edges so
newly effectively-hidden edges are culled (and re-shown edges re-installed). No
per-edge events are emitted (decision 3); the cascade is a render concern.

## 7. Rendering & interaction integration

Effectively-hidden elements are **culled** (removed from the GPU batch — *not*
`alpha 0`), and excluded from hit-test / bounds / layout / labels / minimap.
Concrete integration points from the code survey:

### 7.1 Render — `GraphLayer` (`layer/GraphLayer.ts`)
The renderer already honors a hard `visible: false` (used by collapsed-group
culling at `nodeSpec` ~L1158). Reuse it:
- `nodeSpec` (~L1041–1160, `visible: !hiddenByGroup` L1158): AND in
  `!store.isNodeHidden(id)`.
- `edgeSpec` (~L1168–1242, `visible` L1230): AND in `store.isEdgeVisible(id)`
  (explicit + endpoint effective).
- `installNodeShape` / `installEdgeConnector` (~L1323/1332): skip install when
  effectively hidden.
- `rerenderNode` / `rerenderEdge` (~L1256/1300) and `updateNodeShape` (~L1638):
  a `hidden` patch triggers a full re-render (install/remove) rather than a
  position fast-path.
- `redraw` (~L640): skip hidden.
- `effectiveEndpoint` / `collapsedAncestor` (~L1770–1789): the cascade re-renders
  incident edges when a node's visibility flips.

### 7.2 Hit-test — `PrimitivesRenderer` / `HitIndex` (`packages/canvas`)
- `PrimitivesRenderer.hitTest` (~L1583–1626): on hide, culled shapes/connectors
  never enter the batch, so they're already absent — but for elements hidden
  without removal we **`HitIndex.remove(id)`** (`hit/HitIndex.ts` L53) so rbush
  stops returning them. Show re-inserts on re-install. This fixes
  invisible-but-clickable.

### 7.3 Bounds & camera — `GraphLayer`
- `boundsOfNode` (~L954), `directChildrenWorldBounds` (~L1848), `focusNodes`
  (~L973), `focusNode` (~L995), `focusEdges` (~L1011): exclude hidden by default;
  add opt-in `{ includeHidden?: boolean }`. `camera.fitContent` flows through the
  same bounds aggregation.

### 7.4 Layout — the 5 layout packages
Every layout snapshots `layer.store.nodes()` wholesale
(`OneShotPositionLayout` + geometric / elkjs / d3-hierarchy / d3-sankey; d3-force
`snapshotStatic`). Add `includeHidden?: boolean` (default `false`) to the layout
options; filter the node/edge snapshot; leave excluded nodes' positions
**frozen** (untouched). So hidden nodes don't perturb force sims or one-shot
placement.

### 7.5 Labels / LOD, minimap
- `LabelCollisionBehaviour.runPass` (`behaviours/LabelCollisionBehaviour.ts`
  ~L224/239): `continue` on hidden node/edge.
- `LabelResolutionLODBehaviour`: operates at renderer level — hidden already
  invisible; no change needed.
- `MiniMapLayer` (`layer/MiniMapLayer.ts`): `paintWorld` node/edge loops (~L410)
  and `nodeBounds` (~L562) skip hidden. Also subscribe to whole-layer
  visibility (§8) to repaint.

### 7.6 Selection / clipboard
- `ClickSelectBehaviour.selectAll` (~L471) / `expandSeeds` (~L579),
  `BrushSelectBehaviour.endBrush` (~L460), `LassoSelectBehaviour`: skip hidden.
- Hiding an element **clears all its runtime states** — selection, hover,
  highlight (decision 7) — so nothing stale points at an invisible element and a
  re-shown element returns clean. Implemented in the store on the hide path
  (removes the element from every `nodeRuntimeStates` / `edgeRuntimeStates` set).
- Copy/cut **skip** hidden.

## 8. Whole-layer visibility (round it out)

`ILayer.visible` exists on the `Layer` base (`packages/canvas/src/layers/Layer.ts`
L90–108, `onVisibleChange` hook L223) and the render tick already skips invisible
layers (`engine/Canvas.ts` ~L402). Missing: a setter that repaints + emits.

- Add `Layer.setVisible(visible: boolean): void` — sets `visible`, repaints, and
  emits `scene:layer:visibilitychange { id, visible }` on the canvas bus via the
  `LayerRegistry`.
- Extend `CanvasGlobalEvents` (`packages/canvas-store/src/events/CanvasEventBus.ts`)
  with `'scene:layer:visibilitychange': { id: string; visible: boolean }`.
- `LayerRegistry` (`registries/LayerRegistry.ts`) grows a `setVisible(id, visible)`
  that mutates the layer and emits the event.
- Dependent layers react: `MiniMapLayer` subscribes to
  `scene:layer:visibilitychange` for its source graph layer → `repaint()`. The
  render loop already reacts (tick skips invisible layers).
- **Hit-test + bounds also honor a hidden layer** (decision 11). Today the tick
  only skips *drawing*, so a hidden layer's shapes remain in the shared rbush hit
  index and bounds aggregation — the layer-level invisible-but-clickable bug.
  `PrimitivesRenderer.hitTest` and the bounds/`fitContent` aggregation gain an
  owning-layer visibility check (the renderer already tracks which layer owns each
  shape/connector; skip candidates whose owning layer is not visible). This is the
  whole-layer analog of the per-element cull.

## 9. Events

On `GraphStore.events` (extend `GraphStoreEventMap` in `store/types.ts`):

```ts
'node:visibility': { id: string; hidden: boolean };
'edge:visibility': { id: string; hidden: boolean };
```

- Emitted only for **explicit** flag changes (decision 3). Incident-edge cascade
  emits nothing — consumers derive via `isEdgeVisible` and react to
  `node:visibility`.
- Coalesced per flush like existing add/remove; bulk ops fire one flush.
- Included in the **`DataSource` flush / `LayerFlush` delta** projection so
  `canvas-store` consumers see it; `store.version` bumps.
- Whole-layer: `scene:layer:visibilitychange` on the canvas bus (§8).

## 10. Consuming: a hidden-elements panel (userland)

A common consumer is a **layers/eye-toggle panel** listing currently-hidden
elements and letting the user restore them. The API is designed to serve this
directly — no engine UI is added (decision 4); the panel is built in userland
against the store. Three ingredients:

1. **Read the set** — `store.hiddenNodes()` / `store.hiddenEdges()` iterators and
   `store.hiddenNodeCount()` / `store.hiddenEdgeCount()`.
2. **Subscribe** — `store.events.on('node:visibility' | 'edge:visibility', …)`
   (coalesced per flush; `store.version` bumps). Also listen to `flush` so a
   hidden-then-deleted element drops off the list.
3. **Restore on click** — `store.showNode(id)` / `store.showEdge(id)` /
   `store.toggleNodeHidden(id)` (or the `GraphLayer` wrappers). Showing
   re-renders the canvas automatically via §7 — no manual redraw.

React sketch (subscribe with `useSyncExternalStore` keyed on `store.version`):

```tsx
function useHiddenElements(store) {
  useSyncExternalStore(
    (cb) => {
      const offs = [
        store.events.on('node:visibility', cb),
        store.events.on('edge:visibility', cb),
        store.events.on('flush', cb),           // delete-while-hidden
      ];
      return () => offs.forEach((o) => o());
    },
    () => store.version,
  );
  return { nodes: [...store.hiddenNodes()], edges: [...store.hiddenEdges()] };
}
// row onClick={() => store.showNode(id)}  → element reappears on canvas
```

**Explicit vs effective — which the panel lists.** Because of the derived-only
cascade (decision 3), `hiddenNodes()`/`hiddenEdges()` and the `visibility` events
report **only explicitly-hidden** elements. An edge invisible *only* because an
endpoint is hidden is **not** in `hiddenEdges()` and fires **no** `edge:visibility`
event. This is the correct data source for a restore panel: cascaded edges aren't
independently un-hideable (showing them requires showing the endpoint), so a
"show" button on them would mislead. The panel lists what the user can act on —
the explicit set. If a consumer genuinely wants "everything not drawn" (explicit +
cascaded), that's a distinct query: iterate with `isNodeVisible`/`isEdgeVisible`
and also refresh on `node:visibility` (a node hide changes edge *effective*
visibility).

## 11. Serialization

`GraphLayer.exportData()` already emits `{ nodes: [...store.nodes()], edges:
[...store.edges()] }` and `importData()` reloads — so once `hidden` is a
reconstructed field on `GraphNode`/`GraphEdge` (§4), the explicit hidden sets
**round-trip automatically** through `exportCanvasState` / `importCanvasState`
(`packages/canvas/src/export/stateExport.ts`). Verify `getNode`/`getEdge` include
`hidden` so the snapshot carries it.

Per-layer `visible` round-trips via `serializeDefinition` (add `visible` to the
`GraphLayer` definition slice if not already carried) so a saved canvas restores
hidden layers too.

## 12. Back-compat, tests, docs

- **No breakage** to `setNodeState`/`setEdgeState` or the canonical states. The
  fake-`hidden`-state pattern is **deprecated in docs** in favor of the new API.
- **Tests (`packages/graph`)**: hide/show single + bulk; incident-edge cascade
  (hide node hides its edges; showing one endpoint keeps a shared edge hidden
  while the other endpoint is hidden; explicitly-hidden edge stays hidden when
  endpoints show); hit-test excludes hidden; bounds/`fitContent` excludes hidden;
  batching fires one flush; serialization round-trips.
- **Docs**: TSDoc on all new public methods/types; deprecation note on the
  fake-hidden-state pattern; changelog entry per repo convention (git-cliff /
  conventional commits — no `.changeset` dir in this repo).

## 13. Implementation order (one PR)

1. **Store data model** — `hidden` field, `FLAG_HIDDEN`, explicit-hidden indexes,
   add/update acceptance, `get*` reconstruction, `compact`.
2. **Store API** — node + edge single/bulk/toggle/is-hidden/is-visible/iterators/
   counts, `showAllHidden`, `hideNodesByPredicate`; effective-visibility rule;
   `node:visibility`/`edge:visibility` events + version bump + flush delta.
3. **`GraphLayer` wrappers** + incident-edge cascade.
4. **Render culling** (`nodeSpec`/`edgeSpec`/install/rerender/update/redraw).
5. **Hit-test** (`HitIndex.remove` on hide; `PrimitivesRenderer.hitTest`).
6. **Bounds/camera** (`boundsOfNode`/`focus*`/`fitContent` + `includeHidden`).
7. **Layouts** — `includeHidden` (default false), frozen positions, across the 5
   packages.
8. **Labels/LOD + minimap + selection/clipboard**.
9. **`Layer.setVisible` + `scene:layer:visibilitychange`** + `LayerRegistry` +
   minimap subscription.
10. **Serialization** verification + per-layer `visible`.
11. **Tests + TSDoc + changelog**.

## 14. Risks / open

- **`includeHidden` on bounds/camera** — decide per call site whether the opt-in
  is worth exposing (yes for `focus*` / `fitContent`; internal aggregations can
  stay default-exclude).
- **Cascade re-render cost** — hiding a high-degree node re-renders all incident
  edges; acceptable (bounded by degree, coalesced per flush).
- **Layout frozen positions** — a node hidden then shown keeps its last position;
  confirm this is the desired UX vs re-laying-out on show (default: keep frozen,
  re-layout is an explicit user action).
- **Edge `flags` column growth** — edges gain `FLAG_HIDDEN`; the column already
  exists (tombstone), so no new allocation.
