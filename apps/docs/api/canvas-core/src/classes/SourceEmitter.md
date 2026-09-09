# Class: SourceEmitter\<M\>

A scoped [EventEmitter](EventEmitter.md) stamped with an [EventSource](../interfaces/EventSource.md). When connected
to a bus via [setBus](#setbus), every emit is **also** forwarded to the bus tap as a
structured envelope — so a store/layer/behaviour's own events reach the
canvas-wide tap (telemetry / collaboration) without each one re-plumbing.

Local `on(...)` subscribers still get the raw typed payload as usual.

## Extends

- [`EventEmitter`](EventEmitter.md)\<`M`\>

## Type Parameters

### M

`M` *extends* `object`

## Constructors

### Constructor

> **new SourceEmitter**\<`M`\>(`source`): `SourceEmitter`\<`M`\>

#### Parameters

##### source

[`EventSource`](../interfaces/EventSource.md)

#### Returns

`SourceEmitter`\<`M`\>

#### Overrides

[`EventEmitter`](EventEmitter.md).[`constructor`](EventEmitter.md#constructor)

## Properties

### source

> `readonly` **source**: [`EventSource`](../interfaces/EventSource.md)

## Methods

### emit()

> **emit**\<`K`\>(`type`, `payload`): `void`

Emit to all listeners of `type` (snapshot, so handlers may unsubscribe).

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### type

`K`

##### payload

`M`\[`K`\]

#### Returns

`void`

#### Overrides

[`EventEmitter`](EventEmitter.md).[`emit`](EventEmitter.md#emit)

***

### listenerCount()

> **listenerCount**\<`K`\>(`type`): `number`

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### type

`K`

#### Returns

`number`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`listenerCount`](EventEmitter.md#listenercount)

***

### off()

> **off**\<`K`\>(`type`, `listener`): `void`

Unsubscribe a listener.

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### type

`K`

##### listener

[`Listener`](../type-aliases/Listener.md)\<`M`\[`K`\]\>

#### Returns

`void`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`off`](EventEmitter.md#off)

***

### on()

> **on**\<`K`\>(`type`, `listener`): () => `void`

Subscribe; returns an unsubscribe.

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### type

`K`

##### listener

[`Listener`](../type-aliases/Listener.md)\<`M`\[`K`\]\>

#### Returns

() => `void`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`on`](EventEmitter.md#on)

***

### once()

> **once**\<`K`\>(`type`, `listener`): () => `void`

Subscribe for a single emission.

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### type

`K`

##### listener

[`Listener`](../type-aliases/Listener.md)\<`M`\[`K`\]\>

#### Returns

() => `void`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`once`](EventEmitter.md#once)

***

### removeAllListeners()

> **removeAllListeners**(): `void`

#### Returns

`void`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`removeAllListeners`](EventEmitter.md#removealllisteners)

***

### setBus()

> **setBus**(`bus`): `void`

Connect (or disconnect with `null`/`undefined`) this emitter's stream to a bus tap.

#### Parameters

##### bus

[`CanvasEventBus`](CanvasEventBus.md)

#### Returns

`void`
