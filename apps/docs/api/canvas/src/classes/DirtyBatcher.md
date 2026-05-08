# Class: DirtyBatcher\<TBucket\>

Defined in: [packages/canvas/src/state/DirtyBatcher.ts:67](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/state/DirtyBatcher.ts#L67)

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

Defined in: [packages/canvas/src/state/DirtyBatcher.ts:157](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/state/DirtyBatcher.ts#L157)

Number of dirty ids in a bucket. Returns 0 if bucket has never been touched.

#### Parameters

##### bucket

`TBucket`

#### Returns

`number`

***

### flush()

> **flush**(): [`DirtySnapshot`](../interfaces/DirtySnapshot.md)\<`TBucket`\>

Defined in: [packages/canvas/src/state/DirtyBatcher.ts:121](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/state/DirtyBatcher.ts#L121)

Swap buffers and return the previous frame's snapshot. After this call:
  - The returned snapshot is stable for the duration of the consumer's
    handler (any new marks land in the freshly-cleared other buffer).
  - `hasPending()` returns false until the next mark.

The handed-out Sets are still owned by the batcher — the consumer must
**not retain references past the flush call**. The next `flush()` will
reuse and clear them.

#### Returns

[`DirtySnapshot`](../interfaces/DirtySnapshot.md)\<`TBucket`\>

***

### hasPending()

> **hasPending**(): `boolean`

Defined in: [packages/canvas/src/state/DirtyBatcher.ts:107](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/state/DirtyBatcher.ts#L107)

Cheap check the canvas tick uses to decide whether to call `flush()`.

#### Returns

`boolean`

***

### isRebuildAll()

> **isRebuildAll**(`bucket`): `boolean`

Defined in: [packages/canvas/src/state/DirtyBatcher.ts:162](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/state/DirtyBatcher.ts#L162)

True iff the bucket has been flagged for rebuild this frame.

#### Parameters

##### bucket

`TBucket`

#### Returns

`boolean`

***

### mark()

> **mark**(`bucket`, `id`): `void`

Defined in: [packages/canvas/src/state/DirtyBatcher.ts:84](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/state/DirtyBatcher.ts#L84)

Mark a single id as dirty in a bucket. O(1), no allocation in steady state.

Bucket Sets are created lazily on first mark and reused thereafter.
If the bucket is currently flagged `markAll`, this call is redundant
(consumer will iterate all data anyway) but cheap and harmless.

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

Defined in: [packages/canvas/src/state/DirtyBatcher.ts:101](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/state/DirtyBatcher.ts#L101)

Flag a whole bucket as needing rebuild. The consumer's flush handler
should iterate its full data set for this bucket, ignoring the per-id Set.

Use for bulk events: theme change, LOD swap, "everything moved",
data feed wholesale replace.

#### Parameters

##### bucket

`TBucket`

#### Returns

`void`

***

### reset()

> **reset**(): `void`

Defined in: [packages/canvas/src/state/DirtyBatcher.ts:146](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/state/DirtyBatcher.ts#L146)

Drop both buffers. Call on layer unmount. After reset(), the batcher is
usable again from a clean state.

#### Returns

`void`
