# Class: Canvas

Defined in: [canvas/src/engine/Canvas.ts:103](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/engine/Canvas.ts#L103)

## Constructors

### Constructor

> **new Canvas**(`opts?`): `Canvas`

Defined in: [canvas/src/engine/Canvas.ts:137](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/engine/Canvas.ts#L137)

#### Parameters

##### opts?

[`CanvasOptions`](../interfaces/CanvasOptions.md) = `{}`

#### Returns

`Canvas`

## Properties

### behaviours

> **behaviours**: [`BehaviourRegistry`](BehaviourRegistry.md)

Defined in: [canvas/src/engine/Canvas.ts:130](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/engine/Canvas.ts#L130)

***

### camera

> **camera**: [`Camera`](Camera.md)

Defined in: [canvas/src/engine/Canvas.ts:128](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/engine/Canvas.ts#L128)

***

### context

> **context**: [`CanvasContext`](../interfaces/CanvasContext.md)

Defined in: [canvas/src/engine/Canvas.ts:131](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/engine/Canvas.ts#L131)

***

### events

> `readonly` **events**: [`CanvasEventBus`](CanvasEventBus.md)

Defined in: [canvas/src/engine/Canvas.ts:112](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/engine/Canvas.ts#L112)

Public surface — populated by `init()` / `initWithStage()`. Accessing
before init throws (definite-assignment via `!`). Use `isInitialised`
to guard if needed.

***

### id

> `readonly` **id**: `string`

Defined in: [canvas/src/engine/Canvas.ts:104](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/engine/Canvas.ts#L104)

***

### layers

> **layers**: [`LayerRegistry`](LayerRegistry.md)

Defined in: [canvas/src/engine/Canvas.ts:129](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/engine/Canvas.ts#L129)

***

### options

> `readonly` **options**: [`CanvasOptions`](../interfaces/CanvasOptions.md)

Defined in: [canvas/src/engine/Canvas.ts:105](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/engine/Canvas.ts#L105)

***

### stage

> **stage**: `Container`

Defined in: [canvas/src/engine/Canvas.ts:127](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/engine/Canvas.ts#L127)

The pixi `Application.stage` (or, for `initWithStage`, the caller-
provided stage). `ScreenLayer`s mount their roots directly here, as
siblings of `world` — `world` is added first (bottom), each ScreenLayer
after (above). No "screen" wrapper container.

***

### world

> **world**: `Container`

Defined in: [canvas/src/engine/Canvas.ts:119](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/engine/Canvas.ts#L119)

The world container — a `pixi-viewport` `Viewport` instance attached to
`app.stage`. Camera-transformed; `WorldLayer`s mount their roots here.
Typed as `Container` so consumers don't depend on `pixi-viewport`; reach
for the `Viewport`-specific API via `camera.viewport`.

## Accessors

### application

#### Get Signature

> **get** **application**(): `Application`\<`Renderer`\>

Defined in: [canvas/src/engine/Canvas.ts:148](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/engine/Canvas.ts#L148)

Pixi `Application`, available after `init()` (not `initWithStage`).

##### Returns

`Application`\<`Renderer`\>

***

### isInitialised

#### Get Signature

> **get** **isInitialised**(): `boolean`

Defined in: [canvas/src/engine/Canvas.ts:143](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/engine/Canvas.ts#L143)

##### Returns

`boolean`

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [canvas/src/engine/Canvas.ts:283](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/engine/Canvas.ts#L283)

Tear down everything: ticker callback, registries (which unmount their
Layers / destroy their Behaviours and any ScreenLayer roots they own),
the world subtree, bus subscriptions, pixi Application. Idempotent.

#### Returns

`void`

***

### init()

> **init**(`opts`): `Promise`\<`void`\>

Defined in: [canvas/src/engine/Canvas.ts:162](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/engine/Canvas.ts#L162)

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

Defined in: [canvas/src/engine/Canvas.ts:227](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/engine/Canvas.ts#L227)

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

Defined in: [canvas/src/engine/Canvas.ts:245](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/engine/Canvas.ts#L245)

Run one tick manually with a fixed delta. Useful in tests; in production
pixi's ticker calls `tick` automatically.

#### Parameters

##### deltaMs?

`number` = `16`

#### Returns

`void`
