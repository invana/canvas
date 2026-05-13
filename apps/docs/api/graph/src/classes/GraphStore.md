# Class: GraphStore

Defined in: packages/graph/src/store/GraphStore.ts:67

## Constructors

### Constructor

> **new GraphStore**(`opts?`): `GraphStore`

Defined in: packages/graph/src/store/GraphStore.ts:118

#### Parameters

##### opts?

[`GraphStoreOptions`](../interfaces/GraphStoreOptions.md) = `{}`

#### Returns

`GraphStore`

## Properties

### events

> `readonly` **events**: [`EventEmitter`](../../../canvas/src/classes/EventEmitter.md)\<[`GraphStoreEventMap`](../type-aliases/GraphStoreEventMap.md)\>

Defined in: packages/graph/src/store/GraphStore.ts:89

Public event bus. Subscribe via `store.events.on('node:add', ...)`.

## Accessors

### version

#### Get Signature

> **get** **version**(): `number`

Defined in: packages/graph/src/store/GraphStore.ts:135

Monotonic counter. Bumps on every mutation including silent position writes.

##### Returns

`number`

## Methods

### addEdge()

> **addEdge**\<`D`\>(`edge`): `void`

Defined in: packages/graph/src/store/GraphStore.ts:518

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

Defined in: packages/graph/src/store/GraphStore.ts:604

#### Parameters

##### edges

readonly [`GraphEdge`](../interfaces/GraphEdge.md)\<`unknown`\>[]

#### Returns

`void`

***

### addNode()

> **addNode**\<`D`\>(`node`): `void`

Defined in: packages/graph/src/store/GraphStore.ts:375

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

Defined in: packages/graph/src/store/GraphStore.ts:598

#### Parameters

##### nodes

readonly [`GraphNode`](../interfaces/GraphNode.md)\<`unknown`\>[]

#### Returns

`void`

***

### ancestorsOf()

> **ancestorsOf**(`id`): `IterableIterator`\<`string`\>

Defined in: packages/graph/src/store/GraphStore.ts:276

#### Parameters

##### id

`string`

#### Returns

`IterableIterator`\<`string`\>

***

### batch()

> **batch**\<`T`\>(`fn`): `T`

Defined in: packages/graph/src/store/GraphStore.ts:616

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

Defined in: packages/graph/src/store/GraphStore.ts:258

#### Parameters

##### parentId

`string`

#### Returns

`IterableIterator`\<`string`\>

***

### clear()

> **clear**(): `void`

Defined in: packages/graph/src/store/GraphStore.ts:640

Wipe all data. Cancels any pending flush.

#### Returns

`void`

***

### compact()

> **compact**(): `void`

Defined in: packages/graph/src/store/GraphStore.ts:665

Reclaim tombstoned slots. Invalidates any external code that cached
slot indices. Renderer batch buffers etc. must invalidate first.

#### Returns

`void`

***

### descendantsOf()

> **descendantsOf**(`id`): `IterableIterator`\<`string`\>

Defined in: packages/graph/src/store/GraphStore.ts:264

#### Parameters

##### id

`string`

#### Returns

`IterableIterator`\<`string`\>

***

### edgeCount()

> **edgeCount**(): `number`

Defined in: packages/graph/src/store/GraphStore.ts:145

Number of live (non-tombstoned) edges.

#### Returns

`number`

***

### edges()

> **edges**(): `IterableIterator`\<[`GraphEdge`](../interfaces/GraphEdge.md)\<`unknown`\>\>

Defined in: packages/graph/src/store/GraphStore.ts:179

#### Returns

`IterableIterator`\<[`GraphEdge`](../interfaces/GraphEdge.md)\<`unknown`\>\>

***

### edgesOf()

> **edgesOf**(`nodeId`, `dir?`): `IterableIterator`\<[`GraphEdge`](../interfaces/GraphEdge.md)\<`unknown`\>\>

Defined in: packages/graph/src/store/GraphStore.ts:203

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

Defined in: packages/graph/src/store/GraphStore.ts:634

Drain any pending events. Cancels the RAF-scheduled flush (frame mode).
In sync mode this still works — handy for forcing the TTL eviction sweep
even if no mutation has happened since the last flush.

#### Returns

`void`

***

### getEdge()

> **getEdge**\<`D`\>(`id`): [`GraphEdge`](../interfaces/GraphEdge.md)\<`D`\>

Defined in: packages/graph/src/store/GraphStore.ts:167

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

Defined in: packages/graph/src/store/GraphStore.ts:157

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

Defined in: packages/graph/src/store/GraphStore.ts:286

#### Parameters

##### id

`string`

#### Returns

[`Vec2`](../interfaces/Vec2.md)

***

### hasEdge()

> **hasEdge**(`id`): `boolean`

Defined in: packages/graph/src/store/GraphStore.ts:153

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### hasNode()

> **hasNode**(`id`): `boolean`

Defined in: packages/graph/src/store/GraphStore.ts:149

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### inDegree()

> **inDegree**(`nodeId`): `number`

Defined in: packages/graph/src/store/GraphStore.ts:191

#### Parameters

##### nodeId

`string`

#### Returns

`number`

***

### isPinned()

> **isPinned**(`id`): `boolean`

Defined in: packages/graph/src/store/GraphStore.ts:357

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### neighborsOf()

> **neighborsOf**(`nodeId`, `dir?`): `IterableIterator`\<`string`\>

Defined in: packages/graph/src/store/GraphStore.ts:229

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

Defined in: packages/graph/src/store/GraphStore.ts:140

Number of live (non-tombstoned) nodes.

#### Returns

`number`

***

### nodes()

> **nodes**(): `IterableIterator`\<[`GraphNode`](../interfaces/GraphNode.md)\<`unknown`\>\>

Defined in: packages/graph/src/store/GraphStore.ts:172

#### Returns

`IterableIterator`\<[`GraphNode`](../interfaces/GraphNode.md)\<`unknown`\>\>

***

### outDegree()

> **outDegree**(`nodeId`): `number`

Defined in: packages/graph/src/store/GraphStore.ts:185

#### Parameters

##### nodeId

`string`

#### Returns

`number`

***

### parentOf()

> **parentOf**(`id`): `string`

Defined in: packages/graph/src/store/GraphStore.ts:254

#### Parameters

##### id

`string`

#### Returns

`string`

***

### pinnedIds()

> **pinnedIds**(): `IterableIterator`\<`string`\>

Defined in: packages/graph/src/store/GraphStore.ts:363

#### Returns

`IterableIterator`\<`string`\>

***

### removeEdge()

> **removeEdge**(`id`): `void`

Defined in: packages/graph/src/store/GraphStore.ts:578

#### Parameters

##### id

`string`

#### Returns

`void`

***

### removeNode()

> **removeNode**(`id`, `opts?`): `void`

Defined in: packages/graph/src/store/GraphStore.ts:447

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

Defined in: packages/graph/src/store/GraphStore.ts:343

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

Defined in: packages/graph/src/store/GraphStore.ts:296

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

Defined in: packages/graph/src/store/GraphStore.ts:318

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

Defined in: packages/graph/src/store/GraphStore.ts:541

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

Defined in: packages/graph/src/store/GraphStore.ts:393

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

Defined in: packages/graph/src/store/GraphStore.ts:532

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

Defined in: packages/graph/src/store/GraphStore.ts:384

Add-or-merge. Streaming-friendly path.

#### Type Parameters

##### D

`D`

#### Parameters

##### node

[`GraphNode`](../interfaces/GraphNode.md)\<`D`\>

#### Returns

`void`
