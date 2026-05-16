# Class: DensityContourStrokeLayer

Defined in: [graph-layer-d3-contour/src/DensityContourStrokeLayer.ts:35](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph-layer-d3-contour/src/DensityContourStrokeLayer.ts#L35)

The subset of `Layer` the `LayerRegistry` and `Canvas.tick` interact with.
Lets the registry stay decoupled from the abstract class implementation.

## Extends

- [`DensityContourLayerBase`](DensityContourLayerBase.md)\<[`DensityContourStrokeLayerOptions`](../interfaces/DensityContourStrokeLayerOptions.md)\>

## Constructors

### Constructor

> **new DensityContourStrokeLayer**(`opts`): `DensityContourStrokeLayer`

Defined in: [graph-layer-d3-contour/src/DensityContourLayerBase.ts:56](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph-layer-d3-contour/src/DensityContourLayerBase.ts#L56)

#### Parameters

##### opts

[`LayerOptions`](../../../canvas/src/interfaces/LayerOptions.md)\<[`DensityContourStrokeLayerOptions`](../interfaces/DensityContourStrokeLayerOptions.md)\>

#### Returns

`DensityContourStrokeLayer`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`constructor`](DensityContourLayerBase.md#constructor)

## Properties

### \_container?

> `protected` `optional` **\_container?**: `Container`

Defined in: [canvas/src/layers/WorldLayer.ts:38](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/WorldLayer.ts#L38)

Backing field — assigned in `mount`, cleared in `unmount`.

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`_container`](DensityContourLayerBase.md#_container)

***

### ctx?

> `protected` `optional` **ctx?**: [`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

Defined in: [canvas/src/layers/Layer.ts:108](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/Layer.ts#L108)

Set by `mount(ctx)`; cleared by `unmount()`.

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`ctx`](DensityContourLayerBase.md#ctx)

***

### cullable

> **cullable**: `boolean`

Defined in: [canvas/src/layers/Layer.ts:91](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/Layer.ts#L91)

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`cullable`](DensityContourLayerBase.md#cullable)

***

### dirty

> `readonly` **dirty**: [`DirtyBatcher`](../../../canvas/src/classes/DirtyBatcher.md)\<`never`\>

Defined in: [canvas/src/layers/Layer.ts:85](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/Layer.ts#L85)

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`dirty`](DensityContourLayerBase.md#dirty)

***

### events

> `readonly` **events**: [`SourceEmitter`](../../../canvas/src/classes/SourceEmitter.md)\<[`DensityContourLayerEvents`](../interfaces/DensityContourLayerEvents.md)\>

Defined in: [canvas/src/layers/Layer.ts:84](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/Layer.ts#L84)

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`events`](DensityContourLayerBase.md#events)

***

### gfx

> `protected` **gfx**: `Graphics` = `null`

Defined in: [graph-layer-d3-contour/src/DensityContourLayerBase.ts:48](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph-layer-d3-contour/src/DensityContourLayerBase.ts#L48)

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`gfx`](DensityContourLayerBase.md#gfx)

***

### hittable

> **hittable**: `boolean`

Defined in: [canvas/src/layers/Layer.ts:89](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/Layer.ts#L89)

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`hittable`](DensityContourLayerBase.md#hittable)

***

### id

> `readonly` **id**: `string`

Defined in: [canvas/src/layers/Layer.ts:81](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/Layer.ts#L81)

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`id`](DensityContourLayerBase.md#id)

***

### options

> `readonly` **options**: [`DensityContourStrokeLayerOptions`](../interfaces/DensityContourStrokeLayerOptions.md)

Defined in: [canvas/src/layers/Layer.ts:82](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/Layer.ts#L82)

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`options`](DensityContourLayerBase.md#options)

***

### state

> `readonly` **state**: [`Store`](../../../canvas/src/type-aliases/Store.md)\<[`DensityContourLayerState`](../interfaces/DensityContourLayerState.md)\>

Defined in: [canvas/src/layers/Layer.ts:83](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/Layer.ts#L83)

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`state`](DensityContourLayerBase.md#state)

***

### zIndex

> **zIndex**: `number`

Defined in: [canvas/src/layers/Layer.ts:90](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/Layer.ts#L90)

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`zIndex`](DensityContourLayerBase.md#zindex)

## Accessors

### container

#### Get Signature

> **get** `protected` **container**(): `Container`

Defined in: [canvas/src/layers/WorldLayer.ts:47](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/WorldLayer.ts#L47)

Root pixi `Container` (RenderGroup) for this layer. Available from
`onMount(ctx)` for the layer's lifetime. Throws before mount / after unmount.

Pass to `ShapesRenderer` as the `container` option when wiring up a renderer
inside `onMount`. Subclass-only — not part of the external layer API.

##### Returns

`Container`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`container`](DensityContourLayerBase.md#container)

***

### context

#### Get Signature

> **get** `protected` **context**(): [`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

Defined in: [canvas/src/layers/Layer.ts:156](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/Layer.ts#L156)

Convenience accessor; throws when called pre-mount.

##### Returns

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`context`](DensityContourLayerBase.md#context)

***

### mounted

#### Get Signature

> **get** **mounted**(): `boolean`

Defined in: [canvas/src/layers/Layer.ts:111](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/Layer.ts#L111)

True between `mount` and `unmount`.

##### Returns

`boolean`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`mounted`](DensityContourLayerBase.md#mounted)

***

### visible

#### Get Signature

> **get** **visible**(): `boolean`

Defined in: [canvas/src/layers/Layer.ts:98](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/Layer.ts#L98)

Whether this layer renders. Setting `false` hides the layer's pixi
container (via `onVisibleChange`, overridden by `WorldLayer` /
`ScreenLayer`) and the Canvas tick skips its flush.

##### Returns

`boolean`

#### Set Signature

> **set** **visible**(`value`): `void`

Defined in: [canvas/src/layers/Layer.ts:101](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/Layer.ts#L101)

##### Parameters

###### value

`boolean`

##### Returns

`void`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`visible`](DensityContourLayerBase.md#visible)

## Methods

### applyDirty()

> `protected` **applyDirty**(`_snap`): `void`

Defined in: [canvas/src/layers/Layer.ts:189](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/Layer.ts#L189)

Translate a dirty snapshot into renderer / pixi commands.
Default: no-op. Override when the layer batches work via `dirty.mark(...)`.

#### Parameters

##### \_snap

[`DirtySnapshot`](../../../canvas/src/interfaces/DirtySnapshot.md)\<`never`\>

#### Returns

`void`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`applyDirty`](DensityContourLayerBase.md#applydirty)

***

### createContainer()

> **createContainer**(`label?`): `Container`

Defined in: [canvas/src/layers/WorldLayer.ts:102](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/WorldLayer.ts#L102)

Create a plain pixi `Container` attached to this layer's root container.
Useful as a parent for mounted display objects (e.g. text sprites).

#### Parameters

##### label?

`string`

#### Returns

`Container`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`createContainer`](DensityContourLayerBase.md#createcontainer)

***

### createGraphics()

> **createGraphics**(`label?`): `Graphics`

Defined in: [canvas/src/layers/WorldLayer.ts:91](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/WorldLayer.ts#L91)

Create a pixi `Graphics` attached to this layer's root container. The
sanctioned way for layer authors to obtain a `Graphics` for direct
painting via `@invana/canvas/draw` primitives — keeps pixi internal
(no `new Graphics()` in user code).

#### Parameters

##### label?

`string`

#### Returns

`Graphics`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`createGraphics`](DensityContourLayerBase.md#creategraphics)

***

### createState()

> `protected` **createState**(): [`DensityContourLayerState`](../interfaces/DensityContourLayerState.md)

Defined in: [graph-layer-d3-contour/src/DensityContourLayerBase.ts:68](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph-layer-d3-contour/src/DensityContourLayerBase.ts#L68)

Build the initial UI / interaction state. Called once in the constructor.

#### Returns

[`DensityContourLayerState`](../interfaces/DensityContourLayerState.md)

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`createState`](DensityContourLayerBase.md#createstate)

***

### flush()

> **flush**(): `void`

Defined in: [canvas/src/layers/Layer.ts:174](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/Layer.ts#L174)

Called by Canvas tick when `hasPending()` is true. Swaps the dirty
snapshot, hands it to `applyDirty`. Subclasses normally don't override.

#### Returns

`void`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`flush`](DensityContourLayerBase.md#flush)

***

### getBounds()

> **getBounds**(): `object`

Defined in: [canvas/src/layers/WorldLayer.ts:129](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/WorldLayer.ts#L129)

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

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`getBounds`](DensityContourLayerBase.md#getbounds)

***

### hasPending()

> **hasPending**(): `boolean`

Defined in: [canvas/src/layers/Layer.ts:166](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/Layer.ts#L166)

Whether `flush()` has work to do this frame.

#### Returns

`boolean`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`hasPending`](DensityContourLayerBase.md#haspending)

***

### hitTest()

> **hitTest**(`_worldX`, `_worldY`): [`WorldLayerHit`](../../../canvas/src/interfaces/WorldLayerHit.md)

Defined in: [graph-layer-d3-contour/src/DensityContourLayerBase.ts:112](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph-layer-d3-contour/src/DensityContourLayerBase.ts#L112)

Hit-test in world coordinates. Returns the topmost hit or `null`.
Concrete layers implement this against their own data + spatial index.

The `Canvas`-level hit-test orchestration (top-down by z-order, stop on
first hit, screen-layers-before-world per proposal Q6) calls this.

#### Parameters

##### \_worldX

`number`

##### \_worldY

`number`

#### Returns

[`WorldLayerHit`](../../../canvas/src/interfaces/WorldLayerHit.md)

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`hitTest`](DensityContourLayerBase.md#hittest)

***

### mount()

> **mount**(`ctx`): `void`

Defined in: [canvas/src/layers/WorldLayer.ts:58](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/WorldLayer.ts#L58)

#### Parameters

##### ctx

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Returns

`void`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`mount`](DensityContourLayerBase.md#mount)

***

### onMount()

> `protected` **onMount**(`ctx`): `void`

Defined in: [graph-layer-d3-contour/src/DensityContourLayerBase.ts:72](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph-layer-d3-contour/src/DensityContourLayerBase.ts#L72)

Domain-specific mount setup (subscribe to peers, attach renderer, etc.).

#### Parameters

##### ctx

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Returns

`void`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`onMount`](DensityContourLayerBase.md#onmount)

***

### onUnmount()

> `protected` **onUnmount**(): `void`

Defined in: [graph-layer-d3-contour/src/DensityContourLayerBase.ts:92](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph-layer-d3-contour/src/DensityContourLayerBase.ts#L92)

Domain-specific unmount teardown.

#### Returns

`void`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`onUnmount`](DensityContourLayerBase.md#onunmount)

***

### onVisibleChange()

> `protected` **onVisibleChange**(`value`): `void`

Defined in: [canvas/src/layers/WorldLayer.ts:74](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/WorldLayer.ts#L74)

Keep the pixi container in sync when `layer.visible` is toggled.

#### Parameters

##### value

`boolean`

#### Returns

`void`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`onVisibleChange`](DensityContourLayerBase.md#onvisiblechange)

***

### paintDensity()

> `protected` **paintDensity**(`g`, `density`, `offsetX`, `offsetY`): `void`

Defined in: [graph-layer-d3-contour/src/DensityContourStrokeLayer.ts:36](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph-layer-d3-contour/src/DensityContourStrokeLayer.ts#L36)

Render the iso-bands into `g`. The bands are ordered low-density →
high-density; subclasses typically paint in that order so denser bands
sit on top. `offsetX`/`offsetY` are the world-space origin of the
compute grid — add them to each polygon point.

#### Parameters

##### g

`Graphics`

##### density

`ContourMultiPolygon`[]

##### offsetX

`number`

##### offsetY

`number`

#### Returns

`void`

#### Overrides

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`paintDensity`](DensityContourLayerBase.md#paintdensity)

***

### recompute()

> **recompute**(): `void`

Defined in: [graph-layer-d3-contour/src/DensityContourLayerBase.ts:108](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph-layer-d3-contour/src/DensityContourLayerBase.ts#L108)

Force an immediate recompute. Useful in `recompute: 'manual'` mode, or
to refresh the overlay after externally mutating options that don't
have setters yet.

#### Returns

`void`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`recompute`](DensityContourLayerBase.md#recompute)

***

### setZIndex()

> **setZIndex**(`z`): `void`

Defined in: [canvas/src/layers/WorldLayer.ts:115](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/WorldLayer.ts#L115)

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

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`setZIndex`](DensityContourLayerBase.md#setzindex)

***

### unmount()

> **unmount**(): `void`

Defined in: [canvas/src/layers/WorldLayer.ts:78](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/WorldLayer.ts#L78)

#### Returns

`void`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`unmount`](DensityContourLayerBase.md#unmount)
