# Interface: StateCell\<T\>

A minimal state cell an adapter supplies — the only thing that differs between
backends. `createStoreFromCell` builds the full [ReactiveStore](ReactiveStore.md) on top, so
the change/patch/batch logic is shared and identical across adapters.

## Type Parameters

### T

`T`

## Methods

### get()

> **get**(): `T`

#### Returns

`T`

***

### set()

> **set**(`next`): `void`

Replace state; must notify state listeners with (next, prev).

#### Parameters

##### next

`T`

#### Returns

`void`

***

### subscribe()

> **subscribe**(`listener`): () => `void`

#### Parameters

##### listener

(`state`, `prev`) => `void`

#### Returns

() => `void`
