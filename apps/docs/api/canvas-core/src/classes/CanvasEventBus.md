# Class: CanvasEventBus

Canvas-wide event bus: typed `on`/`emit` for known events, **plus a tap
channel** that receives every emission (typed *and* forwarded scoped events) as
a structured [CanvasEvent](../interfaces/CanvasEvent.md). The tap is the single place telemetry /
collaboration observe the whole stream — `bus.tap(e => sink(e))`.

Renderer-free: the engine wires pixi pointer events *into* this; the bus knows
nothing about pixi.

## Constructors

### Constructor

> **new CanvasEventBus**(`opts?`): `CanvasEventBus`

#### Parameters

##### opts?

###### now?

() => `number`

###### random?

() => `number`

#### Returns

`CanvasEventBus`

## Methods

### clearTaps()

> **clearTaps**(): `void`

#### Returns

`void`

***

### emit()

> **emit**\<`K`\>(`type`, `payload`, `source?`): `void`

Emit a typed global event — reaches typed listeners and the tap channel.

#### Type Parameters

##### K

`K` *extends* keyof [`CanvasGlobalEvents`](../interfaces/CanvasGlobalEvents.md)

#### Parameters

##### type

`K`

##### payload

[`CanvasGlobalEvents`](../interfaces/CanvasGlobalEvents.md)\[`K`\]

##### source?

[`EventSource`](../interfaces/EventSource.md) = `CANVAS_SOURCE`

#### Returns

`void`

***

### off()

> **off**\<`K`\>(`type`, `listener`): `void`

Remove a previously-registered typed listener (the [on](#on) handler by reference).

#### Type Parameters

##### K

`K` *extends* keyof [`CanvasGlobalEvents`](../interfaces/CanvasGlobalEvents.md)

#### Parameters

##### type

`K`

##### listener

[`Listener`](../type-aliases/Listener.md)\<[`CanvasGlobalEvents`](../interfaces/CanvasGlobalEvents.md)\[`K`\]\>

#### Returns

`void`

***

### on()

> **on**\<`K`\>(`type`, `listener`): () => `void`

Subscribe to a typed global event. Returns an unsubscribe fn (or use [off](#off)).

#### Type Parameters

##### K

`K` *extends* keyof [`CanvasGlobalEvents`](../interfaces/CanvasGlobalEvents.md)

#### Parameters

##### type

`K`

##### listener

[`Listener`](../type-aliases/Listener.md)\<[`CanvasGlobalEvents`](../interfaces/CanvasGlobalEvents.md)\[`K`\]\>

#### Returns

() => `void`

***

### publish()

> **publish**(`type`, `payload`, `source`): `void`

Forward a **scoped / foreign** event (not in [CanvasGlobalEvents](../interfaces/CanvasGlobalEvents.md)) to the
tap channel only — used by [SourceEmitter](SourceEmitter.md) so a store/layer/behaviour's
own events reach the canvas tap without being global-bus types.

#### Parameters

##### type

`string`

##### payload

`unknown`

##### source

[`EventSource`](../interfaces/EventSource.md)

#### Returns

`void`

***

### removeAllListeners()

> **removeAllListeners**(): `void`

#### Returns

`void`

***

### tap()

> **tap**(`fn`, `opts?`): () => `void`

Subscribe to the whole event stream (structured envelopes).

#### Parameters

##### fn

[`Tap`](../type-aliases/Tap.md)

##### opts?

[`TapOptions`](../interfaces/TapOptions.md) = `{}`

#### Returns

() => `void`
