# Class: GraphStore

Defined in: [graph/src/store/GraphStore.ts:67](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L67)

## Constructors

### Constructor

> **new GraphStore**(`opts?`): `GraphStore`

Defined in: [graph/src/store/GraphStore.ts:118](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L118)

#### Parameters

##### opts?

[`GraphStoreOptions`](../interfaces/GraphStoreOptions.md) = `{}`

#### Returns

`GraphStore`

## Properties

### events

> `readonly` **events**: [`EventEmitter`](../../../canvas/src/classes/EventEmitter.md)\<[`GraphStoreEventMap`](../type-aliases/GraphStoreEventMap.md)\>

Defined in: [graph/src/store/GraphStore.ts:89](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L89)

Public event bus. Subscribe via `store.events.on('node:add', ...)`.

## Accessors

### version

#### Get Signature

> **get** **version**(): `number`

Defined in: [graph/src/store/GraphStore.ts:135](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L135)

Monotonic counter. Bumps on every mutation including silent position writes.

##### Returns

`number`

## Methods

### addData()

> **addData**(`data`): `void`

Defined in: [graph/src/store/GraphStore.ts:625](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L625)

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

Defined in: [graph/src/store/GraphStore.ts:523](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L523)

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

Defined in: [graph/src/store/GraphStore.ts:612](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L612)

#### Parameters

##### edges

readonly [`GraphEdge`](../interfaces/GraphEdge.md)\<`unknown`\>[]

#### Returns

`void`

***

### addNode()

> **addNode**\<`D`\>(`node`): `void`

Defined in: [graph/src/store/GraphStore.ts:375](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L375)

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

Defined in: [graph/src/store/GraphStore.ts:606](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L606)

#### Parameters

##### nodes

readonly [`GraphNode`](../interfaces/GraphNode.md)\<`unknown`\>[]

#### Returns

`void`

***

### ancestorsOf()

> **ancestorsOf**(`id`): `IterableIterator`\<`string`\>

Defined in: [graph/src/store/GraphStore.ts:276](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L276)

#### Parameters

##### id

`string`

#### Returns

`IterableIterator`\<`string`\>

***

### applyDelta()

> **applyDelta**(`delta`): `void`

Defined in: [graph/src/store/GraphStore.ts:653](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L653)

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

Defined in: [graph/src/store/GraphStore.ts:703](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L703)

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

### childrenOf()

> **childrenOf**(`parentId`): `IterableIterator`\<`string`\>

Defined in: [graph/src/store/GraphStore.ts:258](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L258)

#### Parameters

##### parentId

`string`

#### Returns

`IterableIterator`\<`string`\>

***

### clear()

> **clear**(): `void`

Defined in: [graph/src/store/GraphStore.ts:727](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L727)

Wipe all data. Cancels any pending flush.

#### Returns

`void`

***

### compact()

> **compact**(): `void`

Defined in: [graph/src/store/GraphStore.ts:752](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L752)

Reclaim tombstoned slots. Invalidates any external code that cached
slot indices. Renderer batch buffers etc. must invalidate first.

#### Returns

`void`

***

### descendantsOf()

> **descendantsOf**(`id`): `IterableIterator`\<`string`\>

Defined in: [graph/src/store/GraphStore.ts:264](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L264)

#### Parameters

##### id

`string`

#### Returns

`IterableIterator`\<`string`\>

***

### edgeCount()

> **edgeCount**(): `number`

Defined in: [graph/src/store/GraphStore.ts:145](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L145)

Number of live (non-tombstoned) edges.

#### Returns

`number`

***

### edges()

> **edges**(): `IterableIterator`\<[`GraphEdge`](../interfaces/GraphEdge.md)\<`unknown`\>\>

Defined in: [graph/src/store/GraphStore.ts:179](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L179)

#### Returns

`IterableIterator`\<[`GraphEdge`](../interfaces/GraphEdge.md)\<`unknown`\>\>

***

### edgesOf()

> **edgesOf**(`nodeId`, `dir?`): `IterableIterator`\<[`GraphEdge`](../interfaces/GraphEdge.md)\<`unknown`\>\>

Defined in: [graph/src/store/GraphStore.ts:203](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L203)

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

### flush()

> **flush**(): `void`

Defined in: [graph/src/store/GraphStore.ts:721](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L721)

Drain any pending events. Cancels the RAF-scheduled flush (frame mode).
In sync mode this still works — handy for forcing the TTL eviction sweep
even if no mutation has happened since the last flush.

#### Returns

`void`

***

### getEdge()

> **getEdge**\<`D`\>(`id`): [`GraphEdge`](../interfaces/GraphEdge.md)\<`D`\>

Defined in: [graph/src/store/GraphStore.ts:167](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L167)

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

Defined in: [graph/src/store/GraphStore.ts:157](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L157)

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

Defined in: [graph/src/store/GraphStore.ts:286](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L286)

#### Parameters

##### id

`string`

#### Returns

[`Vec2`](../interfaces/Vec2.md)

***

### hasEdge()

> **hasEdge**(`id`): `boolean`

Defined in: [graph/src/store/GraphStore.ts:153](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L153)

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### hasNode()

> **hasNode**(`id`): `boolean`

Defined in: [graph/src/store/GraphStore.ts:149](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L149)

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### inDegree()

> **inDegree**(`nodeId`): `number`

Defined in: [graph/src/store/GraphStore.ts:191](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L191)

#### Parameters

##### nodeId

`string`

#### Returns

`number`

***

### isPinned()

> **isPinned**(`id`): `boolean`

Defined in: [graph/src/store/GraphStore.ts:357](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L357)

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### neighborsOf()

> **neighborsOf**(`nodeId`, `dir?`): `IterableIterator`\<`string`\>

Defined in: [graph/src/store/GraphStore.ts:229](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L229)

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

Defined in: [graph/src/store/GraphStore.ts:140](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L140)

Number of live (non-tombstoned) nodes.

#### Returns

`number`

***

### nodes()

> **nodes**(): `IterableIterator`\<[`GraphNode`](../interfaces/GraphNode.md)\<`unknown`\>\>

Defined in: [graph/src/store/GraphStore.ts:172](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L172)

#### Returns

`IterableIterator`\<[`GraphNode`](../interfaces/GraphNode.md)\<`unknown`\>\>

***

### outDegree()

> **outDegree**(`nodeId`): `number`

Defined in: [graph/src/store/GraphStore.ts:185](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L185)

#### Parameters

##### nodeId

`string`

#### Returns

`number`

***

### parentOf()

> **parentOf**(`id`): `string`

Defined in: [graph/src/store/GraphStore.ts:254](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L254)

#### Parameters

##### id

`string`

#### Returns

`string`

***

### pinnedIds()

> **pinnedIds**(): `IterableIterator`\<`string`\>

Defined in: [graph/src/store/GraphStore.ts:363](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L363)

#### Returns

`IterableIterator`\<`string`\>

***

### removeEdge()

> **removeEdge**(`id`): `void`

Defined in: [graph/src/store/GraphStore.ts:586](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L586)

#### Parameters

##### id

`string`

#### Returns

`void`

***

### removeNode()

> **removeNode**(`id`, `opts?`): `void`

Defined in: [graph/src/store/GraphStore.ts:452](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L452)

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

### setPinned()

> **setPinned**(`id`, `pinned`): `void`

Defined in: [graph/src/store/GraphStore.ts:343](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L343)

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

Defined in: [graph/src/store/GraphStore.ts:296](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L296)

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

Defined in: [graph/src/store/GraphStore.ts:318](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L318)

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

Defined in: [graph/src/store/GraphStore.ts:546](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L546)

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

Defined in: [graph/src/store/GraphStore.ts:393](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L393)

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

Defined in: [graph/src/store/GraphStore.ts:537](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L537)

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

Defined in: [graph/src/store/GraphStore.ts:384](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/store/GraphStore.ts#L384)

Add-or-merge. Streaming-friendly path.

#### Type Parameters

##### D

`D`

#### Parameters

##### node

[`GraphNode`](../interfaces/GraphNode.md)\<`D`\>

#### Returns

`void`
