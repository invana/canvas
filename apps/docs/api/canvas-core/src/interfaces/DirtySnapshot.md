# Interface: DirtySnapshot\<TBucket\>

The snapshot handed to the flush handler. `buckets` is keyed by bucket name →
the Set of dirty ids this frame (untouched buckets are absent). `rebuildAll` is
the set of buckets flagged via [DirtyBatcher.markAll](../classes/DirtyBatcher.md#markall) — for those, iterate
the underlying data, not the per-id Set.

## Type Parameters

### TBucket

`TBucket` *extends* `string` = `string`

## Properties

### buckets

> `readonly` **buckets**: `ReadonlyMap`\<`TBucket`, `ReadonlySet`\<`string`\>\>

***

### rebuildAll

> `readonly` **rebuildAll**: `ReadonlySet`\<`TBucket`\>
