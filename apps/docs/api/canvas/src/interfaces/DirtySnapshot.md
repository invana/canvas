# Interface: DirtySnapshot\<TBucket\>

Defined in: [packages/canvas/src/state/DirtyBatcher.ts:54](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/state/DirtyBatcher.ts#L54)

The frozen snapshot handed to the flush handler.

`buckets` is a ReadonlyMap keyed by bucket name; each value is the Set of
dirty ids for that bucket this frame. Buckets that have never been touched
are absent (use `snap.buckets.get(bucket) ?? EMPTY_SET` to handle missing).

`rebuildAll` is the Set of buckets the consumer marked with `markAll()`.
For those buckets, the consumer should iterate the underlying data
(not the per-id Set) — usually meaning "rebuild everything in this category."

## Type Parameters

### TBucket

`TBucket` *extends* `string` = `string`

## Properties

### buckets

> `readonly` **buckets**: `ReadonlyMap`\<`TBucket`, `ReadonlySet`\<`string`\>\>

Defined in: [packages/canvas/src/state/DirtyBatcher.ts:55](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/state/DirtyBatcher.ts#L55)

***

### rebuildAll

> `readonly` **rebuildAll**: `ReadonlySet`\<`TBucket`\>

Defined in: [packages/canvas/src/state/DirtyBatcher.ts:56](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/state/DirtyBatcher.ts#L56)
