# Class: EventEmitter\<M\>

A small typed event emitter over an event map `M` (`{ eventType: payload }`).
Renderer-free; the base for [SourceEmitter](SourceEmitter.md) and the building block under
[CanvasEventBus](CanvasEventBus.md).

## Extended by

- [`SourceEmitter`](SourceEmitter.md)

## Type Parameters

### M

`M` *extends* `object`

## Constructors

### Constructor

> **new EventEmitter**\<`M`\>(): `EventEmitter`\<`M`\>

#### Returns

`EventEmitter`\<`M`\>

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

***

### removeAllListeners()

> **removeAllListeners**(): `void`

#### Returns

`void`
