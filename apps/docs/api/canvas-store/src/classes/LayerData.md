# Class: LayerData

## Constructors

### Constructor

> **new LayerData**(): `LayerData`

#### Returns

`LayerData`

## Accessors

### counts

#### Get Signature

> **get** **counts**(): `object`

##### Returns

`object`

###### annotations

> **annotations**: `number`

###### edges

> **edges**: `number`

###### groups

> **groups**: `number`

###### nodes

> **nodes**: `number`

***

### positions

#### Get Signature

> **get** **positions**(): [`ColumnStore`](../../../canvas/src/classes/ColumnStore.md)\<[`PosSchema`](../type-aliases/PosSchema.md)\>

Direct access to the typed-array position columns. Hold the ref + a slot once
and write in place (~10 ns/slot), then call [touchPositions](#touchpositions) to emit one
coalesced moved flush. `positions.slot(id)` maps id → column index.

##### Returns

[`ColumnStore`](../../../canvas/src/classes/ColumnStore.md)\<[`PosSchema`](../type-aliases/PosSchema.md)\>

***

### status

#### Get Signature

> **get** **status**(): [`QueryStatus`](../type-aliases/QueryStatus.md)

Current ingestion lifecycle status.

##### Returns

[`QueryStatus`](../type-aliases/QueryStatus.md)

## Methods

### addAnnotation()

> **addAnnotation**(`a`): `void`

#### Parameters

##### a

[`AnnotationRecord`](../interfaces/AnnotationRecord.md)

#### Returns

`void`

***

### addEdge()

> **addEdge**(`e`): `void`

#### Parameters

##### e

[`EdgeRecord`](../interfaces/EdgeRecord.md)

#### Returns

`void`

***

### addGroup()

> **addGroup**(`g`): `void`

#### Parameters

##### g

[`GroupRecord`](../interfaces/GroupRecord.md)

#### Returns

`void`

***

### addNode()

> **addNode**(`n`): `void`

#### Parameters

##### n

[`NodeRecord`](../interfaces/NodeRecord.md)

#### Returns

`void`

***

### annotation()

> **annotation**(`id`): [`AnnotationRecord`](../interfaces/AnnotationRecord.md)

#### Parameters

##### id

`string`

#### Returns

[`AnnotationRecord`](../interfaces/AnnotationRecord.md)

***

### annotations()

> **annotations**(): [`AnnotationRecord`](../interfaces/AnnotationRecord.md)[]

#### Returns

[`AnnotationRecord`](../interfaces/AnnotationRecord.md)[]

***

### applyPositions()

> **applyPositions**(`positions`): `void`

Bulk-apply layout output (positions) → marks nodes `moved` (transform-only).

#### Parameters

##### positions

`Iterable`\<\{ `id`: `string`; `x`: `number`; `y`: `number`; \}\>

#### Returns

`void`

***

### edge()

> **edge**(`id`): [`EdgeRecord`](../interfaces/EdgeRecord.md)

#### Parameters

##### id

`string`

#### Returns

[`EdgeRecord`](../interfaces/EdgeRecord.md)

***

### edges()

> **edges**(): [`EdgeRecord`](../interfaces/EdgeRecord.md)[]

#### Returns

[`EdgeRecord`](../interfaces/EdgeRecord.md)[]

***

### flush()

> **flush**(): `void`

Emit the pending delta now (the engine calls this once per frame).

#### Returns

`void`

***

### group()

> **group**(`id`): [`GroupRecord`](../interfaces/GroupRecord.md)

#### Parameters

##### id

`string`

#### Returns

[`GroupRecord`](../interfaces/GroupRecord.md)

***

### groups()

> **groups**(): [`GroupRecord`](../interfaces/GroupRecord.md)[]

#### Returns

[`GroupRecord`](../interfaces/GroupRecord.md)[]

***

### intents()

> **intents**(): readonly [`IntentLogEntry`](../interfaces/IntentLogEntry.md)[]

The data-mutation audit trail (one entry per named action).

#### Returns

readonly [`IntentLogEntry`](../interfaces/IntentLogEntry.md)[]

***

### logIntent()

> **logIntent**(`action`, `ids?`, `ts?`): `void`

Record a named data intent (audit / collab).

#### Parameters

##### action

`string`

##### ids?

readonly `string`[]

##### ts?

`number`

#### Returns

`void`

***

### node()

> **node**(`id`): [`NodeRecord`](../interfaces/NodeRecord.md)

Read a node, **stitching** its cold record with its hot `x`/`y` (when set).

#### Parameters

##### id

`string`

#### Returns

[`NodeRecord`](../interfaces/NodeRecord.md)

***

### nodeFlags()

> **nodeFlags**(`id`): `number`

Read a node's `flags` byte, or `undefined`.

#### Parameters

##### id

`string`

#### Returns

`number`

***

### nodes()

> **nodes**(): [`NodeRecord`](../interfaces/NodeRecord.md)[]

#### Returns

[`NodeRecord`](../interfaces/NodeRecord.md)[]

***

### on()

> **on**(`event`, `listener`): () => `void`

Subscribe to coalesced `flush` deltas. Returns an unsubscribe.

#### Parameters

##### event

`"flush"`

##### listener

(`e`) => `void`

#### Returns

() => `void`

***

### onFlush()

> **onFlush**(`listener`): () => `void`

[DataSource](../../../canvas/src/interfaces/DataSource.md) contract — alias for `on('flush', …)`.

#### Parameters

##### listener

(`e`) => `void`

#### Returns

() => `void`

***

### onStatus()

> **onStatus**(`listener`): () => `void`

Subscribe to status changes. Returns an unsubscribe.

#### Parameters

##### listener

(`status`) => `void`

#### Returns

() => `void`

***

### removeAnnotation()

> **removeAnnotation**(`id`): `void`

#### Parameters

##### id

`string`

#### Returns

`void`

***

### removeEdge()

> **removeEdge**(`id`): `void`

#### Parameters

##### id

`string`

#### Returns

`void`

***

### removeGroup()

> **removeGroup**(`id`): `void`

#### Parameters

##### id

`string`

#### Returns

`void`

***

### removeNode()

> **removeNode**(`id`): `void`

#### Parameters

##### id

`string`

#### Returns

`void`

***

### setData()

> **setData**(`input`): `void`

Replace the whole graph — diffs each collection into the next flush.

#### Parameters

##### input

[`GraphInput`](../interfaces/GraphInput.md)

#### Returns

`void`

***

### setFlushMode()

> **setFlushMode**(`mode`): `void`

Choose **when** a flush fires ([FlushMode](../../../canvas/src/type-aliases/FlushMode.md)). `'manual'` disarms any pending
auto-flush so only an explicit [flush](#flush) emits — used when the engine drives
every layer's data from one rAF loop.

#### Parameters

##### mode

[`FlushMode`](../../../canvas/src/type-aliases/FlushMode.md)

#### Returns

`void`

***

### setNodeFlag()

> **setNodeFlag**(`id`, `flag`, `on`): `void`

Toggle a [NODE\_FLAG](../variables/NODE_FLAG.md) bit (e.g. pinned/disabled) — marks the node `changed`.

#### Parameters

##### id

`string`

##### flag

`number`

##### on

`boolean`

#### Returns

`void`

***

### setPositionsBulk()

> **setPositionsBulk**(`ids`, `xy`): `void`

Bulk-apply layout output from an **interleaved** `[x0,y0,x1,y1,…]` buffer —
the layout fast path. Skips ids that aren't present; marks each `moved`.

#### Parameters

##### ids

readonly `string`[]

##### xy

`ArrayLike`\<`number`\>

#### Returns

`void`

***

### setStatus()

> **setStatus**(`status`): `void`

Set the ingestion status; notifies [onStatus](#onstatus) listeners on change.

#### Parameters

##### status

[`QueryStatus`](../type-aliases/QueryStatus.md)

#### Returns

`void`

***

### touchPositions()

> **touchPositions**(): `void`

After writing position slots directly via [positions](#positions), call this to bump
the version and emit **one** flush that marks every node `moved` (the per-tick
force-sim path — "everything moved", transform-only).

#### Returns

`void`

***

### updateAnnotation()

> **updateAnnotation**(`id`, `patch`): `void`

#### Parameters

##### id

`string`

##### patch

`Partial`\<[`AnnotationRecord`](../interfaces/AnnotationRecord.md)\>

#### Returns

`void`

***

### updateEdge()

> **updateEdge**(`id`, `patch`): `void`

#### Parameters

##### id

`string`

##### patch

`Partial`\<[`EdgeRecord`](../interfaces/EdgeRecord.md)\>

#### Returns

`void`

***

### updateGroup()

> **updateGroup**(`id`, `patch`): `void`

#### Parameters

##### id

`string`

##### patch

`Partial`\<[`GroupRecord`](../interfaces/GroupRecord.md)\>

#### Returns

`void`

***

### updateNode()

> **updateNode**(`id`, `patch`): `void`

#### Parameters

##### id

`string`

##### patch

`Partial`\<[`NodeRecord`](../interfaces/NodeRecord.md)\>

#### Returns

`void`
