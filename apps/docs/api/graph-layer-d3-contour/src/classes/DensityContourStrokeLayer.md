# Class: DensityContourStrokeLayer

Defined in: [graph-layer-d3-contour/src/DensityContourStrokeLayer.ts:35](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-d3-contour/src/DensityContourStrokeLayer.ts#L35)

## Extends

- [`DensityContourLayerBase`](DensityContourLayerBase.md)\<[`DensityContourStrokeLayerOptions`](../interfaces/DensityContourStrokeLayerOptions.md)\>

## Constructors

### Constructor

> **new DensityContourStrokeLayer**(`opts`): `DensityContourStrokeLayer`

Defined in: [graph-layer-d3-contour/src/DensityContourLayerBase.ts:56](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-d3-contour/src/DensityContourLayerBase.ts#L56)

#### Parameters

##### opts

`LayerOptions`\<[`DensityContourStrokeLayerOptions`](../interfaces/DensityContourStrokeLayerOptions.md)\>

#### Returns

`DensityContourStrokeLayer`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`constructor`](DensityContourLayerBase.md#constructor)

## Properties

### \_container?

> `protected` `optional` **\_container?**: `Container`

Defined in: canvas/dist/index.d.ts:932

Backing field — assigned in `mount`, cleared in `unmount`.

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`_container`](DensityContourLayerBase.md#_container)

***

### ctx?

> `protected` `optional` **ctx?**: `CanvasContext`

Defined in: canvas/dist/index.d.ts:572

Set by `mount(ctx)`; cleared by `unmount()`.

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`ctx`](DensityContourLayerBase.md#ctx)

***

### cullable

> **cullable**: `boolean`

Defined in: canvas/dist/index.d.ts:563

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`cullable`](DensityContourLayerBase.md#cullable)

***

### dirty

> `readonly` **dirty**: `DirtyBatcher`\<`never`\>

Defined in: canvas/dist/index.d.ts:558

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`dirty`](DensityContourLayerBase.md#dirty)

***

### events

> `readonly` **events**: `SourceEmitter`\<[`DensityContourLayerEvents`](../interfaces/DensityContourLayerEvents.md)\>

Defined in: canvas/dist/index.d.ts:557

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`events`](DensityContourLayerBase.md#events)

***

### gfx

> `protected` **gfx**: `Graphics` = `null`

Defined in: [graph-layer-d3-contour/src/DensityContourLayerBase.ts:48](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-d3-contour/src/DensityContourLayerBase.ts#L48)

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`gfx`](DensityContourLayerBase.md#gfx)

***

### hittable

> **hittable**: `boolean`

Defined in: canvas/dist/index.d.ts:561

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`hittable`](DensityContourLayerBase.md#hittable)

***

### id

> `readonly` **id**: `string`

Defined in: canvas/dist/index.d.ts:554

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`id`](DensityContourLayerBase.md#id)

***

### options

> `readonly` **options**: [`DensityContourStrokeLayerOptions`](../interfaces/DensityContourStrokeLayerOptions.md)

Defined in: canvas/dist/index.d.ts:555

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`options`](DensityContourLayerBase.md#options)

***

### state

> `readonly` **state**: `Store`\<[`DensityContourLayerState`](../interfaces/DensityContourLayerState.md)\>

Defined in: canvas/dist/index.d.ts:556

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`state`](DensityContourLayerBase.md#state)

***

### zIndex

> **zIndex**: `number`

Defined in: canvas/dist/index.d.ts:562

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`zIndex`](DensityContourLayerBase.md#zindex)

## Accessors

### container

#### Get Signature

> **get** `protected` **container**(): `Container`

Defined in: canvas/dist/index.d.ts:940

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

> **get** `protected` **context**(): `CanvasContext`

Defined in: canvas/dist/index.d.ts:579

Convenience accessor; throws when called pre-mount.

##### Returns

`CanvasContext`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`context`](DensityContourLayerBase.md#context)

***

### mounted

#### Get Signature

> **get** **mounted**(): `boolean`

Defined in: canvas/dist/index.d.ts:574

True between `mount` and `unmount`.

##### Returns

`boolean`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`mounted`](DensityContourLayerBase.md#mounted)

***

### visible

#### Get Signature

> **get** **visible**(): `boolean`

Defined in: canvas/dist/index.d.ts:569

Whether this layer renders. Setting `false` hides the layer's pixi
container (via `onVisibleChange`, overridden by `WorldLayer` /
`ScreenLayer`) and the Canvas tick skips its flush.

##### Returns

`boolean`

#### Set Signature

> **set** **visible**(`value`): `void`

Defined in: canvas/dist/index.d.ts:570

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

Defined in: canvas/dist/index.d.ts:602

Translate a dirty snapshot into renderer / pixi commands.
Default: no-op. Override when the layer batches work via `dirty.mark(...)`.

#### Parameters

##### \_snap

`DirtySnapshot`\<`never`\>

#### Returns

`void`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`applyDirty`](DensityContourLayerBase.md#applydirty)

***

### createContainer()

> **createContainer**(`label?`): `Container`

Defined in: canvas/dist/index.d.ts:957

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

Defined in: canvas/dist/index.d.ts:952

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

Defined in: [graph-layer-d3-contour/src/DensityContourLayerBase.ts:68](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-d3-contour/src/DensityContourLayerBase.ts#L68)

Build the initial UI / interaction state. Called once in the constructor.

#### Returns

[`DensityContourLayerState`](../interfaces/DensityContourLayerState.md)

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`createState`](DensityContourLayerBase.md#createstate)

***

### flush()

> **flush**(): `void`

Defined in: canvas/dist/index.d.ts:586

Called by Canvas tick when `hasPending()` is true. Swaps the dirty
snapshot, hands it to `applyDirty`. Subclasses normally don't override.

#### Returns

`void`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`flush`](DensityContourLayerBase.md#flush)

***

### getBounds()

> **getBounds**(): `object`

Defined in: canvas/dist/index.d.ts:970

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

Defined in: canvas/dist/index.d.ts:581

Whether `flush()` has work to do this frame.

#### Returns

`boolean`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`hasPending`](DensityContourLayerBase.md#haspending)

***

### hitTest()

> **hitTest**(`_worldX`, `_worldY`): `WorldLayerHit`

Defined in: [graph-layer-d3-contour/src/DensityContourLayerBase.ts:112](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-d3-contour/src/DensityContourLayerBase.ts#L112)

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

`WorldLayerHit`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`hitTest`](DensityContourLayerBase.md#hittest)

***

### mount()

> **mount**(`ctx`): `void`

Defined in: canvas/dist/index.d.ts:942

#### Parameters

##### ctx

`CanvasContext`

#### Returns

`void`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`mount`](DensityContourLayerBase.md#mount)

***

### onMount()

> `protected` **onMount**(`ctx`): `void`

Defined in: [graph-layer-d3-contour/src/DensityContourLayerBase.ts:72](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-d3-contour/src/DensityContourLayerBase.ts#L72)

Domain-specific mount setup (subscribe to peers, attach renderer, etc.).

#### Parameters

##### ctx

`CanvasContext`

#### Returns

`void`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`onMount`](DensityContourLayerBase.md#onmount)

***

### onUnmount()

> `protected` **onUnmount**(): `void`

Defined in: [graph-layer-d3-contour/src/DensityContourLayerBase.ts:92](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-d3-contour/src/DensityContourLayerBase.ts#L92)

Domain-specific unmount teardown.

#### Returns

`void`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`onUnmount`](DensityContourLayerBase.md#onunmount)

***

### onVisibleChange()

> `protected` **onVisibleChange**(`value`): `void`

Defined in: canvas/dist/index.d.ts:944

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

Defined in: [graph-layer-d3-contour/src/DensityContourStrokeLayer.ts:36](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-d3-contour/src/DensityContourStrokeLayer.ts#L36)

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

Defined in: [graph-layer-d3-contour/src/DensityContourLayerBase.ts:108](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-d3-contour/src/DensityContourLayerBase.ts#L108)

Force an immediate recompute. Useful in `recompute: 'manual'` mode, or
to refresh the overlay after externally mutating options that don't
have setters yet.

#### Returns

`void`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`recompute`](DensityContourLayerBase.md#recompute)

***

### redraw()

> **redraw**(): `void`

Defined in: canvas/dist/index.d.ts:595

Force a full repaint of this layer from its current state, bypassing the
per-frame dirty path. Base implementation is a no-op — only layers that
mount a renderer override it (e.g. `GraphLayer.redraw` re-renders every
node and edge). Driven by [Canvas.redraw](../../../graph/src/classes/GraphCanvas.md#redraw); reach for it after an
external change that sidestepped the normal mutate-and-flush path (theme
swap, palette change) or to recover from a suspected render desync.

#### Returns

`void`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`redraw`](DensityContourLayerBase.md#redraw)

***

### setZIndex()

> **setZIndex**(`z`): `void`

Defined in: canvas/dist/index.d.ts:964

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

Defined in: canvas/dist/index.d.ts:945

#### Returns

`void`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`unmount`](DensityContourLayerBase.md#unmount)
