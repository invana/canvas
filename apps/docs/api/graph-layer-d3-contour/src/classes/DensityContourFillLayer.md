# Class: DensityContourFillLayer

## Extends

- [`DensityContourLayerBase`](DensityContourLayerBase.md)\<[`DensityContourFillLayerOptions`](../interfaces/DensityContourFillLayerOptions.md)\>

## Constructors

### Constructor

> **new DensityContourFillLayer**(`opts`): `DensityContourFillLayer`

#### Parameters

##### opts

[`LayerOptions`](../../../canvas/src/interfaces/LayerOptions.md)\<[`DensityContourFillLayerOptions`](../interfaces/DensityContourFillLayerOptions.md)\>

#### Returns

`DensityContourFillLayer`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`constructor`](DensityContourLayerBase.md#constructor)

## Properties

### \_surface?

> `protected` `optional` **\_surface?**: [`ISurface`](../../../canvas/src/interfaces/ISurface.md)

Backing field — assigned in `mount`, cleared in `unmount`.

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`_surface`](DensityContourLayerBase.md#_surface)

***

### ctx?

> `protected` `optional` **ctx?**: [`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

Set by `mount(ctx)`; cleared by `unmount()`.

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`ctx`](DensityContourLayerBase.md#ctx)

***

### cullable

> **cullable**: `boolean`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`cullable`](DensityContourLayerBase.md#cullable)

***

### dirty

> `readonly` **dirty**: [`DirtyBatcher`](../../../canvas/src/classes/DirtyBatcher.md)\<`never`\>

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`dirty`](DensityContourLayerBase.md#dirty)

***

### events

> `readonly` **events**: [`SourceEmitter`](../../../canvas/src/classes/SourceEmitter.md)\<[`DensityContourLayerEvents`](../interfaces/DensityContourLayerEvents.md)\>

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`events`](DensityContourLayerBase.md#events)

***

### hittable

> **hittable**: `boolean`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`hittable`](DensityContourLayerBase.md#hittable)

***

### id

> `readonly` **id**: `string`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`id`](DensityContourLayerBase.md#id)

***

### kind

> `readonly` **kind**: `"density-contour-fill-layer"` = `'density-contour-fill-layer'`

Stable **class kind** — a minification-safe discriminator matching the
`@invana/canvas-ui` settings-editor registry key (e.g. `'background-layer'`,
`'minimap-layer'`). Distinct from [id](../../../graph-layer-maplibre/src/classes/MapLayer.md#id) (the per-instance key): all
`BackgroundLayer` instances share `kind: 'background-layer'`. Concrete layers
set it as a class field; left `undefined` on any that haven't, so consumers
fall back (e.g. to the class name). Lets domain-free tooling resolve an
instance's editor without an `instanceof` ladder.

#### Overrides

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`kind`](DensityContourLayerBase.md#kind)

***

### options

> `readonly` **options**: [`DensityContourFillLayerOptions`](../interfaces/DensityContourFillLayerOptions.md)

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`options`](DensityContourLayerBase.md#options)

***

### zIndex

> **zIndex**: `number`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`zIndex`](DensityContourLayerBase.md#zindex)

## Accessors

### context

#### Get Signature

> **get** `protected` **context**(): [`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

Convenience accessor; throws when called pre-mount.

##### Returns

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`context`](DensityContourLayerBase.md#context)

***

### mounted

#### Get Signature

> **get** **mounted**(): `boolean`

True between `mount` and `unmount`.

##### Returns

`boolean`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`mounted`](DensityContourLayerBase.md#mounted)

***

### state

#### Get Signature

> **get** **state**(): [`ReactiveStore`](../../../canvas/src/interfaces/ReactiveStore.md)\<`TState`\>

UI / interaction state (`ReactiveStore<TState>`). Because it is built
through the injected kernel factory, every write emits patches and history /
telemetry / a future CRDT backend all observe it.

**Available from `mount()` onward** — accessing it before the first mount
throws. (`createState()` is also called at first mount, so it may safely
read subclass fields initialised in the subclass constructor.)

##### Returns

[`ReactiveStore`](../../../canvas/src/interfaces/ReactiveStore.md)\<`TState`\>

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`state`](DensityContourLayerBase.md#state)

***

### surface

#### Get Signature

> **get** `protected` **surface**(): [`ISurface`](../../../canvas/src/interfaces/ISurface.md)

##### Returns

[`ISurface`](../../../canvas/src/interfaces/ISurface.md)

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`surface`](DensityContourLayerBase.md#surface)

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

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`visible`](DensityContourLayerBase.md#visible)

## Methods

### applyDirty()

> `protected` **applyDirty**(`_snap`): `void`

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

### buildBands()

> `protected` **buildBands**(`density`, `offsetX`, `offsetY`): `PathSpec`[]

Describe the iso-bands as `path` specs. Bands arrive low-density →
high-density; emit in that order so denser bands sit on top (later specs get
a higher `zIndex`). `offsetX`/`offsetY` are the world-space origin of the
compute grid — add them to each polygon point.

Subclasses *describe*; they never draw. That is what lets these bands render
on any backend and appear in a serialised canvas.

#### Parameters

##### density

`ContourMultiPolygon`[]

##### offsetX

`number`

##### offsetY

`number`

#### Returns

`PathSpec`[]

#### Overrides

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`buildBands`](DensityContourLayerBase.md#buildbands)

***

### createState()

> `protected` **createState**(): [`DensityContourLayerState`](../interfaces/DensityContourLayerState.md)

Build the initial UI / interaction state. Called once in the constructor.

#### Returns

[`DensityContourLayerState`](../interfaces/DensityContourLayerState.md)

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`createState`](DensityContourLayerBase.md#createstate)

***

### flush()

> **flush**(): `void`

Called by Canvas tick when `hasPending()` is true. Swaps the dirty
snapshot, hands it to `applyDirty`. Subclasses normally don't override.

#### Returns

`void`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`flush`](DensityContourLayerBase.md#flush)

***

### getBounds()

> **getBounds**(): `object`

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

Whether `flush()` has work to do this frame.

#### Returns

`boolean`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`hasPending`](DensityContourLayerBase.md#haspending)

***

### hitTest()

> **hitTest**(`_worldX`, `_worldY`): `WorldLayerHit`

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

Domain-specific unmount teardown.

#### Returns

`void`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`onUnmount`](DensityContourLayerBase.md#onunmount)

***

### onVisibleChange()

> `protected` **onVisibleChange**(`value`): `void`

Keep the surface in sync when `layer.visible` is toggled.

#### Parameters

##### value

`boolean`

#### Returns

`void`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`onVisibleChange`](DensityContourLayerBase.md#onvisiblechange)

***

### recompute()

> **recompute**(): `void`

Force an immediate recompute — e.g. in `recompute: 'manual'` mode, or after
a layout moved node positions without changing the data.

#### Returns

`void`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`recompute`](DensityContourLayerBase.md#recompute)

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

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`redraw`](DensityContourLayerBase.md#redraw)

***

### setOptions()

> **setOptions**(`patch`): `void`

Apply a config patch — the seam `canvas.update({ layers: { [id]: … } })`
(and therefore the settings editors + the React wrapper) drives. Merges
over the current options and repaints, so appearance fields (`bandwidth`,
`thresholds`, `cellSize`, `padding`, the subclass's fill / stroke fields)
are live-editable.

`graphLayerId` is identity, not appearance — it's read once on mount, so
patching it here has no effect; re-add the layer to retarget it.

#### Parameters

##### patch

`Partial`\<`TOpt`\>

#### Returns

`void`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`setOptions`](DensityContourLayerBase.md#setoptions)

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

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`setVisible`](DensityContourLayerBase.md#setvisible)

***

### setZIndex()

> **setZIndex**(`z`): `void`

Update this layer's z-order relative to its peers. Keeps the iteration
field (`this.zIndex`, used by `LayerRegistry.byZOrder()`) and the surface's
paint order in sync, and flips `surfaces.world` into sorted mode
so the change renders.

#### Parameters

##### z

`number`

#### Returns

`void`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`setZIndex`](DensityContourLayerBase.md#setzindex)

***

### surfaceOptions()

> `protected` **surfaceOptions**(): [`SurfaceOptions`](../../../canvas/src/interfaces/SurfaceOptions.md)

Per-layer options for the drawing device this layer's surface builds.
Override when the layer owns policy the renderer can't know — a graph layer
with pinpoint nodes wants a larger hit floor than one of big cards.
Read once, at mount.

#### Returns

[`SurfaceOptions`](../../../canvas/src/interfaces/SurfaceOptions.md)

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`surfaceOptions`](DensityContourLayerBase.md#surfaceoptions)

***

### unmount()

> **unmount**(): `void`

#### Returns

`void`

#### Inherited from

[`DensityContourLayerBase`](DensityContourLayerBase.md).[`unmount`](DensityContourLayerBase.md#unmount)
