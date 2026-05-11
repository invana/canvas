# Class: CanvasEventBus

Defined in: [packages/canvas/src/events/CanvasEventBus.ts:101](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/events/CanvasEventBus.ts#L101)

## Extends

- [`EventEmitter`](EventEmitter.md)\<[`CanvasGlobalEvents`](../interfaces/CanvasGlobalEvents.md)\>

## Constructors

### Constructor

> **new CanvasEventBus**(`opts?`): `CanvasEventBus`

Defined in: [packages/canvas/src/events/CanvasEventBus.ts:105](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/events/CanvasEventBus.ts#L105)

#### Parameters

##### opts?

[`CanvasEventBusOptions`](../interfaces/CanvasEventBusOptions.md) = `{}`

#### Returns

`CanvasEventBus`

#### Overrides

[`EventEmitter`](EventEmitter.md).[`constructor`](EventEmitter.md#constructor)

## Methods

### clearTaps()

> **clearTaps**(): `void`

Defined in: [packages/canvas/src/events/CanvasEventBus.ts:180](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/events/CanvasEventBus.ts#L180)

Drop all tap subscribers. Used on canvas teardown.

#### Returns

`void`

***

### emit()

> **emit**\<`K`\>(`event`, `payload`): `void`

Defined in: [packages/canvas/src/events/CanvasEventBus.ts:119](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/events/CanvasEventBus.ts#L119)

Override of `EventEmitter.emit` so canvas-wide events ALSO reach the tap
channel (per `architecture-proposal.md` §2.5: "every emitter — canvas,
layer, behaviour — auto-forwards an envelope to the tap").

Order: dev-mode serialisability check → local subscribers → tap publish.
A throwing local handler is isolated by `EventEmitter.emit`; a throwing
tap handler is isolated by `publish()`.

#### Type Parameters

##### K

`K` *extends* keyof [`CanvasGlobalEvents`](../interfaces/CanvasGlobalEvents.md)

#### Parameters

##### event

`K`

##### payload

[`CanvasGlobalEvents`](../interfaces/CanvasGlobalEvents.md)\[`K`\]

#### Returns

`void`

#### Overrides

[`EventEmitter`](EventEmitter.md).[`emit`](EventEmitter.md#emit)

***

### listenerCount()

> **listenerCount**(`event`): `number`

Defined in: [packages/canvas/src/events/EventEmitter.ts:105](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/events/EventEmitter.ts#L105)

Number of handlers registered for an event. Useful in tests.

#### Parameters

##### event

keyof [`CanvasGlobalEvents`](../interfaces/CanvasGlobalEvents.md)

#### Returns

`number`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`listenerCount`](EventEmitter.md#listenercount)

***

### off()

> **off**\<`K`\>(`event`, `handler`): `void`

Defined in: [packages/canvas/src/events/EventEmitter.ts:57](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/events/EventEmitter.ts#L57)

Unsubscribe a specific handler.
No-op if the handler wasn't registered.

#### Type Parameters

##### K

`K` *extends* keyof [`CanvasGlobalEvents`](../interfaces/CanvasGlobalEvents.md)

#### Parameters

##### event

`K`

##### handler

[`EventHandler`](../type-aliases/EventHandler.md)\<[`CanvasGlobalEvents`](../interfaces/CanvasGlobalEvents.md)\[`K`\]\>

#### Returns

`void`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`off`](EventEmitter.md#off)

***

### on()

> **on**\<`K`\>(`event`, `handler`): () => `void`

Defined in: [packages/canvas/src/events/EventEmitter.ts:31](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/events/EventEmitter.ts#L31)

Subscribe to an event. Returns an unsubscribe function for ergonomic cleanup.

#### Type Parameters

##### K

`K` *extends* keyof [`CanvasGlobalEvents`](../interfaces/CanvasGlobalEvents.md)

#### Parameters

##### event

`K`

##### handler

[`EventHandler`](../type-aliases/EventHandler.md)\<[`CanvasGlobalEvents`](../interfaces/CanvasGlobalEvents.md)\[`K`\]\>

#### Returns

() => `void`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`on`](EventEmitter.md#on)

***

### once()

> **once**\<`K`\>(`event`, `handler`): () => `void`

Defined in: [packages/canvas/src/events/EventEmitter.ts:45](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/events/EventEmitter.ts#L45)

Subscribe once. The handler fires at most once and auto-removes itself.
Returns an unsubscribe function in case you want to cancel before it fires.

#### Type Parameters

##### K

`K` *extends* keyof [`CanvasGlobalEvents`](../interfaces/CanvasGlobalEvents.md)

#### Parameters

##### event

`K`

##### handler

[`EventHandler`](../type-aliases/EventHandler.md)\<[`CanvasGlobalEvents`](../interfaces/CanvasGlobalEvents.md)\[`K`\]\>

#### Returns

() => `void`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`once`](EventEmitter.md#once)

***

### publish()

> **publish**(`event`): `void`

Defined in: [packages/canvas/src/events/CanvasEventBus.ts:159](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/events/CanvasEventBus.ts#L159)

Publish an envelope to all tap subscribers. Called by `SourceEmitter`
(and by canvas-internal code that emits envelopes directly).

Filtering applies per-tap:
  - exclude list (suffix-match against event type)
  - sampleRate

No allocation per call other than what the handlers themselves do.

#### Parameters

##### event

[`CanvasEvent`](../interfaces/CanvasEvent.md)

#### Returns

`void`

***

### removeAllListeners()

> **removeAllListeners**(`event?`): `void`

Defined in: [packages/canvas/src/events/EventEmitter.ts:94](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/events/EventEmitter.ts#L94)

Remove all listeners for one event, or all events if no event is given.

#### Parameters

##### event?

keyof [`CanvasGlobalEvents`](../interfaces/CanvasGlobalEvents.md)

#### Returns

`void`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`removeAllListeners`](EventEmitter.md#removealllisteners)

***

### tap()

> **tap**(`handler`, `opts?`): () => `void`

Defined in: [packages/canvas/src/events/CanvasEventBus.ts:137](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/events/CanvasEventBus.ts#L137)

Subscribe to the tap channel. Returns an unsubscribe function.

Default exclude: `DEFAULT_TAP_EXCLUDE` (high-frequency noise).
Default sampleRate: `1` (no sampling).

Errors thrown by tap handlers are caught and logged via `console.error`,
just like local emitter handlers — one bad sink can't break the rest.

#### Parameters

##### handler

[`TapHandler`](../type-aliases/TapHandler.md)

##### opts?

[`TapOptions`](../interfaces/TapOptions.md) = `{}`

#### Returns

() => `void`

***

### tapCount()

> **tapCount**(): `number`

Defined in: [packages/canvas/src/events/CanvasEventBus.ts:175](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/events/CanvasEventBus.ts#L175)

Number of currently registered tap subscribers. Useful in tests.

#### Returns

`number`
