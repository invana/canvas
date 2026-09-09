# Function: createReactiveStore()

> **createReactiveStore**\<`T`\>(`initial`): [`ReactiveStore`](../../../canvas/src/interfaces/ReactiveStore.md)\<`T`\>

The zustand-backed [ReactiveStore](../../../canvas/src/interfaces/ReactiveStore.md) adapter — **the only file in the
package allowed to import zustand** (lint-enforceable). State container +
subscription come from zustand vanilla; the declarative-patch / change-stream /
batch logic is the shared [createStoreFromCell](createStoreFromCell.md) core, so this behaves
identically to [createMemoryStore](createMemoryStore.md) (port parity).

## Type Parameters

### T

`T` *extends* `object`

## Parameters

### initial

`T`

## Returns

[`ReactiveStore`](../../../canvas/src/interfaces/ReactiveStore.md)\<`T`\>
