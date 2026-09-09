# Class: GraphLegendLayer

## Extends

- `ScreenLayer`\<[`GraphLegendLayerOptions`](../interfaces/GraphLegendLayerOptions.md), `GraphLegendState`, [`GraphLegendLayerEvents`](../type-aliases/GraphLegendLayerEvents.md)\>

## Constructors

### Constructor

> **new GraphLegendLayer**(`opts`): `GraphLegendLayer`

#### Parameters

##### opts

[`LayerOptions`](../../../canvas/src/interfaces/LayerOptions.md)\<[`GraphLegendLayerOptions`](../interfaces/GraphLegendLayerOptions.md)\>

#### Returns

`GraphLegendLayer`

#### Overrides

`ScreenLayer< GraphLegendLayerOptions, GraphLegendState, GraphLegendLayerEvents >.constructor`

## Properties

### \_surface?

> `protected` `optional` **\_surface?**: [`ISurface`](../../../canvas/src/interfaces/ISurface.md)

Backing field — assigned in `mount`, cleared in `unmount`.

#### Inherited from

`ScreenLayer._surface`

***

### ctx?

> `protected` `optional` **ctx?**: [`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

Set by `mount(ctx)`; cleared by `unmount()`.

#### Inherited from

`ScreenLayer.ctx`

***

### cullable

> **cullable**: `boolean`

#### Inherited from

`ScreenLayer.cullable`

***

### dirty

> `readonly` **dirty**: [`DirtyBatcher`](../../../canvas/src/classes/DirtyBatcher.md)\<`string`\>

#### Inherited from

`ScreenLayer.dirty`

***

### events

> `readonly` **events**: [`SourceEmitter`](../../../canvas/src/classes/SourceEmitter.md)\<[`GraphLegendLayerEvents`](../type-aliases/GraphLegendLayerEvents.md)\>

#### Inherited from

`ScreenLayer.events`

***

### hittable

> **hittable**: `boolean`

#### Inherited from

`ScreenLayer.hittable`

***

### id

> `readonly` **id**: `string`

#### Inherited from

`ScreenLayer.id`

***

### kind

> `readonly` **kind**: `"graph-legend-layer"` = `'graph-legend-layer'`

Stable **class kind** — a minification-safe discriminator matching the
`@invana/canvas-ui` settings-editor registry key (e.g. `'background-layer'`,
`'minimap-layer'`). Distinct from [id](../../../graph-layer-maplibre/src/classes/MapLayer.md#id) (the per-instance key): all
`BackgroundLayer` instances share `kind: 'background-layer'`. Concrete layers
set it as a class field; left `undefined` on any that haven't, so consumers
fall back (e.g. to the class name). Lets domain-free tooling resolve an
instance's editor without an `instanceof` ladder.

#### Overrides

`ScreenLayer.kind`

***

### options

> `readonly` **options**: [`GraphLegendLayerOptions`](../interfaces/GraphLegendLayerOptions.md)

#### Inherited from

`ScreenLayer.options`

***

### zIndex

> **zIndex**: `number`

#### Inherited from

`ScreenLayer.zIndex`

## Accessors

### context

#### Get Signature

> **get** `protected` **context**(): [`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

Convenience accessor; throws when called pre-mount.

##### Returns

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Inherited from

`ScreenLayer.context`

***

### mounted

#### Get Signature

> **get** **mounted**(): `boolean`

True between `mount` and `unmount`.

##### Returns

`boolean`

#### Inherited from

`ScreenLayer.mounted`

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

`ScreenLayer.state`

***

### surface

#### Get Signature

> **get** `protected` **surface**(): [`ISurface`](../../../canvas/src/interfaces/ISurface.md)

##### Returns

[`ISurface`](../../../canvas/src/interfaces/ISurface.md)

#### Inherited from

`ScreenLayer.surface`

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

`ScreenLayer.visible`

## Methods

### applyDirty()

> `protected` **applyDirty**(`_snap`): `void`

Translate a dirty snapshot into renderer / pixi commands.
Default: no-op. Override when the layer batches work via `dirty.mark(...)`.

#### Parameters

##### \_snap

[`DirtySnapshot`](../../../canvas/src/interfaces/DirtySnapshot.md)\<`string`\>

#### Returns

`void`

#### Inherited from

`ScreenLayer.applyDirty`

***

### createState()

> `protected` **createState**(): `GraphLegendState`

Build the initial UI / interaction state. Called once in the constructor.

#### Returns

`GraphLegendState`

#### Overrides

`ScreenLayer.createState`

***

### disable()

> **disable**(): `void`

#### Returns

`void`

***

### enable()

> **enable**(): `void`

#### Returns

`void`

***

### flush()

> **flush**(): `void`

Called by Canvas tick when `hasPending()` is true. Swaps the dirty
snapshot, hands it to `applyDirty`. Subclasses normally don't override.

#### Returns

`void`

#### Inherited from

`ScreenLayer.flush`

***

### getHiddenTypes()

> **getHiddenTypes**(): `object`

The types currently toggled off, as plain arrays (node types, edge types).

#### Returns

`object`

##### edges

> **edges**: `string`[]

##### nodes

> **nodes**: `string`[]

***

### getResolvedKind()

> **getResolvedKind**(): [`GraphLegendKind`](../type-aliases/GraphLegendKind.md)

Concrete kind currently resolved. A pinned `mode` wins; otherwise `'auto'`
follows the theme published on `ctx.theme` (defaulting to `'light'` before
any theme is published).

#### Returns

[`GraphLegendKind`](../type-aliases/GraphLegendKind.md)

***

### getRows()

> **getRows**(): `object`

The rows the legend is currently showing — node types then edge types, each
with its resolved colour and `visible` / `total` counts. Handy for a
DOM-free consumer (a React legend panel, a test) that wants the same tally
without the overlay.

#### Returns

`object`

##### edges

> **edges**: [`GraphLegendRow`](../interfaces/GraphLegendRow.md)[]

##### nodes

> **nodes**: [`GraphLegendRow`](../interfaces/GraphLegendRow.md)[]

***

### hasPending()

> **hasPending**(): `boolean`

Whether `flush()` has work to do this frame.

#### Returns

`boolean`

#### Inherited from

`ScreenLayer.hasPending`

***

### hitTest()

> **hitTest**(`_screenX`, `_screenY`): `ScreenLayerHit`

Overlay is DOM with `pointer-events:none` — never participates in hit-testing.

#### Parameters

##### \_screenX

`number`

##### \_screenY

`number`

#### Returns

`ScreenLayerHit`

#### Overrides

`ScreenLayer.hitTest`

***

### isTypeHidden()

> **isTypeHidden**(`kind`, `type`): `boolean`

True iff `type` is currently toggled off from the legend.

#### Parameters

##### kind

[`GraphLegendRowKind`](../type-aliases/GraphLegendRowKind.md)

##### type

`string`

#### Returns

`boolean`

***

### mount()

> **mount**(`ctx`): `void`

#### Parameters

##### ctx

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Returns

`void`

#### Inherited from

`ScreenLayer.mount`

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

`ScreenLayer.onMount`

***

### onUnmount()

> `protected` **onUnmount**(): `void`

Domain-specific unmount teardown.

#### Returns

`void`

#### Overrides

`ScreenLayer.onUnmount`

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

`ScreenLayer.onVisibleChange`

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

`ScreenLayer.redraw`

***

### refresh()

> **refresh**(): `void`

Force an immediate recount + repaint. Cheap for typical graph sizes.

#### Returns

`void`

***

### setEnabled()

> **setEnabled**(`enabled`): `void`

Show or hide the legend at runtime without removing the layer.

#### Parameters

##### enabled

`boolean`

#### Returns

`void`

***

### setOptions()

> **setOptions**(`patch`): `void`

Update display options at runtime. This is the seam `Canvas.update({ layers:
{ <id>: … } })` drives, so the whole bag is serialisable — the
non-serialisable wiring (`graphLayerId`, the type accessors) is
constructor-only and ignored here.

#### Parameters

##### patch

`Partial`\<`Omit`\<[`GraphLegendLayerOptions`](../interfaces/GraphLegendLayerOptions.md), `"graphLayerId"` \| `"nodeTypeOf"` \| `"edgeTypeOf"`\>\>

#### Returns

`void`

***

### setTypeHidden()

> **setTypeHidden**(`kind`, `type`, `hidden`): `void`

Hide or show every element of one type, exactly as clicking its row would —
the programmatic entry point, so a host toolbar or a saved filter can drive
the same state the legend displays. No-op when already in that state.

Hiding writes the store's `hidden` flag on each matching element (batched to
one flush); the legend's own struck-through state is tracked here, so a
*restored* type reads as shown even if its elements remain invisible for
another reason (an edge whose endpoint is still hidden) — the row's
`visible / total` count is what tells you that.

#### Parameters

##### kind

[`GraphLegendRowKind`](../type-aliases/GraphLegendRowKind.md)

##### type

`string`

##### hidden

`boolean`

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

`ScreenLayer.setVisible`

***

### setZIndex()

> **setZIndex**(`z`): `void`

Update this layer's z-order relative to its peers. Keeps the iteration
field (`this.zIndex`) and the surface's paint order in sync, and
flips `ctx.stage` into sorted mode so the change renders.

#### Parameters

##### z

`number`

#### Returns

`void`

#### Inherited from

`ScreenLayer.setZIndex`

***

### showAllTypes()

> **showAllTypes**(): `void`

Bring back every type toggled off from the legend, in one batch.

#### Returns

`void`

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

`ScreenLayer.surfaceOptions`

***

### unmount()

> **unmount**(): `void`

#### Returns

`void`

#### Inherited from

`ScreenLayer.unmount`
