# Class: SourceEmitter\<E\>

Defined in: [packages/canvas/src/events/SourceEmitter.ts:40](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/events/SourceEmitter.ts#L40)

## Extends

- [`EventEmitter`](EventEmitter.md)\<`E`\>

## Type Parameters

### E

`E` *extends* [`EventMap`](../type-aliases/EventMap.md) = [`EventMap`](../type-aliases/EventMap.md)

## Constructors

### Constructor

> **new SourceEmitter**\<`E`\>(`source`, `bus?`): `SourceEmitter`\<`E`\>

Defined in: [packages/canvas/src/events/SourceEmitter.ts:50](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/events/SourceEmitter.ts#L50)

#### Parameters

##### source

[`EventSource`](../interfaces/EventSource.md)

##### bus?

[`CanvasEventBus`](CanvasEventBus.md)

#### Returns

`SourceEmitter`\<`E`\>

#### Overrides

[`EventEmitter`](EventEmitter.md).[`constructor`](EventEmitter.md#constructor)

## Accessors

### sourceInfo

#### Get Signature

> **get** **sourceInfo**(): [`EventSource`](../interfaces/EventSource.md)

Defined in: [packages/canvas/src/events/SourceEmitter.ts:88](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/events/SourceEmitter.ts#L88)

Convenience: source identity (read-only).

##### Returns

[`EventSource`](../interfaces/EventSource.md)

## Methods

### emit()

> **emit**\<`K`\>(`event`, `payload`): `void`

Defined in: [packages/canvas/src/events/SourceEmitter.ts:74](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/events/SourceEmitter.ts#L74)

Emit to local subscribers AND publish to the bus's tap channel.
Order: local handlers run first (synchronous, in registration order),
then the envelope is published. A throwing local handler is caught
(logged via `console.error` per `EventEmitter`) and does not block the
tap publish.

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### event

`K`

##### payload

`E`\[`K`\]

#### Returns

`void`

#### Overrides

[`EventEmitter`](EventEmitter.md).[`emit`](EventEmitter.md#emit)

***

### listenerCount()

> **listenerCount**(`event`): `number`

Defined in: [packages/canvas/src/events/EventEmitter.ts:105](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/events/EventEmitter.ts#L105)

Number of handlers registered for an event. Useful in tests.

#### Parameters

##### event

keyof `E`

#### Returns

`number`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`listenerCount`](EventEmitter.md#listenercount)

***

### off()

> **off**\<`K`\>(`event`, `handler`): `void`

Defined in: [packages/canvas/src/events/EventEmitter.ts:57](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/events/EventEmitter.ts#L57)

Unsubscribe a specific handler.
No-op if the handler wasn't registered.

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### event

`K`

##### handler

[`EventHandler`](../type-aliases/EventHandler.md)\<`E`\[`K`\]\>

#### Returns

`void`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`off`](EventEmitter.md#off)

***

### on()

> **on**\<`K`\>(`event`, `handler`): () => `void`

Defined in: [packages/canvas/src/events/EventEmitter.ts:31](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/events/EventEmitter.ts#L31)

Subscribe to an event. Returns an unsubscribe function for ergonomic cleanup.

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### event

`K`

##### handler

[`EventHandler`](../type-aliases/EventHandler.md)\<`E`\[`K`\]\>

#### Returns

() => `void`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`on`](EventEmitter.md#on)

***

### once()

> **once**\<`K`\>(`event`, `handler`): () => `void`

Defined in: [packages/canvas/src/events/EventEmitter.ts:45](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/events/EventEmitter.ts#L45)

Subscribe once. The handler fires at most once and auto-removes itself.
Returns an unsubscribe function in case you want to cancel before it fires.

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### event

`K`

##### handler

[`EventHandler`](../type-aliases/EventHandler.md)\<`E`\[`K`\]\>

#### Returns

() => `void`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`once`](EventEmitter.md#once)

***

### removeAllListeners()

> **removeAllListeners**(`event?`): `void`

Defined in: [packages/canvas/src/events/EventEmitter.ts:94](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/events/EventEmitter.ts#L94)

Remove all listeners for one event, or all events if no event is given.

#### Parameters

##### event?

keyof `E`

#### Returns

`void`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`removeAllListeners`](EventEmitter.md#removealllisteners)

***

### setBus()

> **setBus**(`bus`): `void`

Defined in: [packages/canvas/src/events/SourceEmitter.ts:63](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/events/SourceEmitter.ts#L63)

Attach (or detach) the bus this emitter forwards to.

Use case: a `Layer` is constructed before it knows which `Canvas` it'll be
mounted on. The Layer creates its `SourceEmitter` upfront with no bus,
then `mount(ctx)` calls `events.setBus(ctx.events)` to start forwarding.
Pass `undefined` to detach (e.g. on unmount).

#### Parameters

##### bus

[`CanvasEventBus`](CanvasEventBus.md)

#### Returns

`void`
