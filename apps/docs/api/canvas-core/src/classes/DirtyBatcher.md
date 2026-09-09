# Class: DirtyBatcher\<TBucket\>

## Type Parameters

### TBucket

`TBucket` *extends* `string` = `string`

## Constructors

### Constructor

> **new DirtyBatcher**\<`TBucket`\>(): `DirtyBatcher`\<`TBucket`\>

#### Returns

`DirtyBatcher`\<`TBucket`\>

## Methods

### bucketSize()

> **bucketSize**(`bucket`): `number`

Number of dirty ids in a bucket (0 if never touched). Debug.

#### Parameters

##### bucket

`TBucket`

#### Returns

`number`

***

### flush()

> **flush**(): [`DirtySnapshot`](../interfaces/DirtySnapshot.md)\<`TBucket`\>

Swap buffers and return the previous frame's snapshot. The returned Sets are
still owned by the batcher — **do not retain references past the flush call**;
the next `flush()` reuses and clears them.

#### Returns

[`DirtySnapshot`](../interfaces/DirtySnapshot.md)\<`TBucket`\>

***

### hasPending()

> **hasPending**(): `boolean`

Cheap check the tick uses to decide whether to call [flush](#flush).

#### Returns

`boolean`

***

### isRebuildAll()

> **isRebuildAll**(`bucket`): `boolean`

True iff the bucket is flagged for rebuild this frame. Debug.

#### Parameters

##### bucket

`TBucket`

#### Returns

`boolean`

***

### mark()

> **mark**(`bucket`, `id`): `void`

Mark a single id dirty in a bucket. O(1); bucket Sets are created lazily + reused.

#### Parameters

##### bucket

`TBucket`

##### id

`string`

#### Returns

`void`

***

### markAll()

> **markAll**(`bucket`): `void`

Flag a whole bucket for rebuild (theme change, LOD swap, wholesale replace).

#### Parameters

##### bucket

`TBucket`

#### Returns

`void`

***

### reset()

> **reset**(): `void`

Drop both buffers. Call on unmount; usable again afterwards.

#### Returns

`void`
