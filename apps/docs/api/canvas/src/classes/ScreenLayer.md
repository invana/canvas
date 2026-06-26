# Abstract Class: ScreenLayer\<TOptions, TState, TEvents, TDirtyBucket, THit\>

Defined in: [canvas/src/layers/ScreenLayer.ts:29](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/ScreenLayer.ts#L29)

The subset of `Layer` the `LayerRegistry` and `Canvas.tick` interact with.
Lets the registry stay decoupled from the abstract class implementation.

## Extends

- [`Layer`](Layer.md)\<`TOptions`, `TState`, `TEvents`, `TDirtyBucket`\>

## Extended by

- [`DevInfoLayer`](DevInfoLayer.md)
- [`BackgroundLayer`](BackgroundLayer.md)
- [`LayersPanelLayer`](LayersPanelLayer.md)

## Type Parameters

### TOptions

`TOptions` = `unknown`

### TState

`TState` *extends* `object` = `object`

### TEvents

`TEvents` *extends* [`EventMap`](../type-aliases/EventMap.md) = [`EventMap`](../type-aliases/EventMap.md)

### TDirtyBucket

`TDirtyBucket` *extends* `string` = `string`

### THit

`THit` *extends* [`ScreenLayerHit`](../interfaces/ScreenLayerHit.md) = [`ScreenLayerHit`](../interfaces/ScreenLayerHit.md)

## Constructors

### Constructor

> **new ScreenLayer**\<`TOptions`, `TState`, `TEvents`, `TDirtyBucket`, `THit`\>(`opts`): `ScreenLayer`\<`TOptions`, `TState`, `TEvents`, `TDirtyBucket`, `THit`\>

Defined in: [canvas/src/layers/ScreenLayer.ts:52](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/ScreenLayer.ts#L52)

#### Parameters

##### opts

[`LayerOptions`](../interfaces/LayerOptions.md)\<`TOptions`\>

#### Returns

`ScreenLayer`\<`TOptions`, `TState`, `TEvents`, `TDirtyBucket`, `THit`\>

#### Overrides

[`Layer`](Layer.md).[`constructor`](Layer.md#constructor)

## Properties

### \_container?

> `protected` `optional` **\_container?**: `Container`

Defined in: [canvas/src/layers/ScreenLayer.ts:37](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/ScreenLayer.ts#L37)

Backing field — assigned in `mount`, cleared in `unmount`.

***

### ctx?

> `protected` `optional` **ctx?**: [`CanvasContext`](../interfaces/CanvasContext.md)

Defined in: [canvas/src/layers/Layer.ts:111](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L111)

Set by `mount(ctx)`; cleared by `unmount()`.

#### Inherited from

[`Layer`](Layer.md).[`ctx`](Layer.md#ctx)

***

### cullable

> **cullable**: `boolean`

Defined in: [canvas/src/layers/Layer.ts:94](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L94)

#### Inherited from

[`Layer`](Layer.md).[`cullable`](Layer.md#cullable)

***

### dirty

> `readonly` **dirty**: [`DirtyBatcher`](DirtyBatcher.md)\<`TDirtyBucket`\>

Defined in: [canvas/src/layers/Layer.ts:88](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L88)

#### Inherited from

[`Layer`](Layer.md).[`dirty`](Layer.md#dirty)

***

### events

> `readonly` **events**: [`SourceEmitter`](SourceEmitter.md)\<`TEvents`\>

Defined in: [canvas/src/layers/Layer.ts:87](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L87)

#### Inherited from

[`Layer`](Layer.md).[`events`](Layer.md#events)

***

### hittable

> **hittable**: `boolean`

Defined in: [canvas/src/layers/Layer.ts:92](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L92)

#### Inherited from

[`Layer`](Layer.md).[`hittable`](Layer.md#hittable)

***

### id

> `readonly` **id**: `string`

Defined in: [canvas/src/layers/Layer.ts:84](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L84)

#### Inherited from

[`Layer`](Layer.md).[`id`](Layer.md#id)

***

### options

> `readonly` **options**: `TOptions`

Defined in: [canvas/src/layers/Layer.ts:85](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L85)

#### Inherited from

[`Layer`](Layer.md).[`options`](Layer.md#options)

***

### state

> `readonly` **state**: [`Store`](../type-aliases/Store.md)\<`TState`\>

Defined in: [canvas/src/layers/Layer.ts:86](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L86)

#### Inherited from

[`Layer`](Layer.md).[`state`](Layer.md#state)

***

### zIndex

> **zIndex**: `number`

Defined in: [canvas/src/layers/Layer.ts:93](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L93)

#### Inherited from

[`Layer`](Layer.md).[`zIndex`](Layer.md#zindex)

## Accessors

### container

#### Get Signature

> **get** `protected` **container**(): `Container`

Defined in: [canvas/src/layers/ScreenLayer.ts:45](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/ScreenLayer.ts#L45)

Root pixi `Container` for this screen-space layer. Available from
`onMount(ctx)` for the layer's lifetime. Throws before mount / after unmount.

Subclass-only — not part of the external layer API.

##### Returns

`Container`

***

### context

#### Get Signature

> **get** `protected` **context**(): [`CanvasContext`](../interfaces/CanvasContext.md)

Defined in: [canvas/src/layers/Layer.ts:159](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L159)

Convenience accessor; throws when called pre-mount.

##### Returns

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Inherited from

[`Layer`](Layer.md).[`context`](Layer.md#context)

***

### mounted

#### Get Signature

> **get** **mounted**(): `boolean`

Defined in: [canvas/src/layers/Layer.ts:114](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L114)

True between `mount` and `unmount`.

##### Returns

`boolean`

`true` between `mount(ctx)` and `unmount()`. Lets the registry skip already-mounted layers.

#### Inherited from

[`Layer`](Layer.md).[`mounted`](Layer.md#mounted)

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

#### Inherited from

[`Layer`](Layer.md).[`visible`](Layer.md#visible)

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

#### Inherited from

[`Layer`](Layer.md).[`applyDirty`](Layer.md#applydirty)

***

### createContainer()

> **createContainer**(`label?`): `Container`

Defined in: [canvas/src/layers/ScreenLayer.ts:99](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/ScreenLayer.ts#L99)

Create a plain pixi `Container` attached to this layer's root container.
Useful as a parent for mounted display objects.

#### Parameters

##### label?

`string`

#### Returns

`Container`

***

### createGraphics()

> **createGraphics**(`label?`): `Graphics`

Defined in: [canvas/src/layers/ScreenLayer.ts:88](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/ScreenLayer.ts#L88)

Create a pixi `Graphics` attached to this layer's root container. The
sanctioned way for layer authors to obtain a `Graphics` for direct
painting via `@invana/canvas/draw` primitives.

#### Parameters

##### label?

`string`

#### Returns

`Graphics`

***

### createState()

> `abstract` `protected` **createState**(): `TState`

Defined in: [canvas/src/layers/Layer.ts:198](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L198)

Build the initial UI / interaction state. Called once in the constructor.

#### Returns

`TState`

#### Inherited from

[`Layer`](Layer.md).[`createState`](Layer.md#createstate)

***

### flush()

> **flush**(): `void`

Defined in: [canvas/src/layers/Layer.ts:177](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L177)

Called by Canvas tick when `hasPending()` is true. Swaps the dirty
snapshot, hands it to `applyDirty`. Subclasses normally don't override.

#### Returns

`void`

#### Inherited from

[`Layer`](Layer.md).[`flush`](Layer.md#flush)

***

### hasPending()

> **hasPending**(): `boolean`

Defined in: [canvas/src/layers/Layer.ts:169](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L169)

Whether `flush()` has work to do this frame.

#### Returns

`boolean`

#### Inherited from

[`Layer`](Layer.md).[`hasPending`](Layer.md#haspending)

***

### hitTest()

> `abstract` **hitTest**(`screenX`, `screenY`): `THit`

Defined in: [canvas/src/layers/ScreenLayer.ts:121](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/ScreenLayer.ts#L121)

Hit-test in screen / viewport coordinates. Top-most hit or `null`.

#### Parameters

##### screenX

`number`

##### screenY

`number`

#### Returns

`THit`

***

### mount()

> **mount**(`ctx`): `void`

Defined in: [canvas/src/layers/ScreenLayer.ts:56](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/ScreenLayer.ts#L56)

#### Parameters

##### ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

#### Overrides

[`Layer`](Layer.md).[`mount`](Layer.md#mount)

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

#### Inherited from

[`Layer`](Layer.md).[`onMount`](Layer.md#onmount)

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

#### Inherited from

[`Layer`](Layer.md).[`onUnmount`](Layer.md#onunmount)

***

### onVisibleChange()

> `protected` **onVisibleChange**(`value`): `void`

Defined in: [canvas/src/layers/ScreenLayer.ts:72](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/ScreenLayer.ts#L72)

Keep the pixi container in sync when `layer.visible` is toggled.

#### Parameters

##### value

`boolean`

#### Returns

`void`

#### Overrides

[`Layer`](Layer.md).[`onVisibleChange`](Layer.md#onvisiblechange)

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

#### Inherited from

[`Layer`](Layer.md).[`redraw`](Layer.md#redraw)

***

### setZIndex()

> **setZIndex**(`z`): `void`

Defined in: [canvas/src/layers/ScreenLayer.ts:111](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/ScreenLayer.ts#L111)

Update this layer's z-order relative to its peers. Keeps the iteration
field (`this.zIndex`) and the pixi container's `zIndex` in sync, and
flips `ctx.stage` into sorted mode so the change renders.

#### Parameters

##### z

`number`

#### Returns

`void`

***

### unmount()

> **unmount**(): `void`

Defined in: [canvas/src/layers/ScreenLayer.ts:76](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/ScreenLayer.ts#L76)

#### Returns

`void`

#### Overrides

[`Layer`](Layer.md).[`unmount`](Layer.md#unmount)
