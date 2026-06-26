# Interface: CanvasContext

Defined in: [canvas/src/context/CanvasContext.ts:23](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/context/CanvasContext.ts#L23)

## Properties

### behaviours

> `readonly` **behaviours**: [`BehaviourRegistry`](../classes/BehaviourRegistry.md)

Defined in: [canvas/src/context/CanvasContext.ts:32](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/context/CanvasContext.ts#L32)

Behaviour registry — `register / setEnabled / get<T>(id) / list`.
Behaviours never auto-enable; the developer registers + enables explicitly
(`architecture-proposal.md` §2.2).

***

### camera

> `readonly` **camera**: [`Camera`](../classes/Camera.md)

Defined in: [canvas/src/context/CanvasContext.ts:35](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/context/CanvasContext.ts#L35)

Camera — pan/zoom/projection. Wraps a `pixi-viewport` `Viewport`.

***

### canvasElement?

> `readonly` `optional` **canvasElement?**: `HTMLCanvasElement`

Defined in: [canvas/src/context/CanvasContext.ts:71](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/context/CanvasContext.ts#L71)

The underlying HTMLCanvasElement when running in DOM mode (`Canvas.init`).
Undefined for `Canvas.initWithStage` (headless / test path). Layers that
overlay DOM content above the canvas — `DevInfoLayer`, tooltips, popovers —
read this to find a parent element and to attach native DOM listeners.

***

### events

> `readonly` **events**: [`CanvasEventBus`](../classes/CanvasEventBus.md)

Defined in: [canvas/src/context/CanvasContext.ts:38](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/context/CanvasContext.ts#L38)

Canvas-wide event bus + telemetry tap channel.

***

### layers

> `readonly` **layers**: [`LayerRegistry`](../classes/LayerRegistry.md)

Defined in: [canvas/src/context/CanvasContext.ts:25](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/context/CanvasContext.ts#L25)

Layer registry — `add / remove / get<T>(id) / list / byZOrder`.

***

### stage

> `readonly` **stage**: `Container`

Defined in: [canvas/src/context/CanvasContext.ts:63](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/context/CanvasContext.ts#L63)

The pixi `app.stage` (or test stage) — the renderer root. `ScreenLayer.mount`
attaches its root container here, as a sibling of `world`. Pixi's child
order = draw order: `world` is added first (bottom), each `ScreenLayer`'s
root is added after (above). No screen-wrapper container exists.

***

### theme

> `readonly` **theme**: [`ThemeState`](ThemeState.md)

Defined in: [canvas/src/context/CanvasContext.ts:46](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/context/CanvasContext.ts#L46)

The active theme channel. A single publisher (the domain `ThemeBehaviour`)
calls `theme.set(...)`; theme-aware layers read `theme.current()` and/or
subscribe to the `'theme:change'` event to recolour. `current()` is `null`
until a theme is first published.

***

### world

> `readonly` **world**: `Container`

Defined in: [canvas/src/context/CanvasContext.ts:55](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/context/CanvasContext.ts#L55)

The world container — a `pixi-viewport` `Viewport` instance. Camera-
transformed; `WorldLayer.mount` attaches its root sub-layer container
here. Typed as `Container` so domain code doesn't depend on
`pixi-viewport`; reach for the `Viewport`-specific API via
`camera.viewport`.

## Methods

### clearMessage()

> **clearMessage**(): `void`

Defined in: [canvas/src/context/CanvasContext.ts:82](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/context/CanvasContext.ts#L82)

Clear the current canvas message.

#### Returns

`void`

***

### showMessage()

> **showMessage**(`text`, `timeout?`): `void`

Defined in: [canvas/src/context/CanvasContext.ts:79](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/context/CanvasContext.ts#L79)

Show a transient message on the shared canvas message channel — the same
call as `Canvas.showMessage`. Lets layers / behaviours / layouts surface a
status line (e.g. a layout announcing "Running…" on start) without reaching
for the bus directly. `timeout` (ms) auto-clears it.

#### Parameters

##### text

`string`

##### timeout?

`number`

#### Returns

`void`
