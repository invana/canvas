# Abstract Class: DensityContourLayerBase\<TOpt, TEvt\>

## Extends

- `WorldLayer`\<`TOpt`, [`DensityContourLayerState`](../interfaces/DensityContourLayerState.md), `TEvt`, `never`, `WorldLayerHit`\>

## Extended by

- [`DensityContourFillLayer`](DensityContourFillLayer.md)
- [`DensityContourStrokeLayer`](DensityContourStrokeLayer.md)

## Type Parameters

### TOpt

`TOpt` *extends* [`DensityContourLayerBaseOptions`](../interfaces/DensityContourLayerBaseOptions.md)

### TEvt

`TEvt` *extends* [`DensityContourLayerEvents`](../interfaces/DensityContourLayerEvents.md) = [`DensityContourLayerEvents`](../interfaces/DensityContourLayerEvents.md)

## Constructors

### Constructor

> **new DensityContourLayerBase**\<`TOpt`, `TEvt`\>(`opts`): `DensityContourLayerBase`\<`TOpt`, `TEvt`\>

#### Parameters

##### opts

[`LayerOptions`](../../../canvas/src/interfaces/LayerOptions.md)\<`TOpt`\>

#### Returns

`DensityContourLayerBase`\<`TOpt`, `TEvt`\>

#### Overrides

`WorldLayer<TOpt, DensityContourLayerState, TEvt, never, WorldLayerHit>.constructor`

## Properties

### \_surface?

> `protected` `optional` **\_surface?**: [`ISurface`](../../../canvas/src/interfaces/ISurface.md)

Backing field — assigned in `mount`, cleared in `unmount`.

#### Inherited from

`WorldLayer._surface`

***

### ctx?

> `protected` `optional` **ctx?**: [`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

Set by `mount(ctx)`; cleared by `unmount()`.

#### Inherited from

`WorldLayer.ctx`

***

### cullable

> **cullable**: `boolean`

#### Inherited from

`WorldLayer.cullable`

***

### dirty

> `readonly` **dirty**: [`DirtyBatcher`](../../../canvas/src/classes/DirtyBatcher.md)\<`never`\>

#### Inherited from

`WorldLayer.dirty`

***

### events

> `readonly` **events**: [`SourceEmitter`](../../../canvas/src/classes/SourceEmitter.md)\<`TEvt`\>

#### Inherited from

`WorldLayer.events`

***

### hittable

> **hittable**: `boolean`

#### Inherited from

`WorldLayer.hittable`

***

### id

> `readonly` **id**: `string`

#### Inherited from

`WorldLayer.id`

***

### kind?

> `readonly` `optional` **kind?**: `string`

Stable **class kind** — a minification-safe discriminator matching the
`@invana/canvas-ui` settings-editor registry key (e.g. `'background-layer'`,
`'minimap-layer'`). Distinct from [id](../../../graph-layer-maplibre/src/classes/MapLayer.md#id) (the per-instance key): all
`BackgroundLayer` instances share `kind: 'background-layer'`. Concrete layers
set it as a class field; left `undefined` on any that haven't, so consumers
fall back (e.g. to the class name). Lets domain-free tooling resolve an
instance's editor without an `instanceof` ladder.

#### Inherited from

`WorldLayer.kind`

***

### options

> `readonly` **options**: `TOpt`

#### Inherited from

`WorldLayer.options`

***

### zIndex

> **zIndex**: `number`

#### Inherited from

`WorldLayer.zIndex`

## Accessors

### context

#### Get Signature

> **get** `protected` **context**(): [`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

Convenience accessor; throws when called pre-mount.

##### Returns

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Inherited from

`WorldLayer.context`

***

### mounted

#### Get Signature

> **get** **mounted**(): `boolean`

True between `mount` and `unmount`.

##### Returns

`boolean`

#### Inherited from

`WorldLayer.mounted`

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

`WorldLayer.state`

***

### surface

#### Get Signature

> **get** `protected` **surface**(): [`ISurface`](../../../canvas/src/interfaces/ISurface.md)

##### Returns

[`ISurface`](../../../canvas/src/interfaces/ISurface.md)

#### Inherited from

`WorldLayer.surface`

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

`WorldLayer.visible`

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

`WorldLayer.applyDirty`

***

### buildBands()

> `abstract` `protected` **buildBands**(`density`, `offsetX`, `offsetY`): `PathSpec`[]

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

***

### createState()

> `protected` **createState**(): [`DensityContourLayerState`](../interfaces/DensityContourLayerState.md)

Build the initial UI / interaction state. Called once in the constructor.

#### Returns

[`DensityContourLayerState`](../interfaces/DensityContourLayerState.md)

#### Overrides

`WorldLayer.createState`

***

### flush()

> **flush**(): `void`

Called by Canvas tick when `hasPending()` is true. Swaps the dirty
snapshot, hands it to `applyDirty`. Subclasses normally don't override.

#### Returns

`void`

#### Inherited from

`WorldLayer.flush`

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

`WorldLayer.getBounds`

***

### hasPending()

> **hasPending**(): `boolean`

Whether `flush()` has work to do this frame.

#### Returns

`boolean`

#### Inherited from

`WorldLayer.hasPending`

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

#### Overrides

`WorldLayer.hitTest`

***

### mount()

> **mount**(`ctx`): `void`

#### Parameters

##### ctx

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Returns

`void`

#### Inherited from

`WorldLayer.mount`

***

### onMount()

> `protected` **onMount**(`ctx`): `void`

Domain-specific mount setup (subscribe to peers, attach renderer, etc.).

#### Parameters

##### ctx

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Returns

`void`

#### Overrides

`WorldLayer.onMount`

***

### onUnmount()

> `protected` **onUnmount**(): `void`

Domain-specific unmount teardown.

#### Returns

`void`

#### Overrides

`WorldLayer.onUnmount`

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

`WorldLayer.onVisibleChange`

***

### recompute()

> **recompute**(): `void`

Force an immediate recompute — e.g. in `recompute: 'manual'` mode, or after
a layout moved node positions without changing the data.

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

#### Inherited from

`WorldLayer.redraw`

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

`WorldLayer.setVisible`

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

`WorldLayer.setZIndex`

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

`WorldLayer.surfaceOptions`

***

### unmount()

> **unmount**(): `void`

#### Returns

`void`

#### Inherited from

`WorldLayer.unmount`
