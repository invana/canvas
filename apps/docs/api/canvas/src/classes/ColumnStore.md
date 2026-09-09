# Class: ColumnStore\<TSchema\>

## Type Parameters

### TSchema

`TSchema` *extends* [`ColumnSchema`](../type-aliases/ColumnSchema.md) = [`ColumnSchema`](../type-aliases/ColumnSchema.md)

## Constructors

### Constructor

> **new ColumnStore**\<`TSchema`\>(`schema`, `opts?`): `ColumnStore`\<`TSchema`\>

#### Parameters

##### schema

`TSchema`

##### opts?

[`ColumnStoreOptions`](../interfaces/ColumnStoreOptions.md)

#### Returns

`ColumnStore`\<`TSchema`\>

## Accessors

### capacity

#### Get Signature

> **get** **capacity**(): `number`

Current allocated capacity. Grows automatically when filled.

##### Returns

`number`

***

### size

#### Get Signature

> **get** **size**(): `number`

Number of items currently stored.

##### Returns

`number`

***

### version

#### Get Signature

> **get** **version**(): `number`

Mutation counter — bumps on any change. Subscribers diff this.

##### Returns

`number`

## Methods

### add()

> **add**(`id`, `row`): `number`

Add a new item. Throws if `id` already exists. Reuses a recycled slot when available.

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

Bulk add. Grows once if needed (cheaper than N individual grows). Throws on duplicate id.

#### Parameters

##### items

readonly `object`[]

#### Returns

`void`

***

### clear()

> **clear**(): `void`

Drop all items + recycled slots. Keeps capacity (no shrink).

#### Returns

`void`

***

### column()

> **column**\<`K`\>(`name`): [`ColumnArray`](../type-aliases/ColumnArray.md)\<`TSchema`\[`K`\]\>

Direct access to a column's TypedArray. **Holds a stable reference until the
column is grown** (then the buffer is replaced). Use [version](#version) to detect
grow events. Renderer/layout fast path: cache `column(name)` + `slot(id)` once
per frame and write directly, then call [touch](#touch).

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

Iterate (id, slot) for currently-live ids. O(size) — does not walk holes.

#### Parameters

##### cb

(`id`, `slot`) => `void`

#### Returns

`void`

***

### get()

> **get**\<`K`\>(`id`, `name`): [`ColumnValue`](../type-aliases/ColumnValue.md)\<`TSchema`\[`K`\]\>

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

True iff `id` has been added.

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### idAt()

> **idAt**(`slot`): `string`

Returns the id at `slot`, or `undefined` if the slot is free.

#### Parameters

##### slot

`number`

#### Returns

`string`

***

### ids()

> **ids**(): `IterableIterator`\<`string`\>

Iterator over live ids only.

#### Returns

`IterableIterator`\<`string`\>

***

### remove()

> **remove**(`id`): `void`

Remove an item. Recycles the slot. No-op if id doesn't exist.

#### Parameters

##### id

`string`

#### Returns

`void`

***

### removeBulk()

> **removeBulk**(`ids`): `void`

Bulk remove.

#### Parameters

##### ids

readonly `string`[]

#### Returns

`void`

***

### row()

> **row**(`id`): [`RowOf`](../type-aliases/RowOf.md)\<`TSchema`\>

Materialise a full row by id. Allocates an object — avoid in hot loops.

#### Parameters

##### id

`string`

#### Returns

[`RowOf`](../type-aliases/RowOf.md)\<`TSchema`\>

***

### set()

> **set**\<`K`\>(`id`, `name`, `value`): `void`

Set a single field. ~50 ns. No-op if id doesn't exist.

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

Returns the slot for `id`, or `undefined`. Useful for the renderer fast path.

#### Parameters

##### id

`string`

#### Returns

`number`

***

### touch()

> **touch**(): `void`

Mark the store as mutated without an API change — call after batches of
fast-path writes via `column(...)[slot] = ...` so version-driven subscribers
re-read.

#### Returns

`void`

***

### update()

> **update**(`id`, `partial`): `void`

Update multiple fields of one item in one call (one version bump).

#### Parameters

##### id

`string`

##### partial

`Partial`\<[`RowOf`](../type-aliases/RowOf.md)\<`TSchema`\>\>

#### Returns

`void`
