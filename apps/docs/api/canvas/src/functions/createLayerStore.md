# Function: createLayerStore()

## Call Signature

> **createLayerStore**\<`T`\>(`initial`, `opts?`): [`Store`](../type-aliases/Store.md)\<`T`\>

Defined in: [canvas/src/state/Store.ts:138](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/state/Store.ts#L138)

Create a `Store<T>` with our standard middleware stack.

Pass either an initial state object, or a creator function that takes the
zustand `set` / `get` (already wrapped with immer) and returns initial state.
The creator form is useful when initial state needs to reference itself or
close over imperative setup; the object form is the common case.

### Type Parameters

#### T

`T` *extends* `object`

### Parameters

#### initial

`T`

#### opts?

[`CreateLayerStoreOptions`](../interfaces/CreateLayerStoreOptions.md)

### Returns

[`Store`](../type-aliases/Store.md)\<`T`\>

## Call Signature

> **createLayerStore**\<`T`\>(`creator`, `opts?`): [`Store`](../type-aliases/Store.md)\<`T`\>

Defined in: [canvas/src/state/Store.ts:142](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/state/Store.ts#L142)

Create a `Store<T>` with our standard middleware stack.

Pass either an initial state object, or a creator function that takes the
zustand `set` / `get` (already wrapped with immer) and returns initial state.
The creator form is useful when initial state needs to reference itself or
close over imperative setup; the object form is the common case.

### Type Parameters

#### T

`T` *extends* `object`

### Parameters

#### creator

(`set`, `get`) => `T`

#### opts?

[`CreateLayerStoreOptions`](../interfaces/CreateLayerStoreOptions.md)

### Returns

[`Store`](../type-aliases/Store.md)\<`T`\>
