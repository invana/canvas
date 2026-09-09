# Class: GraphStore

`DataSource` — the kernel's contract for a **bulk data store** owned by
`CanvasStore.data[id]` (decision **D13**: *interface, not inheritance* — see
`docs/canvas-store-d13-data-ownership.md`).

The kernel owns sources behind this interface **without knowing their domain**:
- the default [LayerData](../../../canvas-store/src/classes/LayerData.md) satisfies it out of the box, and
- a domain store (e.g. `@invana/graph`'s `GraphStore`) *implements* it and is
  registered via `CanvasStore.setSource(id, source)`.

Only the three members the kernel needs to **own + bridge** a source live here;
everything domain-specific (positions fast-path, adjacency, hierarchy, presence)
stays off the interface. `CanvasStore` subscribes each source's [onFlush](../../../canvas/src/interfaces/DataSource.md#onflush)
and re-emits it as a coarse `data:flush` on the bus (telemetry / collab); the
domain renderer subscribes to the source directly for targeted updates.

## Implements

- [`DataSource`](../../../canvas/src/interfaces/DataSource.md)

## Constructors

### Constructor

> **new GraphStore**(`opts?`): `GraphStore`

#### Parameters

##### opts?

[`GraphStoreOptions`](../interfaces/GraphStoreOptions.md) = `{}`

#### Returns

`GraphStore`

## Properties

### events

> `readonly` **events**: [`SourceEmitter`](../../../canvas/src/classes/SourceEmitter.md)\<[`GraphStoreEventMap`](../type-aliases/GraphStoreEventMap.md)\>

Public event bus. Subscribe via `store.events.on('node:add', ...)`.

A `SourceEmitter` (`{ kind: 'store' }`): once the owning layer calls
[bindBus](#bindbus) on mount, every emit also publishes a `CanvasEvent` envelope
to the canvas tap channel, so telemetry sees all store mutations
(`store-owns-state-plan.md` § 6).

## Accessors

### schema

#### Get Signature

> **get** **schema**(): [`GraphSchema`](../interfaces/GraphSchema.md)

The **authoritative** schema declared for this graph (e.g. the full Neo4j DB
schema behind a connected canvas), or `undefined` when none is set. It is
typically a *superset* of what's loaded — for the schema of the *loaded* data
use `deriveSchema(store)`. The common resolution is `store.schema ??
deriveSchema(store)` (authoritative wins).

##### Returns

[`GraphSchema`](../interfaces/GraphSchema.md)

***

### version

#### Get Signature

> **get** **version**(): `number`

Monotonic counter. Bumps on every mutation including silent position writes.

##### Returns

`number`

## Methods

### addData()

> **addData**(`data`): `void`

Append nodes + edges in one batch — non-destructive (does NOT clear).
Convenience for streaming feeds that push a fresh chunk of items as
they arrive. Subscribers see a single `flush`.

Differs from `GraphLayer.setData`, which clears the store first.

#### Parameters

##### data

###### edges?

readonly [`GraphEdge`](../interfaces/GraphEdge.md)\<`unknown`\>[]

###### nodes?

readonly [`GraphNode`](../interfaces/GraphNode.md)\<`unknown`\>[]

#### Returns

`void`

***

### addEdge()

> **addEdge**\<`D`\>(`edge`): `void`

#### Type Parameters

##### D

`D`

#### Parameters

##### edge

[`GraphEdge`](../interfaces/GraphEdge.md)\<`D`\>

#### Returns

`void`

***

### addEdgesBulk()

> **addEdgesBulk**(`edges`): `void`

#### Parameters

##### edges

readonly [`GraphEdge`](../interfaces/GraphEdge.md)\<`unknown`\>[]

#### Returns

`void`

***

### addEdgeState()

> **addEdgeState**(`id`, `name`, `_opts?`): `void`

Add a runtime (presence) state to an edge. See [addNodeState](#addnodestate).

#### Parameters

##### id

`string`

##### name

`string`

##### \_opts?

###### actor?

`string`

#### Returns

`void`

***

### addNode()

> **addNode**\<`D`\>(`node`): `void`

Strict add — throws on duplicate.

#### Type Parameters

##### D

`D`

#### Parameters

##### node

[`GraphNode`](../interfaces/GraphNode.md)\<`D`\>

#### Returns

`void`

***

### addNodesBulk()

> **addNodesBulk**(`nodes`): `void`

#### Parameters

##### nodes

readonly [`GraphNode`](../interfaces/GraphNode.md)\<`unknown`\>[]

#### Returns

`void`

***

### addNodeState()

> **addNodeState**(`id`, `name`, `_opts?`): `void`

Add a runtime (presence) state to a node. Idempotent — re-adding an already
active state is a no-op (no event). No-op if the node id is unknown.

#### Parameters

##### id

`string`

Node id.

##### name

`string`

State name (e.g. `'selected'`, `'highlighted'`, `'lineage'`).

##### \_opts?

Reserved for collaboration — `actor` will tag the change with
  its originating user once presence replication lands (§ 5). Unused today.

###### actor?

`string`

#### Returns

`void`

***

### ancestorsOf()

> **ancestorsOf**(`id`): `IterableIterator`\<`string`\>

#### Parameters

##### id

`string`

#### Returns

`IterableIterator`\<`string`\>

***

### applyDelta()

> **applyDelta**(`delta`): `void`

Apply a streaming delta in a single batch. Order within the batch:
1. `removed.edgeIds`  — removed first so node removals can't cascade
   them again (no-op double removal is harmless, but explicit is cleaner).
2. `removed.nodeIds`  — cascade-removes incident edges per `removeNode`'s
   default `cascade: true`.
3. `added.nodes`      — `upsertNode` (idempotent; safe to re-send).
4. `added.edges`      — `upsertEdge`.
5. `updated.nodes`    — partial patches via `updateNode`.
6. `updated.edges`    — partial patches via `updateEdge`.

Use `upsertNode` / `upsertEdge` for the `added` lists so a feed that
re-sends an existing id (common in pub-sub) merges rather than throwing.
If you have hard-add semantics, use `addData` instead.

Subscribers see one `flush` regardless of how many items were touched.

#### Parameters

##### delta

###### added?

\{ `edges?`: readonly [`GraphEdge`](../interfaces/GraphEdge.md)\<`unknown`\>[]; `nodes?`: readonly [`GraphNode`](../interfaces/GraphNode.md)\<`unknown`\>[]; \}

###### added.edges?

readonly [`GraphEdge`](../interfaces/GraphEdge.md)\<`unknown`\>[]

###### added.nodes?

readonly [`GraphNode`](../interfaces/GraphNode.md)\<`unknown`\>[]

###### removed?

\{ `edgeIds?`: readonly `string`[]; `nodeIds?`: readonly `string`[]; \}

###### removed.edgeIds?

readonly `string`[]

###### removed.nodeIds?

readonly `string`[]

###### updated?

\{ `edges?`: readonly `object`[]; `nodes?`: readonly `object`[]; \}

###### updated.edges?

readonly `object`[]

###### updated.nodes?

readonly `object`[]

#### Returns

`void`

***

### batch()

> **batch**\<`T`\>(`fn`): `T`

Coalesce all mutations inside `fn` into a single flush. Nested `batch`
calls flush only on the outermost exit.

#### Type Parameters

##### T

`T`

#### Parameters

##### fn

() => `T`

#### Returns

`T`

***

### bindBus()

> **bindBus**(`bus`): `void`

Attach (or detach with `undefined`) the canvas event bus this store's
events forward to. Called by the owning `GraphLayer` on mount/unmount so
store mutations reach the telemetry tap channel (§ 6). Local
`store.events.on(...)` subscribers work with or without a bus.

#### Parameters

##### bus

[`CanvasEventBus`](../../../canvas/src/classes/CanvasEventBus.md)

#### Returns

`void`

***

### childrenOf()

> **childrenOf**(`parentId`): `IterableIterator`\<`string`\>

#### Parameters

##### parentId

`string`

#### Returns

`IterableIterator`\<`string`\>

***

### clear()

> **clear**(): `void`

Wipe all data. Cancels any pending flush.

#### Returns

`void`

***

### clearEdgeState()

> **clearEdgeState**(`name`): `void`

Strip a runtime (presence) state from every edge. See [clearNodeState](#clearnodestate).

#### Parameters

##### name

`string`

#### Returns

`void`

***

### clearNodeState()

> **clearNodeState**(`name`): `void`

Strip a runtime (presence) state from every node that carries it, in one
pass — e.g. clearing a transient `'selected'` / `'lineage'` set. Touches the
presence compartment only; a document state of the same name in `states[]`
is unaffected (change those via [updateNode](#updatenode)).

#### Parameters

##### name

`string`

#### Returns

`void`

***

### compact()

> **compact**(): `void`

Reclaim tombstoned slots. Invalidates any external code that cached
slot indices. Renderer batch buffers etc. must invalidate first.

#### Returns

`void`

***

### descendantsOf()

> **descendantsOf**(`id`): `IterableIterator`\<`string`\>

#### Parameters

##### id

`string`

#### Returns

`IterableIterator`\<`string`\>

***

### edgeCount()

> **edgeCount**(): `number`

Number of live (non-tombstoned) edges.

#### Returns

`number`

***

### edges()

> **edges**(): `IterableIterator`\<[`GraphEdge`](../interfaces/GraphEdge.md)\<`unknown`\>\>

#### Returns

`IterableIterator`\<[`GraphEdge`](../interfaces/GraphEdge.md)\<`unknown`\>\>

***

### edgesOf()

> **edgesOf**(`nodeId`, `dir?`): `IterableIterator`\<[`GraphEdge`](../interfaces/GraphEdge.md)\<`unknown`\>\>

Yield edges incident to `nodeId` in the requested direction.
`'out'` — edges where `nodeId` is the source.
`'in'`  — edges where `nodeId` is the target.
`'both'` — out then in.

#### Parameters

##### nodeId

`string`

##### dir?

[`EdgeDirection`](../type-aliases/EdgeDirection.md) = `'both'`

#### Returns

`IterableIterator`\<[`GraphEdge`](../interfaces/GraphEdge.md)\<`unknown`\>\>

***

### edgeStatesOf()

> **edgeStatesOf**(`id`): readonly `string`[]

Effective active states of an edge — union of document + presence.

#### Parameters

##### id

`string`

#### Returns

readonly `string`[]

***

### edgesWithState()

> **edgesWithState**(`name`): `IterableIterator`\<`string`\>

Edge sibling of [nodesWithState](#nodeswithstate).

#### Parameters

##### name

`string`

#### Returns

`IterableIterator`\<`string`\>

***

### flush()

> **flush**(): `void`

Drain any pending events. Cancels the RAF-scheduled flush (frame mode).
In sync mode this still works — handy for forcing the TTL eviction sweep
even if no mutation has happened since the last flush.

#### Returns

`void`

#### Implementation of

[`DataSource`](../../../canvas/src/interfaces/DataSource.md).[`flush`](../../../canvas/src/interfaces/DataSource.md#flush)

***

### getEdge()

> **getEdge**\<`D`\>(`id`): [`GraphEdge`](../interfaces/GraphEdge.md)\<`D`\>

#### Type Parameters

##### D

`D` = `unknown`

#### Parameters

##### id

`string`

#### Returns

[`GraphEdge`](../interfaces/GraphEdge.md)\<`D`\>

***

### getNode()

> **getNode**\<`D`\>(`id`): [`GraphNode`](../interfaces/GraphNode.md)\<`D`\>

#### Type Parameters

##### D

`D` = `unknown`

#### Parameters

##### id

`string`

#### Returns

[`GraphNode`](../interfaces/GraphNode.md)\<`D`\>

***

### getPosition()

> **getPosition**(`id`): [`Vec2`](../interfaces/Vec2.md)

#### Parameters

##### id

`string`

#### Returns

[`Vec2`](../interfaces/Vec2.md)

***

### hasEdge()

> **hasEdge**(`id`): `boolean`

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### hasEdgeState()

> **hasEdgeState**(`id`, `name`): `boolean`

True iff `name` is in an edge's effective (document ∪ presence) state set.

#### Parameters

##### id

`string`

##### name

`string`

#### Returns

`boolean`

***

### hasNode()

> **hasNode**(`id`): `boolean`

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### hasNodeState()

> **hasNodeState**(`id`, `name`): `boolean`

True iff `name` is in a node's effective (document ∪ presence) state set.

#### Parameters

##### id

`string`

##### name

`string`

#### Returns

`boolean`

***

### hiddenEdgeCount()

> **hiddenEdgeCount**(): `number`

Count of explicitly-hidden edges (O(1)).

#### Returns

`number`

***

### hiddenEdges()

> **hiddenEdges**(): `IterableIterator`\<`string`\>

Ids of every explicitly-hidden edge (O(1)-tracked, no scan).

#### Returns

`IterableIterator`\<`string`\>

***

### hiddenNodeCount()

> **hiddenNodeCount**(): `number`

Count of explicitly-hidden nodes (O(1)).

#### Returns

`number`

***

### hiddenNodes()

> **hiddenNodes**(): `IterableIterator`\<`string`\>

Ids of every explicitly-hidden node (O(1)-tracked, no scan).

#### Returns

`IterableIterator`\<`string`\>

***

### hideEdge()

> **hideEdge**(`id`): `void`

Hide an edge. Idempotent; usable inside a caller's `batch()`.

#### Parameters

##### id

`string`

#### Returns

`void`

***

### hideEdges()

> **hideEdges**(`ids`): `void`

Hide many edges in one batch → one flush.

#### Parameters

##### ids

`Iterable`\<`string`\>

#### Returns

`void`

***

### hideNode()

> **hideNode**(`id`): `void`

Hide a node. Idempotent; usable inside a caller's `batch()`.

#### Parameters

##### id

`string`

#### Returns

`void`

***

### hideNodes()

> **hideNodes**(`ids`): `void`

Hide many nodes in one batch → one flush.

#### Parameters

##### ids

`Iterable`\<`string`\>

#### Returns

`void`

***

### hideNodesByPredicate()

> **hideNodesByPredicate**(`fn`): `void`

Hide every node for which `fn` returns true, in one batch → one flush.

#### Parameters

##### fn

(`node`) => `boolean`

#### Returns

`void`

***

### inDegree()

> **inDegree**(`nodeId`): `number`

#### Parameters

##### nodeId

`string`

#### Returns

`number`

***

### isEdgeHidden()

> **isEdgeHidden**(`id`): `boolean`

True iff the edge's **explicit** hidden flag is set (O(1)).

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### isEdgeVisible()

> **isEdgeVisible**(`id`): `boolean`

Effective visibility of an edge — live, not explicitly hidden, and with
**both endpoints visible**. This is the derived rule the renderer/hit-test
consult; hiding a node makes its incident edges return `false` here without
flagging them.

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### isNodeHidden()

> **isNodeHidden**(`id`): `boolean`

True iff the node's **explicit** hidden flag is set (O(1)).

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### isNodeVisible()

> **isNodeVisible**(`id`): `boolean`

Effective visibility of a node — live and not explicitly hidden.

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### isPinned()

> **isPinned**(`id`): `boolean`

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### neighborsOf()

> **neighborsOf**(`nodeId`, `dir?`): `IterableIterator`\<`string`\>

Yield neighbor node ids in the requested direction.

#### Parameters

##### nodeId

`string`

##### dir?

[`EdgeDirection`](../type-aliases/EdgeDirection.md) = `'both'`

#### Returns

`IterableIterator`\<`string`\>

***

### nodeCount()

> **nodeCount**(): `number`

Number of live (non-tombstoned) nodes.

#### Returns

`number`

***

### nodes()

> **nodes**(): `IterableIterator`\<[`GraphNode`](../interfaces/GraphNode.md)\<`unknown`\>\>

#### Returns

`IterableIterator`\<[`GraphNode`](../interfaces/GraphNode.md)\<`unknown`\>\>

***

### nodeStatesOf()

> **nodeStatesOf**(`id`): readonly `string`[]

Effective active states of a node — the **union** of its document `states[]`
(feed-owned) and its runtime presence set. This is what the renderer iterates
to apply state overlays. Returns a fresh array; empty if the node is unknown
or carries no states.

#### Parameters

##### id

`string`

#### Returns

readonly `string`[]

***

### nodesWithState()

> **nodesWithState**(`name`): `IterableIterator`\<`string`\>

Ids of every node whose effective (document ∪ presence) state set contains
`name`. Scans live nodes; useful for snapshots / iteration.

#### Parameters

##### name

`string`

#### Returns

`IterableIterator`\<`string`\>

***

### onFlush()

> **onFlush**(`listener`): () => `void`

[DataSource](../../../canvas/src/interfaces/DataSource.md) (D13) — subscribe to a coalesced [LayerFlush](../../../canvas/src/interfaces/LayerFlush.md) delta
projected from this store's per-flush changes (position-only updates → `moved`).
Distinct from `events.on('flush', …)` (which carries aggregate counters): this
is what `CanvasStore` bridges onto `data:flush`. Returns an unsubscribe.

#### Parameters

##### listener

(`delta`) => `void`

#### Returns

() => `void`

#### Implementation of

[`DataSource`](../../../canvas/src/interfaces/DataSource.md).[`onFlush`](../../../canvas/src/interfaces/DataSource.md#onflush)

***

### outDegree()

> **outDegree**(`nodeId`): `number`

#### Parameters

##### nodeId

`string`

#### Returns

`number`

***

### parentOf()

> **parentOf**(`id`): `string`

#### Parameters

##### id

`string`

#### Returns

`string`

***

### pinnedIds()

> **pinnedIds**(): `IterableIterator`\<`string`\>

#### Returns

`IterableIterator`\<`string`\>

***

### removeEdge()

> **removeEdge**(`id`): `void`

#### Parameters

##### id

`string`

#### Returns

`void`

***

### removeEdgeState()

> **removeEdgeState**(`id`, `name`, `_opts?`): `void`

Remove a runtime (presence) state from an edge. See [removeNodeState](#removenodestate).

#### Parameters

##### id

`string`

##### name

`string`

##### \_opts?

###### actor?

`string`

#### Returns

`void`

***

### removeNode()

> **removeNode**(`id`, `opts?`): `void`

Remove a node. Cascades by default — removes all incident edges first.
`cascade: false` throws if any incident edges still exist.

#### Parameters

##### id

`string`

##### opts?

###### cascade?

`boolean`

#### Returns

`void`

***

### removeNodeState()

> **removeNodeState**(`id`, `name`, `_opts?`): `void`

Remove a runtime (presence) state from a node. No-op if the state isn't
currently active (no event) or the node is unknown.

#### Parameters

##### id

`string`

##### name

`string`

##### \_opts?

###### actor?

`string`

#### Returns

`void`

***

### reverseEdge()

> **reverseEdge**(`id`): `void`

Reverse an edge's direction — swap its `source` and `target`. No-op if the
edge doesn't exist. Routes through [updateEdge](#updateedge), so adjacency indexes
are rewired and an `edge:update` is enqueued like any other re-pointing.

#### Parameters

##### id

`string`

#### Returns

`void`

***

### setEdgeHidden()

> **setEdgeHidden**(`id`, `hidden`): `void`

Set an edge's explicit hidden flag. Idempotent.

#### Parameters

##### id

`string`

##### hidden

`boolean`

#### Returns

`void`

***

### setEdgesHidden()

> **setEdgesHidden**(`ids`, `hidden`): `void`

Set the hidden flag on many edges in one batch → one flush.

#### Parameters

##### ids

`Iterable`\<`string`\>

##### hidden

`boolean`

#### Returns

`void`

***

### setEdgeState()

> **setEdgeState**(`id`, `name`, `on?`, `opts?`): `void`

Toggle a runtime (presence) state on an edge. See [setNodeState](#setnodestate).

#### Parameters

##### id

`string`

##### name

`string`

##### on?

`boolean` = `true`

##### opts?

###### actor?

`string`

#### Returns

`void`

***

### setFlushMode()

> **setFlushMode**(`mode`): `void`

[DataSource](../../../canvas/src/interfaces/DataSource.md) (D13) — set the flush trigger. The engine drives `'manual'`
(its single rAF loop calls [flush](#flush)); kernel `'frame'`/`'microtask'` both
map to GraphStore's frame scheduler. GraphStore's native `'sync'` is the
constructor default and isn't reachable through this setter.

#### Parameters

##### mode

[`FlushMode`](../../../canvas/src/type-aliases/FlushMode.md)

#### Returns

`void`

#### Implementation of

[`DataSource`](../../../canvas/src/interfaces/DataSource.md).[`setFlushMode`](../../../canvas/src/interfaces/DataSource.md#setflushmode)

***

### setNodeBoundingBox()

> **setNodeBoundingBox**(`id`, `box`): `void`

Write a node's cached [GraphNode.boundingBox](../interfaces/GraphNode.md#boundingbox) — the local render size
the `GraphLayer` computed after drawing it. **Silent**: this is a derived
cache, not a data mutation, so it emits no change / flush event and does not
bump [version](#version) (avoids a render feedback loop). Unknown ids are a
no-op. Surfaced by [getNode](#getnode) / [nodes](#nodes) so layouts can read a
node's footprint without recomputing its shape spec.

#### Parameters

##### id

`string`

##### box

###### height

`number`

###### width

`number`

#### Returns

`void`

***

### setNodeHidden()

> **setNodeHidden**(`id`, `hidden`): `void`

Set a node's explicit hidden flag. Idempotent.

#### Parameters

##### id

`string`

##### hidden

`boolean`

#### Returns

`void`

***

### setNodesHidden()

> **setNodesHidden**(`ids`, `hidden`): `void`

Set the hidden flag on many nodes in one batch → one flush.

#### Parameters

##### ids

`Iterable`\<`string`\>

##### hidden

`boolean`

#### Returns

`void`

***

### setNodeState()

> **setNodeState**(`id`, `name`, `on?`, `opts?`): `void`

Toggle a runtime (presence) state on a node — `on ? addNodeState :
removeNodeState`. Convenience for callers (e.g. hover) that compute the
desired membership as a boolean. Default `on = true`.

#### Parameters

##### id

`string`

##### name

`string`

##### on?

`boolean` = `true`

##### opts?

###### actor?

`string`

#### Returns

`void`

***

### setPinned()

> **setPinned**(`id`, `pinned`): `void`

#### Parameters

##### id

`string`

##### pinned

`boolean`

#### Returns

`void`

***

### setPosition()

> **setPosition**(`id`, `pos`, `opts?`): `void`

Set a single node's position.

Default fires `node:update`. `opts.silent: true` skips the event and just
bumps `version` — use for layout sim ticks at 60fps.

#### Parameters

##### id

`string`

##### pos

[`Vec2`](../interfaces/Vec2.md)

##### opts?

###### silent?

`boolean`

#### Returns

`void`

***

### setPositionsBulk()

> **setPositionsBulk**(`ids`, `xy`, `opts?`): `void`

Set many positions in a single tight loop.

`xy` is packed `[x0, y0, x1, y1, ...]` (length must equal `ids.length * 2`).
`opts.silent: true` skips events — sim-tick fastpath. Otherwise emits one
deduped `node:update` per id.

#### Parameters

##### ids

readonly `string`[]

##### xy

`Float32Array`

##### opts?

###### silent?

`boolean`

#### Returns

`void`

***

### setSchema()

> **setSchema**(`schema`): `void`

Set (or clear with `undefined`) the authoritative schema. Called by a data
source that *knows* its schema independent of loaded records — a Neo4j /
GraphQL / ontology adapter. Emits `'schema'` so reactive consumers re-read.

#### Parameters

##### schema

[`GraphSchema`](../interfaces/GraphSchema.md)

#### Returns

`void`

***

### showAllHidden()

> **showAllHidden**(): `void`

Clear every explicit hidden flag (nodes + edges) in one batch → one flush.

#### Returns

`void`

***

### showEdge()

> **showEdge**(`id`): `void`

Show an edge (clear its explicit hidden flag). Idempotent.

#### Parameters

##### id

`string`

#### Returns

`void`

***

### showEdges()

> **showEdges**(`ids`): `void`

Show many edges in one batch → one flush.

#### Parameters

##### ids

`Iterable`\<`string`\>

#### Returns

`void`

***

### showNode()

> **showNode**(`id`): `void`

Show a node (clear its explicit hidden flag). Idempotent.

#### Parameters

##### id

`string`

#### Returns

`void`

***

### showNodes()

> **showNodes**(`ids`): `void`

Show many nodes in one batch → one flush.

#### Parameters

##### ids

`Iterable`\<`string`\>

#### Returns

`void`

***

### toggleEdgeHidden()

> **toggleEdgeHidden**(`id`): `boolean`

Flip an edge's explicit hidden flag. Returns the resulting hidden state.

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### toggleNodeHidden()

> **toggleNodeHidden**(`id`): `boolean`

Flip a node's explicit hidden flag. Returns the resulting hidden state.

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### updateEdge()

> **updateEdge**\<`D`\>(`id`, `patch`): `void`

#### Type Parameters

##### D

`D`

#### Parameters

##### id

`string`

##### patch

`Partial`\<[`GraphEdge`](../interfaces/GraphEdge.md)\<`D`\>\>

#### Returns

`void`

***

### updateNode()

> **updateNode**\<`D`\>(`id`, `patch`): `void`

#### Type Parameters

##### D

`D`

#### Parameters

##### id

`string`

##### patch

`Partial`\<[`GraphNode`](../interfaces/GraphNode.md)\<`D`\>\>

#### Returns

`void`

***

### upsertEdge()

> **upsertEdge**\<`D`\>(`edge`): `void`

#### Type Parameters

##### D

`D`

#### Parameters

##### edge

[`GraphEdge`](../interfaces/GraphEdge.md)\<`D`\>

#### Returns

`void`

***

### upsertNode()

> **upsertNode**\<`D`\>(`node`): `void`

Add-or-merge. Streaming-friendly path.

#### Type Parameters

##### D

`D`

#### Parameters

##### node

[`GraphNode`](../interfaces/GraphNode.md)\<`D`\>

#### Returns

`void`
