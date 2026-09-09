# Class: MapLayer

The subset of `Layer` the `LayerRegistry` and `Canvas.tick` interact with.
Lets the registry stay decoupled from the abstract class implementation.

## Extends

- [`Layer`](../../../canvas/src/classes/Layer.md)\<[`MapLayerOptions`](../interfaces/MapLayerOptions.md), [`MapLayerState`](../interfaces/MapLayerState.md), [`MapLayerEvents`](../interfaces/MapLayerEvents.md)\>

## Constructors

### Constructor

> **new MapLayer**(`opts`): `MapLayer`

#### Parameters

##### opts

[`LayerOptions`](../../../canvas/src/interfaces/LayerOptions.md)\<[`MapLayerOptions`](../interfaces/MapLayerOptions.md)\>

#### Returns

`MapLayer`

#### Overrides

[`Layer`](../../../canvas/src/classes/Layer.md).[`constructor`](../../../canvas/src/classes/Layer.md#constructor)

## Properties

### ctx?

> `protected` `optional` **ctx?**: [`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

Set by `mount(ctx)`; cleared by `unmount()`.

#### Inherited from

[`Layer`](../../../canvas/src/classes/Layer.md).[`ctx`](../../../canvas/src/classes/Layer.md#ctx)

***

### cullable

> **cullable**: `boolean`

#### Inherited from

[`Layer`](../../../canvas/src/classes/Layer.md).[`cullable`](../../../canvas/src/classes/Layer.md#cullable)

***

### dirty

> `readonly` **dirty**: [`DirtyBatcher`](../../../canvas/src/classes/DirtyBatcher.md)\<`string`\>

#### Inherited from

[`Layer`](../../../canvas/src/classes/Layer.md).[`dirty`](../../../canvas/src/classes/Layer.md#dirty)

***

### events

> `readonly` **events**: [`SourceEmitter`](../../../canvas/src/classes/SourceEmitter.md)\<[`MapLayerEvents`](../interfaces/MapLayerEvents.md)\>

#### Inherited from

[`Layer`](../../../canvas/src/classes/Layer.md).[`events`](../../../canvas/src/classes/Layer.md#events)

***

### hittable

> **hittable**: `boolean`

#### Inherited from

[`Layer`](../../../canvas/src/classes/Layer.md).[`hittable`](../../../canvas/src/classes/Layer.md#hittable)

***

### id

> `readonly` **id**: `string`

#### Inherited from

[`Layer`](../../../canvas/src/classes/Layer.md).[`id`](../../../canvas/src/classes/Layer.md#id)

***

### kind

> `readonly` **kind**: `"map-layer"` = `'map-layer'`

Stable **class kind** — a minification-safe discriminator matching the
`@invana/canvas-ui` settings-editor registry key (e.g. `'background-layer'`,
`'minimap-layer'`). Distinct from [id](#id) (the per-instance key): all
`BackgroundLayer` instances share `kind: 'background-layer'`. Concrete layers
set it as a class field; left `undefined` on any that haven't, so consumers
fall back (e.g. to the class name). Lets domain-free tooling resolve an
instance's editor without an `instanceof` ladder.

#### Overrides

[`Layer`](../../../canvas/src/classes/Layer.md).[`kind`](../../../canvas/src/classes/Layer.md#kind)

***

### options

> `readonly` **options**: [`MapLayerOptions`](../interfaces/MapLayerOptions.md)

#### Inherited from

[`Layer`](../../../canvas/src/classes/Layer.md).[`options`](../../../canvas/src/classes/Layer.md#options)

***

### zIndex

> **zIndex**: `number`

#### Inherited from

[`Layer`](../../../canvas/src/classes/Layer.md).[`zIndex`](../../../canvas/src/classes/Layer.md#zindex)

## Accessors

### context

#### Get Signature

> **get** `protected` **context**(): [`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

Convenience accessor; throws when called pre-mount.

##### Returns

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Inherited from

[`Layer`](../../../canvas/src/classes/Layer.md).[`context`](../../../canvas/src/classes/Layer.md#context)

***

### maplibre

#### Get Signature

> **get** **maplibre**(): `any`

The underlying MapLibre Map. `null` before mount / after unmount.

##### Returns

`any`

***

### mounted

#### Get Signature

> **get** **mounted**(): `boolean`

True between `mount` and `unmount`.

##### Returns

`boolean`

`true` between `mount(ctx)` and `unmount()`. Lets the registry skip already-mounted layers.

#### Inherited from

[`Layer`](../../../canvas/src/classes/Layer.md).[`mounted`](../../../canvas/src/classes/Layer.md#mounted)

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

[`Layer`](../../../canvas/src/classes/Layer.md).[`state`](../../../canvas/src/classes/Layer.md#state)

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

[`Layer`](../../../canvas/src/classes/Layer.md).[`visible`](../../../canvas/src/classes/Layer.md#visible)

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

[`Layer`](../../../canvas/src/classes/Layer.md).[`applyDirty`](../../../canvas/src/classes/Layer.md#applydirty)

***

### createState()

> `protected` **createState**(): [`MapLayerState`](../interfaces/MapLayerState.md)

Build the initial UI / interaction state. Called once in the constructor.

#### Returns

[`MapLayerState`](../interfaces/MapLayerState.md)

#### Overrides

[`Layer`](../../../canvas/src/classes/Layer.md).[`createState`](../../../canvas/src/classes/Layer.md#createstate)

***

### flush()

> **flush**(): `void`

Called by Canvas tick when `hasPending()` is true. Swaps the dirty
snapshot, hands it to `applyDirty`. Subclasses normally don't override.

#### Returns

`void`

#### Inherited from

[`Layer`](../../../canvas/src/classes/Layer.md).[`flush`](../../../canvas/src/classes/Layer.md#flush)

***

### flyTo()

> **flyTo**(`opts`): `void`

Pan/zoom the basemap to a new view. Camera follows automatically via `move`.

#### Parameters

##### opts

###### center?

[`LngLat`](../type-aliases/LngLat.md)

###### duration?

`number`

###### zoom?

`number`

#### Returns

`void`

***

### hasPending()

> **hasPending**(): `boolean`

Whether `flush()` has work to do this frame.

#### Returns

`boolean`

#### Inherited from

[`Layer`](../../../canvas/src/classes/Layer.md).[`hasPending`](../../../canvas/src/classes/Layer.md#haspending)

***

### mount()

> **mount**(`ctx`): `void`

#### Parameters

##### ctx

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Returns

`void`

#### Inherited from

[`Layer`](../../../canvas/src/classes/Layer.md).[`mount`](../../../canvas/src/classes/Layer.md#mount)

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

[`Layer`](../../../canvas/src/classes/Layer.md).[`onMount`](../../../canvas/src/classes/Layer.md#onmount)

***

### onUnmount()

> `protected` **onUnmount**(`ctx`): `void`

Domain-specific unmount teardown.

#### Parameters

##### ctx

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Returns

`void`

#### Overrides

[`Layer`](../../../canvas/src/classes/Layer.md).[`onUnmount`](../../../canvas/src/classes/Layer.md#onunmount)

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

#### Inherited from

[`Layer`](../../../canvas/src/classes/Layer.md).[`onVisibleChange`](../../../canvas/src/classes/Layer.md#onvisiblechange)

***

### project()

> **project**(`lngLat`): [`WorldPoint`](../interfaces/WorldPoint.md)

Project a geographic coordinate to canvas world coordinates.

Returns mercator pixels at zoom 0 (a 512×512 square for the whole
earth). Stable across map zoom — pin nodes once at setup and let the
camera handle the rest.

#### Parameters

##### lngLat

[`LngLat`](../type-aliases/LngLat.md)

#### Returns

[`WorldPoint`](../interfaces/WorldPoint.md)

#### Example

```ts
const { x, y } = mapLayer.project([airport.lng, airport.lat]);
  graphLayer.setData({ nodes: [{ id, position: { x, y }, ... }], ... });
```

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

[`Layer`](../../../canvas/src/classes/Layer.md).[`redraw`](../../../canvas/src/classes/Layer.md#redraw)

***

### setOptions()

> **setOptions**(`patch`): `void`

Apply a config patch — the seam `canvas.update({ layers: { [id]: … } })`
(and therefore the settings editors + the React wrapper) drives. Merges
over the current options, then pushes the live-changeable ones to MapLibre:
`styleUrl` swaps the basemap, `center` / `zoom` jump the view, `minZoom` /
`maxZoom` re-clamp it.

Mount-time-only fields (`mountTarget`, `passInputToMap`) are stored but not
re-applied — remove and re-add the layer to change those.

#### Parameters

##### patch

`Partial`\<[`MapLayerOptions`](../interfaces/MapLayerOptions.md)\>

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

[`Layer`](../../../canvas/src/classes/Layer.md).[`setVisible`](../../../canvas/src/classes/Layer.md#setvisible)

***

### unmount()

> **unmount**(): `void`

#### Returns

`void`

#### Inherited from

[`Layer`](../../../canvas/src/classes/Layer.md).[`unmount`](../../../canvas/src/classes/Layer.md#unmount)

***

### unproject()

> **unproject**(`world`): \[`number`, `number`\]

Inverse of [project](#project) — world coords back to `[lng, lat]`. Useful
for hit-testing or reporting the geographic location under a cursor.

#### Parameters

##### world

[`WorldPoint`](../interfaces/WorldPoint.md)

#### Returns

\[`number`, `number`\]
