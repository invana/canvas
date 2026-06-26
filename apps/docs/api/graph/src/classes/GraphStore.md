# Class: GraphStore

Defined in: [graph/src/store/GraphStore.ts:68](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L68)

## Constructors

### Constructor

> **new GraphStore**(`opts?`): `GraphStore`

Defined in: [graph/src/store/GraphStore.ts:145](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L145)

#### Parameters

##### opts?

[`GraphStoreOptions`](../interfaces/GraphStoreOptions.md) = `{}`

#### Returns

`GraphStore`

## Properties

### events

> `readonly` **events**: `SourceEmitter`\<[`GraphStoreEventMap`](../type-aliases/GraphStoreEventMap.md)\>

Defined in: [graph/src/store/GraphStore.ts:108](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L108)

Public event bus. Subscribe via `store.events.on('node:add', ...)`.

A `SourceEmitter` (`{ kind: 'store' }`): once the owning layer calls
[bindBus](#bindbus) on mount, every emit also publishes a `CanvasEvent` envelope
to the canvas tap channel, so telemetry sees all store mutations
(`store-owns-state-plan.md` § 6).

## Accessors

### version

#### Get Signature

> **get** **version**(): `number`

Defined in: [graph/src/store/GraphStore.ts:177](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L177)

Monotonic counter. Bumps on every mutation including silent position writes.

##### Returns

`number`

## Methods

### addData()

> **addData**(`data`): `void`

Defined in: [graph/src/store/GraphStore.ts:869](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L869)

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

Defined in: [graph/src/store/GraphStore.ts:566](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L566)

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

Defined in: [graph/src/store/GraphStore.ts:856](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L856)

#### Parameters

##### edges

readonly [`GraphEdge`](../interfaces/GraphEdge.md)\<`unknown`\>[]

#### Returns

`void`

***

### addEdgeState()

> **addEdgeState**(`id`, `name`, `_opts?`): `void`

Defined in: [graph/src/store/GraphStore.ts:745](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L745)

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

Defined in: [graph/src/store/GraphStore.ts:417](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L417)

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

Defined in: [graph/src/store/GraphStore.ts:850](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L850)

#### Parameters

##### nodes

readonly [`GraphNode`](../interfaces/GraphNode.md)\<`unknown`\>[]

#### Returns

`void`

***

### addNodeState()

> **addNodeState**(`id`, `name`, `_opts?`): `void`

Defined in: [graph/src/store/GraphStore.ts:679](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L679)

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

Defined in: [graph/src/store/GraphStore.ts:318](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L318)

#### Parameters

##### id

`string`

#### Returns

`IterableIterator`\<`string`\>

***

### applyDelta()

> **applyDelta**(`delta`): `void`

Defined in: [graph/src/store/GraphStore.ts:897](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L897)

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

Defined in: [graph/src/store/GraphStore.ts:947](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L947)

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

Defined in: [graph/src/store/GraphStore.ts:170](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L170)

Attach (or detach with `undefined`) the canvas event bus this store's
events forward to. Called by the owning `GraphLayer` on mount/unmount so
store mutations reach the telemetry tap channel (§ 6). Local
`store.events.on(...)` subscribers work with or without a bus.

#### Parameters

##### bus

`CanvasEventBus`

#### Returns

`void`

***

### childrenOf()

> **childrenOf**(`parentId`): `IterableIterator`\<`string`\>

Defined in: [graph/src/store/GraphStore.ts:300](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L300)

#### Parameters

##### parentId

`string`

#### Returns

`IterableIterator`\<`string`\>

***

### clear()

> **clear**(): `void`

Defined in: [graph/src/store/GraphStore.ts:971](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L971)

Wipe all data. Cancels any pending flush.

#### Returns

`void`

***

### clearEdgeState()

> **clearEdgeState**(`name`): `void`

Defined in: [graph/src/store/GraphStore.ts:771](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L771)

Strip a runtime (presence) state from every edge. See [clearNodeState](#clearnodestate).

#### Parameters

##### name

`string`

#### Returns

`void`

***

### clearNodeState()

> **clearNodeState**(`name`): `void`

Defined in: [graph/src/store/GraphStore.ts:729](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L729)

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

Defined in: [graph/src/store/GraphStore.ts:1000](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L1000)

Reclaim tombstoned slots. Invalidates any external code that cached
slot indices. Renderer batch buffers etc. must invalidate first.

#### Returns

`void`

***

### descendantsOf()

> **descendantsOf**(`id`): `IterableIterator`\<`string`\>

Defined in: [graph/src/store/GraphStore.ts:306](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L306)

#### Parameters

##### id

`string`

#### Returns

`IterableIterator`\<`string`\>

***

### edgeCount()

> **edgeCount**(): `number`

Defined in: [graph/src/store/GraphStore.ts:187](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L187)

Number of live (non-tombstoned) edges.

#### Returns

`number`

***

### edges()

> **edges**(): `IterableIterator`\<[`GraphEdge`](../interfaces/GraphEdge.md)\<`unknown`\>\>

Defined in: [graph/src/store/GraphStore.ts:221](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L221)

#### Returns

`IterableIterator`\<[`GraphEdge`](../interfaces/GraphEdge.md)\<`unknown`\>\>

***

### edgesOf()

> **edgesOf**(`nodeId`, `dir?`): `IterableIterator`\<[`GraphEdge`](../interfaces/GraphEdge.md)\<`unknown`\>\>

Defined in: [graph/src/store/GraphStore.ts:245](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L245)

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

Defined in: [graph/src/store/GraphStore.ts:803](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L803)

Effective active states of an edge — union of document + presence.

#### Parameters

##### id

`string`

#### Returns

readonly `string`[]

***

### edgesWithState()

> **edgesWithState**(`name`): `IterableIterator`\<`string`\>

Defined in: [graph/src/store/GraphStore.ts:840](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L840)

Edge sibling of [nodesWithState](#nodeswithstate).

#### Parameters

##### name

`string`

#### Returns

`IterableIterator`\<`string`\>

***

### flush()

> **flush**(): `void`

Defined in: [graph/src/store/GraphStore.ts:965](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L965)

Drain any pending events. Cancels the RAF-scheduled flush (frame mode).
In sync mode this still works — handy for forcing the TTL eviction sweep
even if no mutation has happened since the last flush.

#### Returns

`void`

***

### getEdge()

> **getEdge**\<`D`\>(`id`): [`GraphEdge`](../interfaces/GraphEdge.md)\<`D`\>

Defined in: [graph/src/store/GraphStore.ts:209](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L209)

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

Defined in: [graph/src/store/GraphStore.ts:199](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L199)

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

Defined in: [graph/src/store/GraphStore.ts:328](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L328)

#### Parameters

##### id

`string`

#### Returns

[`Vec2`](../interfaces/Vec2.md)

***

### hasEdge()

> **hasEdge**(`id`): `boolean`

Defined in: [graph/src/store/GraphStore.ts:195](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L195)

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### hasEdgeState()

> **hasEdgeState**(`id`, `name`): `boolean`

Defined in: [graph/src/store/GraphStore.ts:820](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L820)

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

Defined in: [graph/src/store/GraphStore.ts:191](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L191)

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### hasNodeState()

> **hasNodeState**(`id`, `name`): `boolean`

Defined in: [graph/src/store/GraphStore.ts:814](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L814)

True iff `name` is in a node's effective (document ∪ presence) state set.

#### Parameters

##### id

`string`

##### name

`string`

#### Returns

`boolean`

***

### inDegree()

> **inDegree**(`nodeId`): `number`

Defined in: [graph/src/store/GraphStore.ts:233](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L233)

#### Parameters

##### nodeId

`string`

#### Returns

`number`

***

### isPinned()

> **isPinned**(`id`): `boolean`

Defined in: [graph/src/store/GraphStore.ts:399](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L399)

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### neighborsOf()

> **neighborsOf**(`nodeId`, `dir?`): `IterableIterator`\<`string`\>

Defined in: [graph/src/store/GraphStore.ts:271](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L271)

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

Defined in: [graph/src/store/GraphStore.ts:182](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L182)

Number of live (non-tombstoned) nodes.

#### Returns

`number`

***

### nodes()

> **nodes**(): `IterableIterator`\<[`GraphNode`](../interfaces/GraphNode.md)\<`unknown`\>\>

Defined in: [graph/src/store/GraphStore.ts:214](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L214)

#### Returns

`IterableIterator`\<[`GraphNode`](../interfaces/GraphNode.md)\<`unknown`\>\>

***

### nodeStatesOf()

> **nodeStatesOf**(`id`): readonly `string`[]

Defined in: [graph/src/store/GraphStore.ts:792](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L792)

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

Defined in: [graph/src/store/GraphStore.ts:829](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L829)

Ids of every node whose effective (document ∪ presence) state set contains
`name`. Scans live nodes; useful for snapshots / iteration.

#### Parameters

##### name

`string`

#### Returns

`IterableIterator`\<`string`\>

***

### outDegree()

> **outDegree**(`nodeId`): `number`

Defined in: [graph/src/store/GraphStore.ts:227](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L227)

#### Parameters

##### nodeId

`string`

#### Returns

`number`

***

### parentOf()

> **parentOf**(`id`): `string`

Defined in: [graph/src/store/GraphStore.ts:296](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L296)

#### Parameters

##### id

`string`

#### Returns

`string`

***

### pinnedIds()

> **pinnedIds**(): `IterableIterator`\<`string`\>

Defined in: [graph/src/store/GraphStore.ts:405](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L405)

#### Returns

`IterableIterator`\<`string`\>

***

### removeEdge()

> **removeEdge**(`id`): `void`

Defined in: [graph/src/store/GraphStore.ts:640](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L640)

#### Parameters

##### id

`string`

#### Returns

`void`

***

### removeEdgeState()

> **removeEdgeState**(`id`, `name`, `_opts?`): `void`

Defined in: [graph/src/store/GraphStore.ts:760](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L760)

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

Defined in: [graph/src/store/GraphStore.ts:494](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L494)

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

Defined in: [graph/src/store/GraphStore.ts:697](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L697)

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

Defined in: [graph/src/store/GraphStore.ts:634](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L634)

Reverse an edge's direction — swap its `source` and `target`. No-op if the
edge doesn't exist. Routes through [updateEdge](#updateedge), so adjacency indexes
are rewired and an `edge:update` is enqueued like any other re-pointing.

#### Parameters

##### id

`string`

#### Returns

`void`

***

### setEdgeState()

> **setEdgeState**(`id`, `name`, `on?`, `opts?`): `void`

Defined in: [graph/src/store/GraphStore.ts:718](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L718)

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

### setNodeState()

> **setNodeState**(`id`, `name`, `on?`, `opts?`): `void`

Defined in: [graph/src/store/GraphStore.ts:712](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L712)

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

Defined in: [graph/src/store/GraphStore.ts:385](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L385)

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

Defined in: [graph/src/store/GraphStore.ts:338](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L338)

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

Defined in: [graph/src/store/GraphStore.ts:360](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L360)

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

### updateEdge()

> **updateEdge**\<`D`\>(`id`, `patch`): `void`

Defined in: [graph/src/store/GraphStore.ts:589](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L589)

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

Defined in: [graph/src/store/GraphStore.ts:435](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L435)

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

Defined in: [graph/src/store/GraphStore.ts:580](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L580)

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

Defined in: [graph/src/store/GraphStore.ts:426](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/GraphStore.ts#L426)

Add-or-merge. Streaming-friendly path.

#### Type Parameters

##### D

`D`

#### Parameters

##### node

[`GraphNode`](../interfaces/GraphNode.md)\<`D`\>

#### Returns

`void`
