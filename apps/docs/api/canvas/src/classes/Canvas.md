# Class: Canvas

Defined in: [canvas/src/engine/Canvas.ts:115](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L115)

## Constructors

### Constructor

> **new Canvas**(`opts?`): `Canvas`

Defined in: [canvas/src/engine/Canvas.ts:163](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L163)

#### Parameters

##### opts?

[`CanvasOptions`](../interfaces/CanvasOptions.md) = `{}`

#### Returns

`Canvas`

## Properties

### behaviours

> `readonly` **behaviours**: [`BehaviourRegistry`](BehaviourRegistry.md)

Defined in: [canvas/src/engine/Canvas.ts:145](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L145)

***

### camera

> **camera**: [`Camera`](Camera.md)

Defined in: [canvas/src/engine/Canvas.ts:143](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L143)

***

### context

> **context**: [`CanvasContext`](../interfaces/CanvasContext.md)

Defined in: [canvas/src/engine/Canvas.ts:147](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L147)

***

### events

> `readonly` **events**: [`CanvasEventBus`](CanvasEventBus.md)

Defined in: [canvas/src/engine/Canvas.ts:127](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L127)

Public surface — populated by `init()` / `initWithStage()`. Accessing
before init throws (definite-assignment via `!`). Use `isInitialised`
to guard if needed.

***

### id

> `readonly` **id**: `string`

Defined in: [canvas/src/engine/Canvas.ts:116](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L116)

***

### layers

> `readonly` **layers**: [`LayerRegistry`](LayerRegistry.md)

Defined in: [canvas/src/engine/Canvas.ts:144](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L144)

***

### layouts

> `readonly` **layouts**: [`LayoutRegistry`](LayoutRegistry.md)

Defined in: [canvas/src/engine/Canvas.ts:146](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L146)

***

### options

> `readonly` **options**: [`CanvasOptions`](../interfaces/CanvasOptions.md)

Defined in: [canvas/src/engine/Canvas.ts:117](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L117)

***

### stage

> **stage**: `Container`

Defined in: [canvas/src/engine/Canvas.ts:142](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L142)

The pixi `Application.stage` (or, for `initWithStage`, the caller-
provided stage). `ScreenLayer`s mount their roots directly here, as
siblings of `world` — `world` is added first (bottom), each ScreenLayer
after (above). No "screen" wrapper container.

***

### world

> **world**: `Container`

Defined in: [canvas/src/engine/Canvas.ts:134](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L134)

The world container — a `pixi-viewport` `Viewport` instance attached to
`app.stage`. Camera-transformed; `WorldLayer`s mount their roots here.
Typed as `Container` so consumers don't depend on `pixi-viewport`; reach
for the `Viewport`-specific API via `camera.viewport`.

## Accessors

### application

#### Get Signature

> **get** **application**(): `Application`\<`Renderer`\>

Defined in: [canvas/src/engine/Canvas.ts:194](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L194)

Pixi `Application`, available after `init()` (not `initWithStage`).

##### Returns

`Application`\<`Renderer`\>

***

### currentMessage

#### Get Signature

> **get** **currentMessage**(): `string`

Defined in: [canvas/src/engine/Canvas.ts:497](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L497)

The message currently on the channel, or `null` when idle. Stored so a
status surface that subscribes *after* a message was pushed (e.g. a footer
`CanvasMessageBar` mounting once the engine is ready) can show the current
line instead of missing the one-shot `message` event. Note: a `timeout`ed
message is auto-cleared by the displaying surface, not the engine, so this
keeps reporting it until replaced or [clearMessage](#clearmessage)-ed.

##### Returns

`string`

***

### isInitialised

#### Get Signature

> **get** **isInitialised**(): `boolean`

Defined in: [canvas/src/engine/Canvas.ts:189](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L189)

##### Returns

`boolean`

## Methods

### clearMessage()

> **clearMessage**(): `void`

Defined in: [canvas/src/engine/Canvas.ts:484](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L484)

Clear the current canvas message (emits `message` with `text: null`).

#### Returns

`void`

***

### destroy()

> **destroy**(): `void`

Defined in: [canvas/src/engine/Canvas.ts:508](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L508)

Tear down everything: ticker callback, registries (which unmount their
Layers / destroy their Behaviours and any ScreenLayer roots they own),
the world subtree, bus subscriptions, pixi Application. Idempotent.

#### Returns

`void`

***

### get()

> **get**(): [`CanvasConfig`](../interfaces/CanvasConfig.md)

Defined in: [canvas/src/engine/Canvas.ts:404](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L404)

Current serialisable config snapshot — drive a settings UI / save-load from this.

#### Returns

[`CanvasConfig`](../interfaces/CanvasConfig.md)

***

### init()

> **init**(`opts`): `Promise`\<`void`\>

Defined in: [canvas/src/engine/Canvas.ts:208](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L208)

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

Defined in: [canvas/src/engine/Canvas.ts:307](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L307)

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

### redraw()

> **redraw**(): `void`

Defined in: [canvas/src/engine/Canvas.ts:452](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L452)

Repaint every layer from its current state — calls [Layer.redraw](Layer.md#redraw) on
each (a no-op for layers that don't override it). A pure render pass:
positions and data are untouched. Use after an external style/theme change
that bypassed the per-layer dirty path, or to recover from a suspected
render desync. For layout re-positioning use [runLayout](#runlayout); for both at
once use [refresh](#refresh).

#### Returns

`void`

***

### refresh()

> **refresh**(): `Promise`\<`void`\>

Defined in: [canvas/src/engine/Canvas.ts:462](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L462)

Full refresh: re-run the active layout (`config.activeLayout`) to
re-position items, then [redraw](#redraw) every layer. The single call behind
a toolbar "re-render" button — re-layout + repaint in one. Resolves once
the layout settles; the layout step is skipped when no `activeLayout` is set.

#### Returns

`Promise`\<`void`\>

***

### runLayout()

> **runLayout**(`id`): `Promise`\<`void`\>

Defined in: [canvas/src/engine/Canvas.ts:413](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L413)

Run a registered layout against the layer named by its `targetLayerId`.
No-op if the layout or its target layer isn't found. Layouts run against
data, so call this after the target layer has data.

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`void`\>

***

### showMessage()

> **showMessage**(`text`, `timeout?`): `void`

Defined in: [canvas/src/engine/Canvas.ts:478](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L478)

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

***

### tickOnce()

> **tickOnce**(`deltaMs?`): `void`

Defined in: [canvas/src/engine/Canvas.ts:327](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L327)

Run one tick manually with a fixed delta. Useful in tests; in production
pixi's ticker calls `tick` automatically.

#### Parameters

##### deltaMs?

`number` = `16`

#### Returns

`void`

***

### update()

> **update**(`patch`): `void`

Defined in: [canvas/src/engine/Canvas.ts:384](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/Canvas.ts#L384)

Apply a JSON config patch. Deep-merges into the held config, then pushes
each layer/behaviour slice to that instance's `setOptions`, resolved by id
(unknown ids no-op — register the instance first). Emits one
`options:change` so observers (e.g. a settings UI) can re-read via [get](#get).

The config is pure JSON keyed by id — instances themselves are registered
imperatively (`canvas.layers.add(new XLayer({ id }))`).

#### Parameters

##### patch

[`CanvasConfig`](../interfaces/CanvasConfig.md)

#### Returns

`void`
