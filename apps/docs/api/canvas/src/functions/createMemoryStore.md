# Function: createMemoryStore()

> **createMemoryStore**\<`T`\>(`initial`): [`ReactiveStore`](../interfaces/ReactiveStore.md)\<`T`\>

A dependency-free, in-memory [ReactiveStore](../interfaces/ReactiveStore.md) — the reference adapter.

Imports **no** backend library, so it proves the [ReactiveStore](../interfaces/ReactiveStore.md) port is
real and swappable (the zustand adapter must behave identically). Also the
lightest backend for tests.

## Type Parameters

### T

`T` *extends* `object`

## Parameters

### initial

`T`

## Returns

[`ReactiveStore`](../interfaces/ReactiveStore.md)\<`T`\>
