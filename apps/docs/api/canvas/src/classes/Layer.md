# Abstract Class: Layer\<TOptions, TState, TEvents, TDirtyBucket\>

Defined in: [canvas/src/layers/Layer.ts:77](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L77)

The subset of `Layer` the `LayerRegistry` and `Canvas.tick` interact with.
Lets the registry stay decoupled from the abstract class implementation.

## Extended by

- [`WorldLayer`](WorldLayer.md)
- [`ScreenLayer`](ScreenLayer.md)

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

Defined in: [canvas/src/layers/Layer.ts:118](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L118)

#### Parameters

##### opts

[`LayerOptions`](../interfaces/LayerOptions.md)\<`TOptions`\>

#### Returns

`Layer`\<`TOptions`, `TState`, `TEvents`, `TDirtyBucket`\>

## Properties

### ctx?

> `protected` `optional` **ctx?**: [`CanvasContext`](../interfaces/CanvasContext.md)

Defined in: [canvas/src/layers/Layer.ts:111](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L111)

Set by `mount(ctx)`; cleared by `unmount()`.

***

### cullable

> **cullable**: `boolean`

Defined in: [canvas/src/layers/Layer.ts:94](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L94)

#### Implementation of

[`ILayer`](../interfaces/ILayer.md).[`cullable`](../interfaces/ILayer.md#cullable)

***

### dirty

> `readonly` **dirty**: [`DirtyBatcher`](DirtyBatcher.md)\<`TDirtyBucket`\>

Defined in: [canvas/src/layers/Layer.ts:88](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L88)

***

### events

> `readonly` **events**: [`SourceEmitter`](SourceEmitter.md)\<`TEvents`\>

Defined in: [canvas/src/layers/Layer.ts:87](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L87)

***

### hittable

> **hittable**: `boolean`

Defined in: [canvas/src/layers/Layer.ts:92](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L92)

#### Implementation of

[`ILayer`](../interfaces/ILayer.md).[`hittable`](../interfaces/ILayer.md#hittable)

***

### id

> `readonly` **id**: `string`

Defined in: [canvas/src/layers/Layer.ts:84](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L84)

#### Implementation of

[`ILayer`](../interfaces/ILayer.md).[`id`](../interfaces/ILayer.md#id)

***

### options

> `readonly` **options**: `TOptions`

Defined in: [canvas/src/layers/Layer.ts:85](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L85)

***

### state

> `readonly` **state**: [`Store`](../type-aliases/Store.md)\<`TState`\>

Defined in: [canvas/src/layers/Layer.ts:86](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L86)

***

### zIndex

> **zIndex**: `number`

Defined in: [canvas/src/layers/Layer.ts:93](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L93)

#### Implementation of

[`ILayer`](../interfaces/ILayer.md).[`zIndex`](../interfaces/ILayer.md#zindex)

## Accessors

### context

#### Get Signature

> **get** `protected` **context**(): [`CanvasContext`](../interfaces/CanvasContext.md)

Defined in: [canvas/src/layers/Layer.ts:159](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L159)

Convenience accessor; throws when called pre-mount.

##### Returns

[`CanvasContext`](../interfaces/CanvasContext.md)

***

### mounted

#### Get Signature

> **get** **mounted**(): `boolean`

Defined in: [canvas/src/layers/Layer.ts:114](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L114)

True between `mount` and `unmount`.

##### Returns

`boolean`

`true` between `mount(ctx)` and `unmount()`. Lets the registry skip already-mounted layers.

#### Implementation of

[`ILayer`](../interfaces/ILayer.md).[`mounted`](../interfaces/ILayer.md#mounted)

***

### visible

#### Get Signature

> **get** **visible**(): `boolean`

Defined in: [canvas/src/layers/Layer.ts:101](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L101)

Whether this layer renders. Setting `false` hides the layer's pixi
container (via `onVisibleChange`, overridden by `WorldLayer` /
`ScreenLayer`) and the Canvas tick skips its flush.

##### Returns

`boolean`

#### Set Signature

> **set** **visible**(`value`): `void`

Defined in: [canvas/src/layers/Layer.ts:104](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L104)

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

Defined in: [canvas/src/layers/Layer.ts:204](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L204)

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

Defined in: [canvas/src/layers/Layer.ts:198](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L198)

Build the initial UI / interaction state. Called once in the constructor.

#### Returns

`TState`

***

### flush()

> **flush**(): `void`

Defined in: [canvas/src/layers/Layer.ts:177](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L177)

Called by Canvas tick when `hasPending()` is true. Swaps the dirty
snapshot, hands it to `applyDirty`. Subclasses normally don't override.

#### Returns

`void`

#### Implementation of

[`ILayer`](../interfaces/ILayer.md).[`flush`](../interfaces/ILayer.md#flush)

***

### hasPending()

> **hasPending**(): `boolean`

Defined in: [canvas/src/layers/Layer.ts:169](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L169)

Whether `flush()` has work to do this frame.

#### Returns

`boolean`

#### Implementation of

[`ILayer`](../interfaces/ILayer.md).[`hasPending`](../interfaces/ILayer.md#haspending)

***

### mount()

> **mount**(`ctx`): `void`

Defined in: [canvas/src/layers/Layer.ts:140](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L140)

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

Defined in: [canvas/src/layers/Layer.ts:209](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L209)

Domain-specific mount setup (subscribe to peers, attach renderer, etc.).

#### Parameters

##### \_ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

***

### onUnmount()

> `protected` **onUnmount**(`_ctx`): `void`

Defined in: [canvas/src/layers/Layer.ts:214](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L214)

Domain-specific unmount teardown.

#### Parameters

##### \_ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

***

### onVisibleChange()

> `protected` **onVisibleChange**(`_value`): `void`

Defined in: [canvas/src/layers/Layer.ts:223](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L223)

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

Defined in: [canvas/src/layers/Layer.ts:191](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L191)

Force a full repaint of this layer from its current state, bypassing the
per-frame dirty path. Base implementation is a no-op — only layers that
mount a renderer override it (e.g. `GraphLayer.redraw` re-renders every
node and edge). Driven by [Canvas.redraw](Canvas.md#redraw); reach for it after an
external change that sidestepped the normal mutate-and-flush path (theme
swap, palette change) or to recover from a suspected render desync.

#### Returns

`void`

#### Implementation of

[`ILayer`](../interfaces/ILayer.md).[`redraw`](../interfaces/ILayer.md#redraw)

***

### unmount()

> **unmount**(): `void`

Defined in: [canvas/src/layers/Layer.ts:149](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L149)

#### Returns

`void`

#### Implementation of

[`ILayer`](../interfaces/ILayer.md).[`unmount`](../interfaces/ILayer.md#unmount)
