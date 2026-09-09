# Function: createHistory()

> **createHistory**\<`T`\>(`store`, `opts?`): [`History`](../interfaces/History.md)

Inverse-patch undo/redo — it just **taps the change stream**. Every `update`
already carries its forward + inverse patches (immer `produceWithPatches`), so
undo = apply the inverse, redo = re-apply the forward. A `batch` records as one
step. (Under a Yjs backend this same surface delegates to Yjs's `UndoManager`;
the API is identical — M5.)

## Type Parameters

### T

`T`

## Parameters

### store

[`ReactiveStore`](../../../canvas/src/interfaces/ReactiveStore.md)\<`T`\>

### opts?

#### limit?

`number`

## Returns

[`History`](../interfaces/History.md)
