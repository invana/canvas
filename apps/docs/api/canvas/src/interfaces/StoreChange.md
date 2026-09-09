# Interface: StoreChange\<T\>

What a change carries — the load-bearing payload for telemetry/history/CRDT.

## Type Parameters

### T

`T`

## Properties

### action?

> `optional` **action?**: `string`

***

### durationMs?

> `optional` **durationMs?**: `number`

Wall-clock ms the update/batch took (produce + commit) — telemetry / tracing.

***

### inverse

> **inverse**: [`Patch`](../../../canvas-store/src/interfaces/Patch.md)[]

immer inverse patches (apply to `state` → `prev` — i.e. undo).

***

### patches

> **patches**: [`Patch`](../../../canvas-store/src/interfaces/Patch.md)[]

immer forward patches (apply to `prev` → `state`).

***

### prev

> **prev**: `T`

***

### state

> **state**: `T`
