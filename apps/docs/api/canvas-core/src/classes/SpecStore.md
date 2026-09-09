# Class: SpecStore\<T\>

## Type Parameters

### T

`T` *extends* `object` = `object`

## Constructors

### Constructor

> **new SpecStore**\<`T`\>(): `SpecStore`\<`T`\>

#### Returns

`SpecStore`\<`T`\>

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

##### Returns

`number`

## Methods

### clear()

> **clear**(): `void`

Drop every spec. Emits one flush listing all ids as removed.

#### Returns

`void`

***

### delete()

> **delete**(`id`): `void`

#### Parameters

##### id

`string`

#### Returns

`void`

***

### entries()

> **entries**(): `IterableIterator`\<\[`string`, `T`\]\>

#### Returns

`IterableIterator`\<\[`string`, `T`\]\>

***

### flush()

> **flush**(): `void`

Emit the pending delta, if any. Safe to call when nothing is dirty.

#### Returns

`void`

***

### get()

> **get**(`id`): `T`

#### Parameters

##### id

`string`

#### Returns

`T`

***

### has()

> **has**(`id`): `boolean`

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### ids()

> **ids**(): `IterableIterator`\<`string`\>

#### Returns

`IterableIterator`\<`string`\>

***

### onFlush()

> **onFlush**(`listener`): () => `void`

#### Parameters

##### listener

(`e`) => `void`

#### Returns

() => `void`

***

### patch()

> **patch**(`id`, `partial`): `boolean`

Shallow-merge `partial` over the stored spec. Returns `false` when `id` is
unknown, so a caller can fall back to [set](#set) with a full spec.

#### Parameters

##### id

`string`

##### partial

`Partial`\<`T`\>

#### Returns

`boolean`

***

### set()

> **set**(`id`, `spec`): `void`

Publish (or replace) the spec for `id`.

#### Parameters

##### id

`string`

##### spec

`T`

#### Returns

`void`

***

### setFlushMode()

> **setFlushMode**(`mode`): `void`

Choose **when** a coalesced flush fires. `'manual'` disarms auto-flush so the
engine's single rAF drives it — which is how the renderer stays on one clock.

#### Parameters

##### mode

[`FlushMode`](../type-aliases/FlushMode.md)

#### Returns

`void`
