# Function: createStoreFromCell()

> **createStoreFromCell**\<`T`\>(`cell`): [`ReactiveStore`](../../../canvas/src/interfaces/ReactiveStore.md)\<`T`\>

Build a full [ReactiveStore](../../../canvas/src/interfaces/ReactiveStore.md) on top of a [StateCell](../interfaces/StateCell.md). This is where
the change/patch/batch logic lives — shared by every adapter (memory, zustand,
later Yjs), so they behave identically and only the state container differs.

## Type Parameters

### T

`T`

## Parameters

### cell

[`StateCell`](../interfaces/StateCell.md)\<`T`\>

## Returns

[`ReactiveStore`](../../../canvas/src/interfaces/ReactiveStore.md)\<`T`\>
