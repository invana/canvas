# Class: Canvas

Defined in: [packages/canvas/src/engine/Canvas.ts:93](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/engine/Canvas.ts#L93)

## Constructors

### Constructor

> **new Canvas**(`opts?`): `Canvas`

Defined in: [packages/canvas/src/engine/Canvas.ts:127](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/engine/Canvas.ts#L127)

#### Parameters

##### opts?

[`CanvasOptions`](../interfaces/CanvasOptions.md) = `{}`

#### Returns

`Canvas`

## Properties

### behaviours

> **behaviours**: [`BehaviourRegistry`](BehaviourRegistry.md)

Defined in: [packages/canvas/src/engine/Canvas.ts:120](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/engine/Canvas.ts#L120)

***

### camera

> **camera**: [`Camera`](Camera.md)

Defined in: [packages/canvas/src/engine/Canvas.ts:118](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/engine/Canvas.ts#L118)

***

### context

> **context**: [`CanvasContext`](../interfaces/CanvasContext.md)

Defined in: [packages/canvas/src/engine/Canvas.ts:121](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/engine/Canvas.ts#L121)

***

### events

> `readonly` **events**: [`CanvasEventBus`](CanvasEventBus.md)

Defined in: [packages/canvas/src/engine/Canvas.ts:102](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/engine/Canvas.ts#L102)

Public surface — populated by `init()` / `initWithStage()`. Accessing
before init throws (definite-assignment via `!`). Use `isInitialised`
to guard if needed.

***

### id

> `readonly` **id**: `string`

Defined in: [packages/canvas/src/engine/Canvas.ts:94](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/engine/Canvas.ts#L94)

***

### layers

> **layers**: [`LayerRegistry`](LayerRegistry.md)

Defined in: [packages/canvas/src/engine/Canvas.ts:119](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/engine/Canvas.ts#L119)

***

### options

> `readonly` **options**: [`CanvasOptions`](../interfaces/CanvasOptions.md)

Defined in: [packages/canvas/src/engine/Canvas.ts:95](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/engine/Canvas.ts#L95)

***

### stage

> **stage**: `Container`

Defined in: [packages/canvas/src/engine/Canvas.ts:117](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/engine/Canvas.ts#L117)

The pixi `Application.stage` (or, for `initWithStage`, the caller-
provided stage). `ScreenLayer`s mount their roots directly here, as
siblings of `world` — `world` is added first (bottom), each ScreenLayer
after (above). No "screen" wrapper container.

***

### world

> **world**: `Container`

Defined in: [packages/canvas/src/engine/Canvas.ts:109](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/engine/Canvas.ts#L109)

The world container — a `pixi-viewport` `Viewport` instance attached to
`app.stage`. Camera-transformed; `WorldLayer`s mount their roots here.
Typed as `Container` so consumers don't depend on `pixi-viewport`; reach
for the `Viewport`-specific API via `camera.viewport`.

## Accessors

### application

#### Get Signature

> **get** **application**(): `Application`\<`Renderer`\>

Defined in: [packages/canvas/src/engine/Canvas.ts:138](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/engine/Canvas.ts#L138)

Pixi `Application`, available after `init()` (not `initWithStage`).

##### Returns

`Application`\<`Renderer`\>

***

### isInitialised

#### Get Signature

> **get** **isInitialised**(): `boolean`

Defined in: [packages/canvas/src/engine/Canvas.ts:133](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/engine/Canvas.ts#L133)

##### Returns

`boolean`

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [packages/canvas/src/engine/Canvas.ts:269](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/engine/Canvas.ts#L269)

Tear down everything: ticker callback, registries (which unmount their
Layers / destroy their Behaviours and any ScreenLayer roots they own),
the world subtree, bus subscriptions, pixi Application. Idempotent.

#### Returns

`void`

***

### init()

> **init**(`opts`): `Promise`\<`void`\>

Defined in: [packages/canvas/src/engine/Canvas.ts:152](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/engine/Canvas.ts#L152)

Production init: create a pixi `Application`, mount its canvas into the
supplied DOM container, wire the ticker, and emit
`'renderer:initialised'` on the bus.

The selected backend (and capabilities) flows through the bus event so
consumers see which renderer pixi resolved.

#### Parameters

##### opts

[`CanvasOptions`](../interfaces/CanvasOptions.md)

#### Returns

`Promise`\<`void`\>

***

### initWithStage()

> **initWithStage**(`stage`, `screenWidth`, `screenHeight`): `void`

Defined in: [packages/canvas/src/engine/Canvas.ts:213](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/engine/Canvas.ts#L213)

Headless / test init. Caller provides a pre-built stage `Container`
and viewport dimensions; we skip pixi's `Application` setup entirely.

Use case: unit tests of the layer / behaviour / dirty / state pipeline
that don't need an actual GPU renderer.

#### Parameters

##### stage

`Container`

##### screenWidth

`number`

##### screenHeight

`number`

#### Returns

`void`

***

### tickOnce()

> **tickOnce**(`deltaMs?`): `void`

Defined in: [packages/canvas/src/engine/Canvas.ts:231](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/engine/Canvas.ts#L231)

Run one tick manually with a fixed delta. Useful in tests; in production
pixi's ticker calls `tick` automatically.

#### Parameters

##### deltaMs?

`number` = `16`

#### Returns

`void`
