# Function: createMemoryStore()

> **createMemoryStore**\<`T`\>(`initial`): [`ReactiveStore`](../../../canvas/src/interfaces/ReactiveStore.md)\<`T`\>

A dependency-free, in-memory [ReactiveStore](../../../canvas/src/interfaces/ReactiveStore.md) — the reference adapter.

Imports **no** backend library, so it proves the [ReactiveStore](../../../canvas/src/interfaces/ReactiveStore.md) port is
real and swappable (the zustand adapter must behave identically). Also the
lightest backend for tests.

## Type Parameters

### T

`T` *extends* `object`

## Parameters

### initial

`T`

## Returns

[`ReactiveStore`](../../../canvas/src/interfaces/ReactiveStore.md)\<`T`\>
