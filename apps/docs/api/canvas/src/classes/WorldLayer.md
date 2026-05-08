# Abstract Class: WorldLayer\<TOptions, TState, TEvents, TDirtyBucket, THit\>

Defined in: [packages/canvas/src/layers/WorldLayer.ts:30](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/WorldLayer.ts#L30)

The subset of `Layer` the `LayerRegistry` and `Canvas.tick` interact with.
Lets the registry stay decoupled from the abstract class implementation.

## Extends

- [`Layer`](Layer.md)\<`TOptions`, `TState`, `TEvents`, `TDirtyBucket`\>

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

`THit` *extends* [`WorldLayerHit`](../interfaces/WorldLayerHit.md) = [`WorldLayerHit`](../interfaces/WorldLayerHit.md)

## Constructors

### Constructor

> **new WorldLayer**\<`TOptions`, `TState`, `TEvents`, `TDirtyBucket`, `THit`\>(`opts`): `WorldLayer`\<`TOptions`, `TState`, `TEvents`, `TDirtyBucket`, `THit`\>

Defined in: [packages/canvas/src/layers/WorldLayer.ts:54](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/WorldLayer.ts#L54)

#### Parameters

##### opts

[`LayerOptions`](../interfaces/LayerOptions.md)\<`TOptions`\>

#### Returns

`WorldLayer`\<`TOptions`, `TState`, `TEvents`, `TDirtyBucket`, `THit`\>

#### Overrides

[`Layer`](Layer.md).[`constructor`](Layer.md#constructor)

## Properties

### ctx?

> `protected` `optional` **ctx?**: [`CanvasContext`](../interfaces/CanvasContext.md)

Defined in: [packages/canvas/src/layers/Layer.ts:93](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L93)

Set by `mount(ctx)`; cleared by `unmount()`.

#### Inherited from

[`Layer`](Layer.md).[`ctx`](Layer.md#ctx)

***

### cullable

> **cullable**: `boolean`

Defined in: [packages/canvas/src/layers/Layer.ts:90](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L90)

#### Inherited from

[`Layer`](Layer.md).[`cullable`](Layer.md#cullable)

***

### dirty

> `readonly` **dirty**: [`DirtyBatcher`](DirtyBatcher.md)\<`TDirtyBucket`\>

Defined in: [packages/canvas/src/layers/Layer.ts:85](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L85)

#### Inherited from

[`Layer`](Layer.md).[`dirty`](Layer.md#dirty)

***

### events

> `readonly` **events**: [`SourceEmitter`](SourceEmitter.md)\<`TEvents`\>

Defined in: [packages/canvas/src/layers/Layer.ts:84](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L84)

#### Inherited from

[`Layer`](Layer.md).[`events`](Layer.md#events)

***

### hittable

> **hittable**: `boolean`

Defined in: [packages/canvas/src/layers/Layer.ts:88](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L88)

#### Inherited from

[`Layer`](Layer.md).[`hittable`](Layer.md#hittable)

***

### id

> `readonly` **id**: `string`

Defined in: [packages/canvas/src/layers/Layer.ts:81](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L81)

#### Inherited from

[`Layer`](Layer.md).[`id`](Layer.md#id)

***

### options

> `readonly` **options**: `TOptions`

Defined in: [packages/canvas/src/layers/Layer.ts:82](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L82)

#### Inherited from

[`Layer`](Layer.md).[`options`](Layer.md#options)

***

### state

> `readonly` **state**: [`Store`](../type-aliases/Store.md)\<`TState`\>

Defined in: [packages/canvas/src/layers/Layer.ts:83](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L83)

#### Inherited from

[`Layer`](Layer.md).[`state`](Layer.md#state)

***

### visible

> **visible**: `boolean`

Defined in: [packages/canvas/src/layers/Layer.ts:87](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L87)

#### Inherited from

[`Layer`](Layer.md).[`visible`](Layer.md#visible)

***

### zIndex

> **zIndex**: `number`

Defined in: [packages/canvas/src/layers/Layer.ts:89](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L89)

#### Inherited from

[`Layer`](Layer.md).[`zIndex`](Layer.md#zindex)

## Accessors

### container

#### Get Signature

> **get** `protected` **container**(): `Container`

Defined in: [packages/canvas/src/layers/WorldLayer.ts:47](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/WorldLayer.ts#L47)

Root pixi `Container` (RenderGroup) for this layer. Available from
`onMount(ctx)` for the layer's lifetime. Throws before mount / after unmount.

Pass to `ShapesRenderer` as the `container` option when wiring up a renderer
inside `onMount`. Subclass-only — not part of the external layer API.

##### Returns

`Container`

***

### context

#### Get Signature

> **get** `protected` **context**(): [`CanvasContext`](../interfaces/CanvasContext.md)

Defined in: [packages/canvas/src/layers/Layer.ts:141](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L141)

Convenience accessor; throws when called pre-mount.

##### Returns

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Inherited from

[`Layer`](Layer.md).[`context`](Layer.md#context)

***

### mounted

#### Get Signature

> **get** **mounted**(): `boolean`

Defined in: [packages/canvas/src/layers/Layer.ts:96](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L96)

True between `mount` and `unmount`.

##### Returns

`boolean`

#### Inherited from

[`Layer`](Layer.md).[`mounted`](Layer.md#mounted)

## Methods

### applyDirty()

> `protected` **applyDirty**(`_snap`): `void`

Defined in: [packages/canvas/src/layers/Layer.ts:174](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L174)

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

Defined in: [packages/canvas/src/layers/WorldLayer.ts:96](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/WorldLayer.ts#L96)

Create a plain pixi `Container` attached to this layer's root container.
Useful as a parent for mounted display objects (e.g. text sprites).

#### Parameters

##### label?

`string`

#### Returns

`Container`

***

### createGraphics()

> **createGraphics**(`label?`): [`Graphics`](../interfaces/Graphics.md)

Defined in: [packages/canvas/src/layers/WorldLayer.ts:85](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/WorldLayer.ts#L85)

Create a pixi `Graphics` attached to this layer's root container. The
sanctioned way for layer authors to obtain a `Graphics` for direct
painting via `@invana/canvas/draw` primitives — keeps pixi internal
(no `new Graphics()` in user code).

#### Parameters

##### label?

`string`

#### Returns

[`Graphics`](../interfaces/Graphics.md)

***

### createState()

> `abstract` `protected` **createState**(): `TState`

Defined in: [packages/canvas/src/layers/Layer.ts:168](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L168)

Build the initial UI / interaction state. Called once in the constructor.

#### Returns

`TState`

#### Inherited from

[`Layer`](Layer.md).[`createState`](Layer.md#createstate)

***

### flush()

> **flush**(): `void`

Defined in: [packages/canvas/src/layers/Layer.ts:159](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L159)

Called by Canvas tick when `hasPending()` is true. Swaps the dirty
snapshot, hands it to `applyDirty`. Subclasses normally don't override.

#### Returns

`void`

#### Inherited from

[`Layer`](Layer.md).[`flush`](Layer.md#flush)

***

### getBounds()

> **getBounds**(): `object`

Defined in: [packages/canvas/src/layers/WorldLayer.ts:123](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/WorldLayer.ts#L123)

Return the world-space AABB of everything currently rendered on this layer.
Delegates to Pixi's `getLocalBounds()` — a one-shot scene-graph traversal.
Suitable for "fit to content" calls; do not call every frame.

#### Returns

`object`

##### height

> **height**: `number`

##### width

> **width**: `number`

##### x

> **x**: `number`

##### y

> **y**: `number`

***

### hasPending()

> **hasPending**(): `boolean`

Defined in: [packages/canvas/src/layers/Layer.ts:151](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L151)

Whether `flush()` has work to do this frame.

#### Returns

`boolean`

#### Inherited from

[`Layer`](Layer.md).[`hasPending`](Layer.md#haspending)

***

### hitTest()

> `abstract` **hitTest**(`worldX`, `worldY`): `THit`

Defined in: [packages/canvas/src/layers/WorldLayer.ts:135](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/WorldLayer.ts#L135)

Hit-test in world coordinates. Returns the topmost hit or `null`.
Concrete layers implement this against their own data + spatial index.

The `Canvas`-level hit-test orchestration (top-down by z-order, stop on
first hit, screen-layers-before-world per proposal Q6) calls this.

#### Parameters

##### worldX

`number`

##### worldY

`number`

#### Returns

`THit`

***

### mount()

> **mount**(`ctx`): `void`

Defined in: [packages/canvas/src/layers/WorldLayer.ts:58](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/WorldLayer.ts#L58)

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

Defined in: [packages/canvas/src/layers/Layer.ts:179](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L179)

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

Defined in: [packages/canvas/src/layers/Layer.ts:184](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/Layer.ts#L184)

Domain-specific unmount teardown.

#### Parameters

##### \_ctx

[`CanvasContext`](../interfaces/CanvasContext.md)

#### Returns

`void`

#### Inherited from

[`Layer`](Layer.md).[`onUnmount`](Layer.md#onunmount)

***

### setZIndex()

> **setZIndex**(`z`): `void`

Defined in: [packages/canvas/src/layers/WorldLayer.ts:109](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/WorldLayer.ts#L109)

Update this layer's z-order relative to its peers. Keeps the iteration
field (`this.zIndex`, used by `LayerRegistry.byZOrder()`) and the pixi
container's `zIndex` in sync, and flips `surfaces.world` into sorted mode
so the change renders.

#### Parameters

##### z

`number`

#### Returns

`void`

***

### unmount()

> **unmount**(): `void`

Defined in: [packages/canvas/src/layers/WorldLayer.ts:72](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/layers/WorldLayer.ts#L72)

#### Returns

`void`

#### Overrides

[`Layer`](Layer.md).[`unmount`](Layer.md#unmount)
