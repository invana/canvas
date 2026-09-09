# Abstract Class: Layer\<TOptions, TState, TEvents, TDirtyBucket\>

The subset of `Layer` the `LayerRegistry` and `Canvas.tick` interact with.
Lets the registry stay decoupled from the abstract class implementation.

## Type Parameters

### TOptions

`TOptions` = `unknown`

### TState

`TState` *extends* `object` = `object`

### TEvents

`TEvents` *extends* [`EventMap`](../type-aliases/EventMap.md) = [`EventMap`](../type-aliases/EventMap.md)

### TDirtyBucket

`TDirtyBucket` *extends* `string` = `string`

## Implements

- [`ILayer`](../interfaces/ILayer.md)

## Constructors

### Constructor

> **new Layer**\<`TOptions`, `TState`, `TEvents`, `TDirtyBucket`\>(`opts`): `Layer`\<`TOptions`, `TState`, `TEvents`, `TDirtyBucket`\>

#### Parameters

##### opts

[`LayerOptions`](../interfaces/LayerOptions.md)\<`TOptions`\>

#### Returns

`Layer`\<`TOptions`, `TState`, `TEvents`, `TDirtyBucket`\>

## Properties

### ctx?

> `protected` `optional` **ctx?**: [`CanvasContext`](../interfaces/CanvasContext.md)

Set by `mount(ctx)`; cleared by `unmount()`.

***

### cullable

> **cullable**: `boolean`

#### Implementation of

[`ILayer`](../interfaces/ILayer.md).[`cullable`](../interfaces/ILayer.md#cullable)

***

### dirty

> `readonly` **dirty**: [`DirtyBatcher`](DirtyBatcher.md)\<`TDirtyBucket`\>

***

### events

> `readonly` **events**: [`SourceEmitter`](SourceEmitter.md)\<`TEvents`\>

***

### hittable

> **hittable**: `boolean`

#### Implementation of

[`ILayer`](../interfaces/ILayer.md).[`hittable`](../interfaces/ILayer.md#hittable)

***

### id

> `readonly` **id**: `string`

#### Implementation of

[`ILayer`](../interfaces/ILayer.md).[`id`](../interfaces/ILayer.md#id)

***

### kind?

> `readonly` `optional` **kind?**: `string`

Stable **class kind** — a minification-safe discriminator matching the
`@invana/canvas-ui` settings-editor registry key (e.g. `'background-layer'`,
`'minimap-layer'`). Distinct from [id](#id) (the per-instance key): all
`BackgroundLayer` instances share `kind: 'background-layer'`. Concrete layers
set it as a class field; left `undefined` on any that haven't, so consumers
fall back (e.g. to the class name). Lets domain-free tooling resolve an
instance's editor without an `instanceof` ladder.

***

### options

> `readonly` **options**: `TOptions`

***

### zIndex

> **zIndex**: `number`

#### Implementation of

[`ILayer`](../interfaces/ILayer.md).[`zIndex`](../interfaces/ILayer.md#zindex)

## Accessors

### context

#### Get Signature

> **get** `protected` **context**(): [`CanvasContext`](../interfaces/CanvasContext.md)

Convenience accessor; throws when called pre-mount.

##### Returns

[`CanvasContext`](../interfaces/CanvasContext.md)

***

### mounted

#### Get Signature

> **get** **mounted**(): `boolean`

True between `mount` and `unmount`.

##### Returns

`boolean`

`true` between `mount(ctx)` and `unmount()`. Lets the registry skip already-mounted layers.

#### Implementation of

[`ILayer`](../interfaces/ILayer.md).[`mounted`](../interfaces/ILayer.md#mounted)

***

### state

#### Get Signature

> **get** **state**(): [`ReactiveStore`](../interfaces/ReactiveStore.md)\<`TState`\>

UI / interaction state (`ReactiveStore<TState>`). Because it is built
through the injected kernel factory, every write emits patches and history /
telemetry / a future CRDT backend all observe it.

**Available from `mount()` onward** — accessing it before the first mount
throws. (`createState()` is also called at first mount, so it may safely
read subclass fields initialised in the subclass constructor.)

##### Returns

[`ReactiveStore`](../interfaces/ReactiveStore.md)\<`TState`\>

***

### visible

#### Get Signature

> **get** **visible**(): `boolean`

Whether this layer renders. Setting `false` hides the layer's pixi
container (via `onVisibleChange`, overridden by `WorldLayer` /
`ScreenLayer`) and the Canvas tick skips its flush.

##### Returns

`boolean`

#### Set Signature

> **set** **visible**(`value`): `void`

##### Parameters

###### value

`boolean`

##### Returns

`void`

#### Implementation of

[`ILayer`](../interfaces/ILayer.md).[`visible`](../interfaces/ILayer.md#visible)

## Methods

### applyDirty()

> `protected` **applyDirty**(`_snap`): `void`

Translate a dirty snapshot into renderer / pixi commands.
Default: no-op. Override when the layer batches work via `dirty.mark(...)`.

#### Parameters

##### \_snap

[`DirtySnapshot`](../interfaces/DirtySnapshot.md)\<`TDirtyBucket`\>

#### Returns

`void`

***

### createState()

> `abstract` `protected` **createState**(): `TState`

Build the initial UI / interaction state. Called once in the constructor.

#### Returns

`TState`

***

### flush()

> **flush**(): `void`

Called by Canvas tick when `hasPending()` is true. Swaps the dirty
snapshot, hands it to `applyDirty`. Subclasses normally don't override.

#### Returns

`void`

#### Implementation of

[`ILayer`](../interfaces/ILayer.md).[`flush`](../interfaces/ILayer.md#flush)

***

### hasPending()

> **hasPending**(): `boolean`

Whether `flush()` has work to do this frame.

#### Returns

`boolean`

#### Implementation of

[`ILayer`](../interfaces/ILayer.md).[`hasPending`](../interfaces/ILayer.md#haspending)

***

### mount()

> **mount**(`ctx`): `void`

#### Parameters

##### ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

#### Implementation of

[`ILayer`](../interfaces/ILayer.md).[`mount`](../interfaces/ILayer.md#mount)

***

### onMount()

> `protected` **onMount**(`_ctx`): `void`

Domain-specific mount setup (subscribe to peers, attach renderer, etc.).

#### Parameters

##### \_ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

***

### onUnmount()

> `protected` **onUnmount**(`_ctx`): `void`

Domain-specific unmount teardown.

#### Parameters

##### \_ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

***

### onVisibleChange()

> `protected` **onVisibleChange**(`_value`): `void`

Called whenever `visible` changes (setter only — not on initial
construction). Subclasses override to keep their pixi container's
`.visible` in sync. Default: no-op.

#### Parameters

##### \_value

`boolean`

#### Returns

`void`

***

### redraw()

> **redraw**(): `void`

Force a full repaint of this layer from its current state, bypassing the
per-frame dirty path. Base implementation is a no-op — only layers that
mount a renderer override it (e.g. `GraphLayer.redraw` re-renders every
node and edge). Driven by Canvas.redraw; reach for it after an
external change that sidestepped the normal mutate-and-flush path (theme
swap, palette change) or to recover from a suspected render desync.

#### Returns

`void`

#### Implementation of

[`ILayer`](../interfaces/ILayer.md).[`redraw`](../interfaces/ILayer.md#redraw)

***

### setVisible()

> **setVisible**(`visible`): `void`

Toggle whole-layer visibility, repaint, and announce it. Unlike assigning
`visible` (which only hides the pixi container via [onVisibleChange](#onvisiblechange)),
this also forces a [redraw](#redraw) and emits `scene:layer:visibilitychange`
on the canvas bus so dependent layers (minimap) and the render loop react
automatically. No-op if the value is unchanged.

#### Parameters

##### visible

`boolean`

#### Returns

`void`

#### Implementation of

[`ILayer`](../interfaces/ILayer.md).[`setVisible`](../interfaces/ILayer.md#setvisible)

***

### unmount()

> **unmount**(): `void`

#### Returns

`void`

#### Implementation of

[`ILayer`](../interfaces/ILayer.md).[`unmount`](../interfaces/ILayer.md#unmount)
