# Interface: CanvasContext

Defined in: [packages/canvas/src/context/CanvasContext.ts:22](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/context/CanvasContext.ts#L22)

## Properties

### behaviours

> `readonly` **behaviours**: [`BehaviourRegistry`](../classes/BehaviourRegistry.md)

Defined in: [packages/canvas/src/context/CanvasContext.ts:31](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/context/CanvasContext.ts#L31)

Behaviour registry — `register / setEnabled / get<T>(id) / list`.
Behaviours never auto-enable; the developer registers + enables explicitly
(`architecture-proposal.md` §2.2).

***

### camera

> `readonly` **camera**: [`Camera`](../classes/Camera.md)

Defined in: [packages/canvas/src/context/CanvasContext.ts:34](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/context/CanvasContext.ts#L34)

Camera — pan/zoom/projection. Wraps a `pixi-viewport` `Viewport`.

***

### canvasElement?

> `readonly` `optional` **canvasElement?**: `HTMLCanvasElement`

Defined in: [packages/canvas/src/context/CanvasContext.ts:62](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/context/CanvasContext.ts#L62)

The underlying HTMLCanvasElement when running in DOM mode (`Canvas.init`).
Undefined for `Canvas.initWithStage` (headless / test path). Layers that
overlay DOM content above the canvas — `DevInfoLayer`, tooltips, popovers —
read this to find a parent element and to attach native DOM listeners.

***

### events

> `readonly` **events**: [`CanvasEventBus`](../classes/CanvasEventBus.md)

Defined in: [packages/canvas/src/context/CanvasContext.ts:37](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/context/CanvasContext.ts#L37)

Canvas-wide event bus + telemetry tap channel.

***

### layers

> `readonly` **layers**: [`LayerRegistry`](../classes/LayerRegistry.md)

Defined in: [packages/canvas/src/context/CanvasContext.ts:24](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/context/CanvasContext.ts#L24)

Layer registry — `add / remove / get<T>(id) / list / byZOrder`.

***

### stage

> `readonly` **stage**: `Container`

Defined in: [packages/canvas/src/context/CanvasContext.ts:54](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/context/CanvasContext.ts#L54)

The pixi `app.stage` (or test stage) — the renderer root. `ScreenLayer.mount`
attaches its root container here, as a sibling of `world`. Pixi's child
order = draw order: `world` is added first (bottom), each `ScreenLayer`'s
root is added after (above). No screen-wrapper container exists.

***

### world

> `readonly` **world**: `Container`

Defined in: [packages/canvas/src/context/CanvasContext.ts:46](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/context/CanvasContext.ts#L46)

The world container — a `pixi-viewport` `Viewport` instance. Camera-
transformed; `WorldLayer.mount` attaches its root sub-layer container
here. Typed as `Container` so domain code doesn't depend on
`pixi-viewport`; reach for the `Viewport`-specific API via
`camera.viewport`.
