# Interface: ReactiveStore\<T\>

The library-agnostic state contract. Consumers program against this — never
against zustand (or, later, Yjs) directly — so the backend stays swappable.

Two write forms, both declarative at the seam:
- an **immer recipe** `(draft) => void` that reads like a direct mutation, or
- a **deep-partial patch** object that is deep-merged in.

Either way `update` produces immer **patches + inverse patches**, which is what
lets telemetry, history/undo, and a future CRDT adapter all hang off the one seam.

## Type Parameters

### T

`T`

## Methods

### batch()

> **batch**(`run`, `action?`): `void`

Run `fn`'s writes as one coalesced change (one notification, one history step).

#### Parameters

##### run

() => `void`

##### action?

`string`

#### Returns

`void`

***

### getState()

> **getState**(): `T`

Current state snapshot (structurally shared; treat as immutable).

#### Returns

`T`

***

### subscribe()

> **subscribe**(`listener`): () => `void`

Fires on every change with the new + previous state.

#### Parameters

##### listener

(`state`, `prev`) => `void`

#### Returns

() => `void`

***

### subscribeChanges()

> **subscribeChanges**(`listener`): () => `void`

Richer change stream (action + immer patches) — for telemetry / history.

#### Parameters

##### listener

(`change`) => `void`

#### Returns

() => `void`

***

### update()

> **update**(`update`, `action?`): `void`

Apply a recipe or a deep-partial patch, with an optional named action.

#### Parameters

##### update

[`Update`](../type-aliases/Update.md)\<`T`\>

##### action?

`string`

#### Returns

`void`
