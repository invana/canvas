# Interface: CanvasContext

`CanvasContext` — the shared service surface every Layer / Behaviour /
Layout receives at mount/register time.

Architecture: see `architecture-proposal.md` §2.4.

**One context, three audiences.** Per the proposal, there is no separate
`LayerContext` / `BehaviourContext` / `LayoutContext` — the same shape is
handed to every participant so cross-cutting access (read peer layers,
fire camera moves, tap telemetry) doesn't need three parallel context types.

The `Canvas` builds a concrete object that satisfies this interface and
passes it down. Tests can construct a stub by satisfying these fields.

## Properties

### behaviours

> `readonly` **behaviours**: [`BehaviourRegistry`](../classes/BehaviourRegistry.md)

Behaviour registry — `register / setEnabled / get<T>(id) / list`.
Behaviours never auto-enable; the developer registers + enables explicitly
(`architecture-proposal.md` §2.2).

***

### camera

> `readonly` **camera**: [`Camera`](../classes/Camera.md)

Camera — pan/zoom/projection. Wraps a `pixi-viewport` `Viewport`.

***

### canvasElement?

> `readonly` `optional` **canvasElement?**: `HTMLCanvasElement`

The underlying HTMLCanvasElement when running in DOM mode (`Canvas.init`).
Undefined for `Canvas.initWithStage` (headless / test path). Layers that
overlay DOM content above the canvas — `DevInfoLayer`, tooltips, popovers —
read this to find a parent element and to attach native DOM listeners.

***

### events

> `readonly` **events**: [`CanvasEventBus`](../classes/CanvasEventBus.md)

Canvas-wide event bus + telemetry tap channel.

***

### gestures

> `readonly` **gestures**: [`GestureArbiter`](GestureArbiter.md)

Pointer-gesture arbitration — at most one owner at a time. A behaviour that
needs the pointer to itself (drag, lasso, brush, resize, edge draw) claims
it here rather than suspending the camera's pan plugin behind its back;
`DragPanBehaviour` yields whenever `gestures.owner` names somebody else.

Behaviours should reach for `Behaviour.claimGesture` /
`Behaviour.releaseGesture` instead of calling this directly — the base class
releases on `disable()` / `destroy()`, and a stranded claim would freeze
both the camera and every other gesture.

***

### layers

> `readonly` **layers**: [`LayerRegistry`](../classes/LayerRegistry.md)

Layer registry — `add / remove / get<T>(id) / list / byZOrder`.

***

### store

> `readonly` **store**: [`CanvasStore`](../../../canvas-store/src/interfaces/CanvasStore.md)

The renderer-free kernel (`@invana/canvas-store`) — `view` (reactive config +
interaction state), `data` (bulk per-source stores), `events`, `theme`,
history. The cross-cutting handle for the state migration: layers
read/subscribe `store.data[id]` + `store.view`; behaviours write interaction
via `store.view.update(...)`. During M0 the engine mirrors its config into
`store.view.definition` (see `Canvas.update`).

***

### theme

> `readonly` **theme**: [`ThemeState`](ThemeState.md)

The active theme channel. A single publisher (the domain `ThemeBehaviour`)
calls `theme.set(...)`; theme-aware layers read `theme.current()` and/or
subscribe to the `'theme:change'` event to recolour. `current()` is `null`
until a theme is first published.

## Methods

### clearMessage()

> **clearMessage**(): `void`

Clear the current canvas message.

#### Returns

`void`

***

### createOverlay()

> **createOverlay**(`label`, `space?`): [`IOverlayDevice`](IOverlayDevice.md)

A drawing device for a **transient** visual — a lasso, a brush rectangle, a
drag ghost. Not for layer content: anything durable is a spec in the store
(`docs/renderer-split-design.md` §3).

Available to behaviours as well as layers, because a gesture overlay belongs
to the gesture, not to any one layer.

#### Parameters

##### label

`string`

##### space?

[`OverlaySpace`](../type-aliases/OverlaySpace.md)

#### Returns

[`IOverlayDevice`](IOverlayDevice.md)

***

### createStateStore()

> **createStateStore**\<`T`\>(`initial`): [`ReactiveStore`](ReactiveStore.md)\<`T`\>

Build a patch-emitting [ReactiveStore](ReactiveStore.md) — the factory behind
`Layer.state`. Injected by the engine (which implements it with the
kernel's `createReactiveStore`) because this package is dependency-free
and cannot construct a store itself; the seam is also what makes the
backend swappable (a collaborative canvas injects a Yjs-backed factory).

#### Type Parameters

##### T

`T` *extends* `object`

#### Parameters

##### initial

`T`

#### Returns

[`ReactiveStore`](ReactiveStore.md)\<`T`\>

***

### createSurface()

> **createSurface**(`space`, `id`, `opts?`): [`ISurface`](ISurface.md)

A layer's slice of the renderer — its drawing device, overlays, visibility
and paint order. Replaces the layer bases constructing a pixi `Container`
themselves, and is the seam a second backend implements
(`docs/renderer-split-design.md` §4).

#### Parameters

##### space

[`SurfaceSpace`](../type-aliases/SurfaceSpace.md)

##### id

`string`

##### opts?

[`SurfaceOptions`](SurfaceOptions.md)

#### Returns

[`ISurface`](ISurface.md)

***

### showMessage()

> **showMessage**(`text`, `timeout?`): `void`

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
