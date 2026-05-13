# Class: GraphLayer

Defined in: packages/graph/src/layer/GraphLayer.ts:88

The subset of `Layer` the `LayerRegistry` and `Canvas.tick` interact with.
Lets the registry stay decoupled from the abstract class implementation.

## Extends

- [`WorldLayer`](../../../canvas/src/classes/WorldLayer.md)\<[`GraphLayerOptions`](../interfaces/GraphLayerOptions.md), `GraphLayerState`, [`GraphLayerEvents`](../interfaces/GraphLayerEvents.md), `never`, [`WorldLayerHit`](../../../canvas/src/interfaces/WorldLayerHit.md)\>

## Constructors

### Constructor

> **new GraphLayer**(`opts`): `GraphLayer`

Defined in: packages/graph/src/layer/GraphLayer.ts:108

#### Parameters

##### opts

[`LayerOptions`](../../../canvas/src/interfaces/LayerOptions.md)\<[`GraphLayerOptions`](../interfaces/GraphLayerOptions.md)\>

#### Returns

`GraphLayer`

#### Overrides

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`constructor`](../../../canvas/src/classes/WorldLayer.md#constructor)

## Properties

### \_container?

> `protected` `optional` **\_container?**: `Container`

Defined in: [packages/canvas/src/layers/WorldLayer.ts:38](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/WorldLayer.ts#L38)

Backing field — assigned in `mount`, cleared in `unmount`.

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`_container`](../../../canvas/src/classes/WorldLayer.md#_container)

***

### ctx?

> `protected` `optional` **ctx?**: [`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

Defined in: [packages/canvas/src/layers/Layer.ts:108](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/Layer.ts#L108)

Set by `mount(ctx)`; cleared by `unmount()`.

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`ctx`](../../../canvas/src/classes/WorldLayer.md#ctx)

***

### cullable

> **cullable**: `boolean`

Defined in: [packages/canvas/src/layers/Layer.ts:91](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/Layer.ts#L91)

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`cullable`](../../../canvas/src/classes/WorldLayer.md#cullable)

***

### dirty

> `readonly` **dirty**: [`DirtyBatcher`](../../../canvas/src/classes/DirtyBatcher.md)\<`never`\>

Defined in: [packages/canvas/src/layers/Layer.ts:85](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/Layer.ts#L85)

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`dirty`](../../../canvas/src/classes/WorldLayer.md#dirty)

***

### events

> `readonly` **events**: [`SourceEmitter`](../../../canvas/src/classes/SourceEmitter.md)\<[`GraphLayerEvents`](../interfaces/GraphLayerEvents.md)\>

Defined in: [packages/canvas/src/layers/Layer.ts:84](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/Layer.ts#L84)

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`events`](../../../canvas/src/classes/WorldLayer.md#events)

***

### hittable

> **hittable**: `boolean`

Defined in: [packages/canvas/src/layers/Layer.ts:89](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/Layer.ts#L89)

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`hittable`](../../../canvas/src/classes/WorldLayer.md#hittable)

***

### id

> `readonly` **id**: `string`

Defined in: [packages/canvas/src/layers/Layer.ts:81](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/Layer.ts#L81)

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`id`](../../../canvas/src/classes/WorldLayer.md#id)

***

### options

> `readonly` **options**: [`GraphLayerOptions`](../interfaces/GraphLayerOptions.md)

Defined in: [packages/canvas/src/layers/Layer.ts:82](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/Layer.ts#L82)

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`options`](../../../canvas/src/classes/WorldLayer.md#options)

***

### state

> `readonly` **state**: [`Store`](../../../canvas/src/type-aliases/Store.md)\<`GraphLayerState`\>

Defined in: [packages/canvas/src/layers/Layer.ts:83](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/Layer.ts#L83)

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`state`](../../../canvas/src/classes/WorldLayer.md#state)

***

### store

> `readonly` **store**: [`GraphStore`](GraphStore.md)

Defined in: packages/graph/src/layer/GraphLayer.ts:99

Data source. Either supplied by the caller or self-created.

***

### zIndex

> **zIndex**: `number`

Defined in: [packages/canvas/src/layers/Layer.ts:90](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/Layer.ts#L90)

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`zIndex`](../../../canvas/src/classes/WorldLayer.md#zindex)

## Accessors

### container

#### Get Signature

> **get** `protected` **container**(): `Container`

Defined in: [packages/canvas/src/layers/WorldLayer.ts:47](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/WorldLayer.ts#L47)

Root pixi `Container` (RenderGroup) for this layer. Available from
`onMount(ctx)` for the layer's lifetime. Throws before mount / after unmount.

Pass to `ShapesRenderer` as the `container` option when wiring up a renderer
inside `onMount`. Subclass-only — not part of the external layer API.

##### Returns

`Container`

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`container`](../../../canvas/src/classes/WorldLayer.md#container)

***

### context

#### Get Signature

> **get** `protected` **context**(): [`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

Defined in: [packages/canvas/src/layers/Layer.ts:156](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/Layer.ts#L156)

Convenience accessor; throws when called pre-mount.

##### Returns

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`context`](../../../canvas/src/classes/WorldLayer.md#context)

***

### mounted

#### Get Signature

> **get** **mounted**(): `boolean`

Defined in: [packages/canvas/src/layers/Layer.ts:111](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/Layer.ts#L111)

True between `mount` and `unmount`.

##### Returns

`boolean`

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`mounted`](../../../canvas/src/classes/WorldLayer.md#mounted)

***

### visible

#### Get Signature

> **get** **visible**(): `boolean`

Defined in: [packages/canvas/src/layers/Layer.ts:98](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/Layer.ts#L98)

Whether this layer renders. Setting `false` hides the layer's pixi
container (via `onVisibleChange`, overridden by `WorldLayer` /
`ScreenLayer`) and the Canvas tick skips its flush.

##### Returns

`boolean`

#### Set Signature

> **set** **visible**(`value`): `void`

Defined in: [packages/canvas/src/layers/Layer.ts:101](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/Layer.ts#L101)

##### Parameters

###### value

`boolean`

##### Returns

`void`

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`visible`](../../../canvas/src/classes/WorldLayer.md#visible)

## Methods

### addEdge()

> **addEdge**\<`D`\>(`edge`): `void`

Defined in: packages/graph/src/layer/GraphLayer.ts:189

Pass-through to the underlying store.

#### Type Parameters

##### D

`D`

#### Parameters

##### edge

[`GraphEdge`](../interfaces/GraphEdge.md)\<`D`\>

#### Returns

`void`

***

### addNode()

> **addNode**\<`D`\>(`node`): `void`

Defined in: packages/graph/src/layer/GraphLayer.ts:184

Pass-through to the underlying store.

#### Type Parameters

##### D

`D`

#### Parameters

##### node

[`GraphNode`](../interfaces/GraphNode.md)\<`D`\>

#### Returns

`void`

***

### applyDirty()

> `protected` **applyDirty**(`_snap`): `void`

Defined in: [packages/canvas/src/layers/Layer.ts:189](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/Layer.ts#L189)

Translate a dirty snapshot into renderer / pixi commands.
Default: no-op. Override when the layer batches work via `dirty.mark(...)`.

#### Parameters

##### \_snap

[`DirtySnapshot`](../../../canvas/src/interfaces/DirtySnapshot.md)\<`never`\>

#### Returns

`void`

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`applyDirty`](../../../canvas/src/classes/WorldLayer.md#applydirty)

***

### createContainer()

> **createContainer**(`label?`): `Container`

Defined in: [packages/canvas/src/layers/WorldLayer.ts:102](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/WorldLayer.ts#L102)

Create a plain pixi `Container` attached to this layer's root container.
Useful as a parent for mounted display objects (e.g. text sprites).

#### Parameters

##### label?

`string`

#### Returns

`Container`

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`createContainer`](../../../canvas/src/classes/WorldLayer.md#createcontainer)

***

### createGraphics()

> **createGraphics**(`label?`): [`Graphics`](../../../canvas/src/interfaces/Graphics.md)

Defined in: [packages/canvas/src/layers/WorldLayer.ts:91](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/WorldLayer.ts#L91)

Create a pixi `Graphics` attached to this layer's root container. The
sanctioned way for layer authors to obtain a `Graphics` for direct
painting via `@invana/canvas/draw` primitives — keeps pixi internal
(no `new Graphics()` in user code).

#### Parameters

##### label?

`string`

#### Returns

[`Graphics`](../../../canvas/src/interfaces/Graphics.md)

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`createGraphics`](../../../canvas/src/classes/WorldLayer.md#creategraphics)

***

### createState()

> `protected` **createState**(): `GraphLayerState`

Defined in: packages/graph/src/layer/GraphLayer.ts:115

Build the initial UI / interaction state. Called once in the constructor.

#### Returns

`GraphLayerState`

#### Overrides

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`createState`](../../../canvas/src/classes/WorldLayer.md#createstate)

***

### flush()

> **flush**(): `void`

Defined in: [packages/canvas/src/layers/Layer.ts:174](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/Layer.ts#L174)

Called by Canvas tick when `hasPending()` is true. Swaps the dirty
snapshot, hands it to `applyDirty`. Subclasses normally don't override.

#### Returns

`void`

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`flush`](../../../canvas/src/classes/WorldLayer.md#flush)

***

### getBounds()

> **getBounds**(): `object`

Defined in: [packages/canvas/src/layers/WorldLayer.ts:129](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/WorldLayer.ts#L129)

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

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`getBounds`](../../../canvas/src/classes/WorldLayer.md#getbounds)

***

### hasPending()

> **hasPending**(): `boolean`

Defined in: [packages/canvas/src/layers/Layer.ts:166](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/Layer.ts#L166)

Whether `flush()` has work to do this frame.

#### Returns

`boolean`

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`hasPending`](../../../canvas/src/classes/WorldLayer.md#haspending)

***

### hitTest()

> **hitTest**(`_worldX`, `_worldY`): [`WorldLayerHit`](../../../canvas/src/interfaces/WorldLayerHit.md)

Defined in: packages/graph/src/layer/GraphLayer.ts:210

Placeholder hit test — returns `null` until proper hit testing wires up
in a later phase (likely via the canvas hit-test pipeline reading the
renderer's shape registry).

#### Parameters

##### \_worldX

`number`

##### \_worldY

`number`

#### Returns

[`WorldLayerHit`](../../../canvas/src/interfaces/WorldLayerHit.md)

#### Overrides

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`hitTest`](../../../canvas/src/classes/WorldLayer.md#hittest)

***

### mount()

> **mount**(`ctx`): `void`

Defined in: [packages/canvas/src/layers/WorldLayer.ts:58](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/WorldLayer.ts#L58)

#### Parameters

##### ctx

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Returns

`void`

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`mount`](../../../canvas/src/classes/WorldLayer.md#mount)

***

### onMount()

> `protected` **onMount**(`ctx`): `void`

Defined in: packages/graph/src/layer/GraphLayer.ts:119

Domain-specific mount setup (subscribe to peers, attach renderer, etc.).

#### Parameters

##### ctx

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Returns

`void`

#### Overrides

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`onMount`](../../../canvas/src/classes/WorldLayer.md#onmount)

***

### onUnmount()

> `protected` **onUnmount**(): `void`

Defined in: packages/graph/src/layer/GraphLayer.ts:162

Domain-specific unmount teardown.

#### Returns

`void`

#### Overrides

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`onUnmount`](../../../canvas/src/classes/WorldLayer.md#onunmount)

***

### onVisibleChange()

> `protected` **onVisibleChange**(`value`): `void`

Defined in: [packages/canvas/src/layers/WorldLayer.ts:74](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/WorldLayer.ts#L74)

Keep the pixi container in sync when `layer.visible` is toggled.

#### Parameters

##### value

`boolean`

#### Returns

`void`

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`onVisibleChange`](../../../canvas/src/classes/WorldLayer.md#onvisiblechange)

***

### removeEdge()

> **removeEdge**(`id`): `void`

Defined in: packages/graph/src/layer/GraphLayer.ts:199

Pass-through to the underlying store.

#### Parameters

##### id

`string`

#### Returns

`void`

***

### removeNode()

> **removeNode**(`id`, `opts?`): `void`

Defined in: packages/graph/src/layer/GraphLayer.ts:194

Pass-through to the underlying store.

#### Parameters

##### id

`string`

##### opts?

###### cascade?

`boolean`

#### Returns

`void`

***

### setData()

> **setData**(`data`): `void`

Defined in: packages/graph/src/layer/GraphLayer.ts:175

Bulk-load nodes + edges. Wraps the underlying store inserts in a single
`batch()` so subscribers see one flush.

#### Parameters

##### data

[`GraphData`](../interfaces/GraphData.md)

#### Returns

`void`

***

### setZIndex()

> **setZIndex**(`z`): `void`

Defined in: [packages/canvas/src/layers/WorldLayer.ts:115](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/WorldLayer.ts#L115)

Update this layer's z-order relative to its peers. Keeps the iteration
field (`this.zIndex`, used by `LayerRegistry.byZOrder()`) and the pixi
container's `zIndex` in sync, and flips `surfaces.world` into sorted mode
so the change renders.

#### Parameters

##### z

`number`

#### Returns

`void`

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`setZIndex`](../../../canvas/src/classes/WorldLayer.md#setzindex)

***

### unmount()

> **unmount**(): `void`

Defined in: [packages/canvas/src/layers/WorldLayer.ts:78](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/WorldLayer.ts#L78)

#### Returns

`void`

#### Inherited from

[`WorldLayer`](../../../canvas/src/classes/WorldLayer.md).[`unmount`](../../../canvas/src/classes/WorldLayer.md#unmount)
