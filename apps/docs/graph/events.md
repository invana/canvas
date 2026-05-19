# Graph events

::: warning Planned — in design
Names and payloads below are the target convention for `@invana/graph`. Not yet shipped.
:::

`@invana/graph` exposes two distinct event surfaces:

| Surface | Source | What it carries |
|---|---|---|
| `store.events` | `GraphStore` | **Data-level** mutations — node/edge added, updated, removed. Fine-grained, fires after each flush. |
| `graphLayer.events` | `GraphLayer` | **Interaction-level** events — pointer, drag, selection, plus aggregated `data:changed` summaries. |

Store events fire on every flush whether or not a layer is rendering them. Layer events fire only when the layer is mounted and the user interacts with it. Subscribe to whichever surface matches your concern — most application code subscribes to `graphLayer.events`; sync layers (server replication, analytics) subscribe to `store.events`.

Per the [engine events model](../guide/events.md), every event flowing through a layer's `events` also flows through the canvas tap channel wrapped in a `CanvasEvent` envelope.

---

## `store.events` — data-level

Fired by `GraphStore` after each flush (synchronous in `flushMode: 'sync'`, RAF-aligned in `flushMode: 'frame'`).

| Event | Payload |
|---|---|
| `node:add` | `{ nodeId }` |
| `node:update` | `{ nodeId, patch }` — `patch` is the `Partial<GraphNode>` that was applied |
| `node:remove` | `{ nodeId }` |
| `edge:add` | `{ edgeId }` |
| `edge:update` | `{ edgeId, patch }` |
| `edge:remove` | `{ edgeId }` |
| `edge:orphaned` | `{ edgeId }` — `unknownEndpoint: 'buffer'` exceeded `pendingEdgeTTL` |
| `flush` | `{ addedNodes, updatedNodes, removedNodes, addedEdges, updatedEdges, removedEdges }` — aggregate counts per flush |

`node:update` and `edge:update` dedupe per-id within a single batch/flush — if the same node is updated 10 times inside a `batch(fn)`, subscribers see one `node:update` event with the last patch applied.

`setPosition(id, pos, { silent: true })` does **not** fire `node:update`. It only bumps `store.version`. Silent writes are intended for layout sim ticks — subscribers that need to re-render on layout movement should observe `version` on their own RAF tick rather than subscribing to `node:update`.

### Subscribing

```ts
store.events.on('node:add', ({ nodeId }) => {
  console.log('node added', nodeId, store.getNode(nodeId));
});

const off = store.events.on('flush', (counts) => {
  if (counts.addedNodes + counts.addedEdges > 0) hud.bumpItemCount();
});
off();
```

### Why store events are separate from layer events

Some consumers don't render the graph — they replicate it to a server, write analytics, or sync to a worker. Layer pointer events are noise for them, and they may run in environments without a layer at all. `store.events` is the layer-free surface for pure data observation. `graphLayer.events` adds interaction semantics on top.

---

## `graphLayer.events` — interaction-level

Fired by `GraphLayer`. Names are split by type — `node:*` and `edge:*` are distinct events, each with a typed payload. There is no flat `element:*` channel.

### Node events

| Event | Payload |
|---|---|
| `node:pointerover` / `node:pointerout` | `{ nodeId, nodeData, worldX, worldY, pointerId, modifiers }` |
| `node:pointerdown` / `node:pointerup` / `node:pointermove` | same + `{ button }` |
| `node:click` / `node:doubleclick` | same + `{ button }` |
| `node:contextmenu` | same |
| `node:dragstart` / `node:drag` / `node:dragend` | `{ nodeId, nodeData, worldX, worldY, dx, dy, modifiers }` |
| `node:statechange` | `{ nodeId, state, active }` |

Drag events are emitted by `DragNodeBehaviour`, not by the layer's pointer template methods — the layer itself only synthesises tap/click/doubleclick.

### Edge events

The same pointer/click variants for edges, with `edgeId` / `edgeData` instead of `nodeId` / `nodeData`:

`edge:pointerover` / `edge:pointerout` / `edge:pointerdown` / `edge:pointerup` / `edge:pointermove` / `edge:click` / `edge:doubleclick` / `edge:contextmenu` / `edge:statechange`. (Edge drag events ship when `DragEdgeBehaviour` lands; not v0.)

### Aggregated lifecycle

These fire on the layer, aggregated from the underlying `store.events`:

| Event | Payload |
|---|---|
| `data:changed` | `{ addedNodes, removedNodes, addedEdges, removedEdges }` — counts since last flush |
| `positions:updated` | `{ count }` — emitted by layouts after writing back |
| `selection:changed` | `{ added, removed, selected }` — sets of ids |
| `viewport:fitcontent` | `{}` — emitted after `fitContent()` |

`data:changed` is the layer-side mirror of `store.events.flush`. Subscribe at the layer level when you want to react to "the rendered graph changed" without caring whether the change came from a CRUD call or a streamed batch.

---

## Why split by type, not discriminated

A discriminated `element:click` event with a `kind: 'node' | 'edge'` field forces every subscriber to switch-and-cast at the call site, and TypeScript can't narrow a single event payload to the right interface. Splitting gives:

- `graph.events.on('node:click', e => e.nodeData.id)` — no narrowing
- Subscribers that only care about nodes never receive edge events
- Tap-channel suffix filtering (`'only :node:* events'`) works naturally

---

## Subscribing examples

Layer interaction:

```ts
graph.events.on('node:click', ({ nodeId, nodeData, worldX, worldY }) => {
  console.log('clicked', nodeId, nodeData.data);
});

const off = graph.events.on('selection:changed', ({ selected }) => {
  hud.setSelection(selected);
});
off();
```

Tap channel (telemetry across all layers):

```ts
canvas.events.tap((e) => {
  if (e.type.endsWith(':node:click')) metrics.send('graph.node.click');
});
```

Store-level (server replication):

```ts
store.events.on('node:add',    ({ nodeId }) => replicate.create('node', store.getNode(nodeId)));
store.events.on('node:update', ({ nodeId, patch }) => replicate.update('node', nodeId, patch));
store.events.on('node:remove', ({ nodeId }) => replicate.delete('node', nodeId));
```
