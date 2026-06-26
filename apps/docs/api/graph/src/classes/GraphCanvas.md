# Class: GraphCanvas

Defined in: [graph/src/canvas/GraphCanvas.ts:30](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/canvas/GraphCanvas.ts#L30)

## Extends

- `Canvas`

## Constructors

### Constructor

> **new GraphCanvas**(`opts?`): `GraphCanvas`

Defined in: canvas/dist/index.d.ts:2140

#### Parameters

##### opts?

`CanvasOptions`

#### Returns

`GraphCanvas`

#### Inherited from

`Canvas.constructor`

## Properties

### behaviours

> `readonly` **behaviours**: `BehaviourRegistry`

Defined in: canvas/dist/index.d.ts:2125

#### Inherited from

`Canvas.behaviours`

***

### camera

> **camera**: `Camera`

Defined in: canvas/dist/index.d.ts:2123

#### Inherited from

`Canvas.camera`

***

### context

> **context**: `CanvasContext`

Defined in: canvas/dist/index.d.ts:2127

#### Inherited from

`Canvas.context`

***

### events

> `readonly` **events**: `CanvasEventBus`

Defined in: canvas/dist/index.d.ts:2108

Public surface — populated by `init()` / `initWithStage()`. Accessing
before init throws (definite-assignment via `!`). Use `isInitialised`
to guard if needed.

#### Inherited from

`Canvas.events`

***

### id

> `readonly` **id**: `string`

Defined in: canvas/dist/index.d.ts:2099

#### Inherited from

`Canvas.id`

***

### layers

> `readonly` **layers**: `LayerRegistry`

Defined in: canvas/dist/index.d.ts:2124

#### Inherited from

`Canvas.layers`

***

### layouts

> `readonly` **layouts**: `LayoutRegistry`

Defined in: canvas/dist/index.d.ts:2126

#### Inherited from

`Canvas.layouts`

***

### options

> `readonly` **options**: `CanvasOptions`

Defined in: canvas/dist/index.d.ts:2100

#### Inherited from

`Canvas.options`

***

### stage

> **stage**: `Container`

Defined in: canvas/dist/index.d.ts:2122

The pixi `Application.stage` (or, for `initWithStage`, the caller-
provided stage). `ScreenLayer`s mount their roots directly here, as
siblings of `world` — `world` is added first (bottom), each ScreenLayer
after (above). No "screen" wrapper container.

#### Inherited from

`Canvas.stage`

***

### world

> **world**: `Container`

Defined in: canvas/dist/index.d.ts:2115

The world container — a `pixi-viewport` `Viewport` instance attached to
`app.stage`. Camera-transformed; `WorldLayer`s mount their roots here.
Typed as `Container` so consumers don't depend on `pixi-viewport`; reach
for the `Viewport`-specific API via `camera.viewport`.

#### Inherited from

`Canvas.world`

## Accessors

### application

#### Get Signature

> **get** **application**(): `Application`\<`Renderer`\>

Defined in: canvas/dist/index.d.ts:2143

Pixi `Application`, available after `init()` (not `initWithStage`).

##### Returns

`Application`\<`Renderer`\>

#### Inherited from

`Canvas.application`

***

### currentMessage

#### Get Signature

> **get** **currentMessage**(): `string`

Defined in: canvas/dist/index.d.ts:2227

The message currently on the channel, or `null` when idle. Stored so a
status surface that subscribes *after* a message was pushed (e.g. a footer
`CanvasMessageBar` mounting once the engine is ready) can show the current
line instead of missing the one-shot `message` event. Note: a `timeout`ed
message is auto-cleared by the displaying surface, not the engine, so this
keeps reporting it until replaced or [clearMessage](#clearmessage)-ed.

##### Returns

`string`

#### Inherited from

`Canvas.currentMessage`

***

### isInitialised

#### Get Signature

> **get** **isInitialised**(): `boolean`

Defined in: canvas/dist/index.d.ts:2141

##### Returns

`boolean`

#### Inherited from

`Canvas.isInitialised`

## Methods

### behaviour()

> **behaviour**\<`T`\>(`id`): `T`

Defined in: [graph/src/canvas/GraphCanvas.ts:39](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/canvas/GraphCanvas.ts#L39)

Typed behaviour lookup.

#### Type Parameters

##### T

`T` *extends* `Behaviour` = `Behaviour`

#### Parameters

##### id

`string`

#### Returns

`T`

***

### clearMessage()

> **clearMessage**(): `void`

Defined in: canvas/dist/index.d.ts:2218

Clear the current canvas message (emits `message` with `text: null`).

#### Returns

`void`

#### Inherited from

`Canvas.clearMessage`

***

### destroy()

> **destroy**(): `void`

Defined in: [graph/src/canvas/GraphCanvas.ts:58](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/canvas/GraphCanvas.ts#L58)

Tear down everything: ticker callback, registries (which unmount their
Layers / destroy their Behaviours and any ScreenLayer roots they own),
the world subtree, bus subscriptions, pixi Application. Idempotent.

#### Returns

`void`

#### Overrides

`Canvas.destroy`

***

### get()

> **get**(): [`CanvasConfig`](../../../canvas-react/src/interfaces/CanvasConfig.md)

Defined in: canvas/dist/index.d.ts:2185

Current serialisable config snapshot — drive a settings UI / save-load from this.

#### Returns

[`CanvasConfig`](../../../canvas-react/src/interfaces/CanvasConfig.md)

#### Inherited from

`Canvas.get`

***

### init()

> **init**(`opts`): `Promise`\<`void`\>

Defined in: [graph/src/canvas/GraphCanvas.ts:48](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/canvas/GraphCanvas.ts#L48)

Production init: create a pixi `Application`, mount its canvas into the
supplied DOM container, wire the ticker, and emit
`'renderer:initialised'` on the bus.

The selected backend (and capabilities) flows through the bus event so
consumers see which renderer pixi resolved.

#### Parameters

##### opts

`CanvasOptions`

#### Returns

`Promise`\<`void`\>

#### Overrides

`Canvas.init`

***

### initWithStage()

> **initWithStage**(`stage`, `screenWidth`, `screenHeight`): `void`

Defined in: canvas/dist/index.d.ts:2160

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

#### Inherited from

`Canvas.initWithStage`

***

### layer()

> **layer**\<`T`\>(`id`): `T`

Defined in: [graph/src/canvas/GraphCanvas.ts:34](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/canvas/GraphCanvas.ts#L34)

Typed layer lookup; defaults to `GraphLayer`.

#### Type Parameters

##### T

`T` *extends* `Layer`\<`unknown`, `object`, `EventMap`, `string`\> = [`GraphLayer`](GraphLayer.md)

#### Parameters

##### id

`string`

#### Returns

`T`

***

### layout()

> **layout**\<`T`\>(`id`): `T`

Defined in: [graph/src/canvas/GraphCanvas.ts:44](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/canvas/GraphCanvas.ts#L44)

Typed layout lookup.

#### Type Parameters

##### T

`T` *extends* `Layout`\<`Layer`\<`any`, `any`, `any`, `any`\>\> = `Layout`\<`Layer`\<`any`, `any`, `any`, `any`\>\>

#### Parameters

##### id

`string`

#### Returns

`T`

***

### redraw()

> **redraw**(): `void`

Defined in: canvas/dist/index.d.ts:2200

Repaint every layer from its current state — calls Layer.redraw on
each (a no-op for layers that don't override it). A pure render pass:
positions and data are untouched. Use after an external style/theme change
that bypassed the per-layer dirty path, or to recover from a suspected
render desync. For layout re-positioning use [runLayout](#runlayout); for both at
once use [refresh](#refresh).

#### Returns

`void`

#### Inherited from

`Canvas.redraw`

***

### refresh()

> **refresh**(): `Promise`\<`void`\>

Defined in: canvas/dist/index.d.ts:2207

Full refresh: re-run the active layout (`config.activeLayout`) to
re-position items, then [redraw](#redraw) every layer. The single call behind
a toolbar "re-render" button — re-layout + repaint in one. Resolves once
the layout settles; the layout step is skipped when no `activeLayout` is set.

#### Returns

`Promise`\<`void`\>

#### Inherited from

`Canvas.refresh`

***

### runLayout()

> **runLayout**(`id`): `Promise`\<`void`\>

Defined in: canvas/dist/index.d.ts:2191

Run a registered layout against the layer named by its `targetLayerId`.
No-op if the layout or its target layer isn't found. Layouts run against
data, so call this after the target layer has data.

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`void`\>

#### Inherited from

`Canvas.runLayout`

***

### showMessage()

> **showMessage**(`text`, `timeout?`): `void`

Defined in: canvas/dist/index.d.ts:2216

Show a transient message on the shared canvas message channel — emits a
`message` event for a status surface (e.g. canvas-react's `CanvasMessageBar`)
to display. Last-write-wins: a newer message replaces the current one. With
`timeout` (ms) the surface auto-clears it after that delay; without, it
stays until replaced or [clearMessage](#clearmessage)-ed. Reachable from layers /
behaviours / layouts too, via `ctx.showMessage`.

#### Parameters

##### text

`string`

##### timeout?

`number`

#### Returns

`void`

#### Inherited from

`Canvas.showMessage`

***

### tickOnce()

> **tickOnce**(`deltaMs?`): `void`

Defined in: canvas/dist/index.d.ts:2165

Run one tick manually with a fixed delta. Useful in tests; in production
pixi's ticker calls `tick` automatically.

#### Parameters

##### deltaMs?

`number`

#### Returns

`void`

#### Inherited from

`Canvas.tickOnce`

***

### update()

> **update**(`patch`): `void`

Defined in: [graph/src/canvas/GraphCanvas.ts:53](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/canvas/GraphCanvas.ts#L53)

Apply a JSON config patch. Deep-merges into the held config, then pushes
each layer/behaviour slice to that instance's `setOptions`, resolved by id
(unknown ids no-op — register the instance first). Emits one
`options:change` so observers (e.g. a settings UI) can re-read via [get](#get).

The config is pure JSON keyed by id — instances themselves are registered
imperatively (`canvas.layers.add(new XLayer({ id }))`).

#### Parameters

##### patch

[`CanvasConfig`](../../../canvas-react/src/interfaces/CanvasConfig.md)

#### Returns

`void`

#### Overrides

`Canvas.update`
