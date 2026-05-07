# Class: EventEmitter\<E\>

Defined in: [packages/canvas/src/events/EventEmitter.ts:23](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/events/EventEmitter.ts#L23)

## Extended by

- [`CanvasEventBus`](CanvasEventBus.md)
- [`SourceEmitter`](SourceEmitter.md)

## Type Parameters

### E

`E` *extends* [`EventMap`](../type-aliases/EventMap.md) = [`EventMap`](../type-aliases/EventMap.md)

## Constructors

### Constructor

> **new EventEmitter**\<`E`\>(): `EventEmitter`\<`E`\>

#### Returns

`EventEmitter`\<`E`\>

## Methods

### emit()

> **emit**\<`K`\>(`event`, `payload`): `void`

Defined in: [packages/canvas/src/events/EventEmitter.ts:72](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/events/EventEmitter.ts#L72)

Emit an event. Each registered handler is called synchronously in registration order.

If a handler throws, the error is logged via `console.error` and subsequent
handlers still run. This prevents one buggy subscriber from breaking the
whole event chain. Errors are not re-thrown: subscribers should not be able
to crash unrelated code paths through the event bus.

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

***

### listenerCount()

> **listenerCount**(`event`): `number`

Defined in: [packages/canvas/src/events/EventEmitter.ts:105](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/events/EventEmitter.ts#L105)

Number of handlers registered for an event. Useful in tests.

#### Parameters

##### event

keyof `E`

#### Returns

`number`

***

### off()

> **off**\<`K`\>(`event`, `handler`): `void`

Defined in: [packages/canvas/src/events/EventEmitter.ts:57](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/events/EventEmitter.ts#L57)

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

***

### on()

> **on**\<`K`\>(`event`, `handler`): () => `void`

Defined in: [packages/canvas/src/events/EventEmitter.ts:31](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/events/EventEmitter.ts#L31)

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

***

### once()

> **once**\<`K`\>(`event`, `handler`): () => `void`

Defined in: [packages/canvas/src/events/EventEmitter.ts:45](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/events/EventEmitter.ts#L45)

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

***

### removeAllListeners()

> **removeAllListeners**(`event?`): `void`

Defined in: [packages/canvas/src/events/EventEmitter.ts:94](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/events/EventEmitter.ts#L94)

Remove all listeners for one event, or all events if no event is given.

#### Parameters

##### event?

keyof `E`

#### Returns

`void`
