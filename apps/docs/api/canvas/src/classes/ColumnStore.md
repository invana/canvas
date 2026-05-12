# Class: ColumnStore\<TSchema\>

Defined in: [packages/canvas/src/state/ColumnStore.ts:131](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/state/ColumnStore.ts#L131)

## Type Parameters

### TSchema

`TSchema` *extends* [`ColumnSchema`](../type-aliases/ColumnSchema.md) = [`ColumnSchema`](../type-aliases/ColumnSchema.md)

## Constructors

### Constructor

> **new ColumnStore**\<`TSchema`\>(`schema`, `opts?`): `ColumnStore`\<`TSchema`\>

Defined in: [packages/canvas/src/state/ColumnStore.ts:155](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/state/ColumnStore.ts#L155)

#### Parameters

##### schema

`TSchema`

##### opts?

[`ColumnStoreOptions`](../interfaces/ColumnStoreOptions.md) = `{}`

#### Returns

`ColumnStore`\<`TSchema`\>

## Accessors

### capacity

#### Get Signature

> **get** **capacity**(): `number`

Defined in: [packages/canvas/src/state/ColumnStore.ts:180](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/state/ColumnStore.ts#L180)

Current allocated capacity. Grows automatically when filled.

##### Returns

`number`

***

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: [packages/canvas/src/state/ColumnStore.ts:175](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/state/ColumnStore.ts#L175)

Number of items currently stored.

##### Returns

`number`

***

### version

#### Get Signature

> **get** **version**(): `number`

Defined in: [packages/canvas/src/state/ColumnStore.ts:185](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/state/ColumnStore.ts#L185)

Mutation counter — bumps on any change. Subscribers diff this.

##### Returns

`number`

## Methods

### add()

> **add**(`id`, `row`): `number`

Defined in: [packages/canvas/src/state/ColumnStore.ts:244](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/state/ColumnStore.ts#L244)

Add a new item. Throws if `id` already exists.
Reuses a recycled slot when available; otherwise extends (and grows).

#### Parameters

##### id

`string`

##### row

[`RowOf`](../type-aliases/RowOf.md)\<`TSchema`\>

#### Returns

`number`

***

### addBulk()

> **addBulk**(`items`): `void`

Defined in: [packages/canvas/src/state/ColumnStore.ts:262](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/state/ColumnStore.ts#L262)

Bulk add. Grows once if needed (cheaper than N individual grows).
Throws if any id already exists.

#### Parameters

##### items

readonly `object`[]

#### Returns

`void`

***

### clear()

> **clear**(): `void`

Defined in: [packages/canvas/src/state/ColumnStore.ts:348](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/state/ColumnStore.ts#L348)

Drop all items and recycled slots. Keeps the current capacity (no shrink).
Cheap reset for repopulating from a feed.

#### Returns

`void`

***

### column()

> **column**\<`K`\>(`name`): [`ColumnArray`](../type-aliases/ColumnArray.md)\<`TSchema`\[`K`\]\>

Defined in: [packages/canvas/src/state/ColumnStore.ts:216](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/state/ColumnStore.ts#L216)

Direct access to a column's TypedArray. **Holds a stable reference until
the column is grown** (then the underlying buffer is replaced).

Use the version field to detect grow events:
  const v = store.version; const col = store.column('x');
  // if (store.version !== v) the col reference may be stale

Renderer fast path: cache `column(name)` and `slot(id)` once per frame
and write directly. Bump `touch()` after batched fast-path writes so
subscribers know.

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### name

`K`

#### Returns

[`ColumnArray`](../type-aliases/ColumnArray.md)\<`TSchema`\[`K`\]\>

***

### forEach()

> **forEach**(`cb`): `void`

Defined in: [packages/canvas/src/state/ColumnStore.ts:363](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/state/ColumnStore.ts#L363)

Iterate over (id, slot) pairs in insertion order of currently-live ids.
O(idIndex.size) — does NOT walk holes.

#### Parameters

##### cb

(`id`, `slot`) => `void`

#### Returns

`void`

***

### get()

> **get**\<`K`\>(`id`, `name`): [`ColumnValue`](../type-aliases/ColumnValue.md)\<`TSchema`\[`K`\]\>

Defined in: [packages/canvas/src/state/ColumnStore.ts:221](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/state/ColumnStore.ts#L221)

Read a single value. ~50 ns: Map.get + TypedArray read.

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### id

`string`

##### name

`K`

#### Returns

[`ColumnValue`](../type-aliases/ColumnValue.md)\<`TSchema`\[`K`\]\>

***

### has()

> **has**(`id`): `boolean`

Defined in: [packages/canvas/src/state/ColumnStore.ts:190](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/state/ColumnStore.ts#L190)

True iff `id` has been added.

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### idAt()

> **idAt**(`slot`): `string`

Defined in: [packages/canvas/src/state/ColumnStore.ts:200](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/state/ColumnStore.ts#L200)

Returns the id at `slot`, or `undefined` if the slot is free.

#### Parameters

##### slot

`number`

#### Returns

`string`

***

### ids()

> **ids**(): `IterableIterator`\<`string`\>

Defined in: [packages/canvas/src/state/ColumnStore.ts:368](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/state/ColumnStore.ts#L368)

Iterator over live ids only.

#### Returns

`IterableIterator`\<`string`\>

***

### remove()

> **remove**(`id`): `void`

Defined in: [packages/canvas/src/state/ColumnStore.ts:312](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/state/ColumnStore.ts#L312)

Remove an item. Recycles the slot. No-op if id doesn't exist.

#### Parameters

##### id

`string`

#### Returns

`void`

***

### removeBulk()

> **removeBulk**(`ids`): `void`

Defined in: [packages/canvas/src/state/ColumnStore.ts:324](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/state/ColumnStore.ts#L324)

Bulk remove.

#### Parameters

##### ids

readonly `string`[]

#### Returns

`void`

***

### row()

> **row**(`id`): [`RowOf`](../type-aliases/RowOf.md)\<`TSchema`\>

Defined in: [packages/canvas/src/state/ColumnStore.ts:228](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/state/ColumnStore.ts#L228)

Materialise a full row by id. Allocates an object — avoid in hot loops.

#### Parameters

##### id

`string`

#### Returns

[`RowOf`](../type-aliases/RowOf.md)\<`TSchema`\>

***

### set()

> **set**\<`K`\>(`id`, `name`, `value`): `void`

Defined in: [packages/canvas/src/state/ColumnStore.ts:288](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/state/ColumnStore.ts#L288)

Set a single field. ~50 ns: Map.get + TypedArray write.
No-op if id doesn't exist.

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### id

`string`

##### name

`K`

##### value

[`ColumnValue`](../type-aliases/ColumnValue.md)\<`TSchema`\[`K`\]\>

#### Returns

`void`

***

### slot()

> **slot**(`id`): `number`

Defined in: [packages/canvas/src/state/ColumnStore.ts:195](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/state/ColumnStore.ts#L195)

Returns the slot for `id`, or `undefined`. Useful for the renderer fast path.

#### Parameters

##### id

`string`

#### Returns

`number`

***

### touch()

> **touch**(): `void`

Defined in: [packages/canvas/src/state/ColumnStore.ts:340](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/state/ColumnStore.ts#L340)

Mark the store as mutated without actually changing anything via the API.
Use this after batches of fast-path writes via `column(...)[slot] = ...`
so version-bump-driven subscribers know to re-read.

#### Returns

`void`

***

### update()

> **update**(`id`, `partial`): `void`

Defined in: [packages/canvas/src/state/ColumnStore.ts:298](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/state/ColumnStore.ts#L298)

Update multiple fields of one item in one call. Avoids N version bumps.

#### Parameters

##### id

`string`

##### partial

`Partial`\<[`RowOf`](../type-aliases/RowOf.md)\<`TSchema`\>\>

#### Returns

`void`
