# Class: MapLayer

Defined in: [graph-layer-maplibre/src/MapLayer.ts:79](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-maplibre/src/MapLayer.ts#L79)

## Extends

- `Layer`\<[`MapLayerOptions`](../interfaces/MapLayerOptions.md), [`MapLayerState`](../interfaces/MapLayerState.md), [`MapLayerEvents`](../interfaces/MapLayerEvents.md)\>

## Constructors

### Constructor

> **new MapLayer**(`opts`): `MapLayer`

Defined in: [graph-layer-maplibre/src/MapLayer.ts:97](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-maplibre/src/MapLayer.ts#L97)

#### Parameters

##### opts

`LayerOptions`\<[`MapLayerOptions`](../interfaces/MapLayerOptions.md)\>

#### Returns

`MapLayer`

#### Overrides

`Layer<MapLayerOptions, MapLayerState, MapLayerEvents>.constructor`

## Properties

### ctx?

> `protected` `optional` **ctx?**: `CanvasContext`

Defined in: canvas/dist/index.d.ts:572

Set by `mount(ctx)`; cleared by `unmount()`.

#### Inherited from

`Layer.ctx`

***

### cullable

> **cullable**: `boolean`

Defined in: canvas/dist/index.d.ts:563

#### Inherited from

`Layer.cullable`

***

### dirty

> `readonly` **dirty**: `DirtyBatcher`\<`string`\>

Defined in: canvas/dist/index.d.ts:558

#### Inherited from

`Layer.dirty`

***

### events

> `readonly` **events**: `SourceEmitter`\<[`MapLayerEvents`](../interfaces/MapLayerEvents.md)\>

Defined in: canvas/dist/index.d.ts:557

#### Inherited from

`Layer.events`

***

### hittable

> **hittable**: `boolean`

Defined in: canvas/dist/index.d.ts:561

#### Inherited from

`Layer.hittable`

***

### id

> `readonly` **id**: `string`

Defined in: canvas/dist/index.d.ts:554

#### Inherited from

`Layer.id`

***

### options

> `readonly` **options**: [`MapLayerOptions`](../interfaces/MapLayerOptions.md)

Defined in: canvas/dist/index.d.ts:555

#### Inherited from

`Layer.options`

***

### state

> `readonly` **state**: `Store`\<[`MapLayerState`](../interfaces/MapLayerState.md)\>

Defined in: canvas/dist/index.d.ts:556

#### Inherited from

`Layer.state`

***

### zIndex

> **zIndex**: `number`

Defined in: canvas/dist/index.d.ts:562

#### Inherited from

`Layer.zIndex`

## Accessors

### context

#### Get Signature

> **get** `protected` **context**(): `CanvasContext`

Defined in: canvas/dist/index.d.ts:579

Convenience accessor; throws when called pre-mount.

##### Returns

`CanvasContext`

#### Inherited from

`Layer.context`

***

### maplibre

#### Get Signature

> **get** **maplibre**(): `any`

Defined in: [graph-layer-maplibre/src/MapLayer.ts:111](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-maplibre/src/MapLayer.ts#L111)

The underlying MapLibre Map. `null` before mount / after unmount.

##### Returns

`any`

***

### mounted

#### Get Signature

> **get** **mounted**(): `boolean`

Defined in: canvas/dist/index.d.ts:574

True between `mount` and `unmount`.

##### Returns

`boolean`

#### Inherited from

`Layer.mounted`

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

`Layer.visible`

## Methods

### applyDirty()

> `protected` **applyDirty**(`_snap`): `void`

Defined in: canvas/dist/index.d.ts:602

Translate a dirty snapshot into renderer / pixi commands.
Default: no-op. Override when the layer batches work via `dirty.mark(...)`.

#### Parameters

##### \_snap

`DirtySnapshot`\<`string`\>

#### Returns

`void`

#### Inherited from

`Layer.applyDirty`

***

### createState()

> `protected` **createState**(): [`MapLayerState`](../interfaces/MapLayerState.md)

Defined in: [graph-layer-maplibre/src/MapLayer.ts:115](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-maplibre/src/MapLayer.ts#L115)

Build the initial UI / interaction state. Called once in the constructor.

#### Returns

[`MapLayerState`](../interfaces/MapLayerState.md)

#### Overrides

`Layer.createState`

***

### flush()

> **flush**(): `void`

Defined in: canvas/dist/index.d.ts:586

Called by Canvas tick when `hasPending()` is true. Swaps the dirty
snapshot, hands it to `applyDirty`. Subclasses normally don't override.

#### Returns

`void`

#### Inherited from

`Layer.flush`

***

### flyTo()

> **flyTo**(`opts`): `void`

Defined in: [graph-layer-maplibre/src/MapLayer.ts:151](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-maplibre/src/MapLayer.ts#L151)

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

Defined in: canvas/dist/index.d.ts:581

Whether `flush()` has work to do this frame.

#### Returns

`boolean`

#### Inherited from

`Layer.hasPending`

***

### mount()

> **mount**(`ctx`): `void`

Defined in: canvas/dist/index.d.ts:576

#### Parameters

##### ctx

`CanvasContext`

#### Returns

`void`

#### Inherited from

`Layer.mount`

***

### onMount()

> `protected` **onMount**(`ctx`): `void`

Defined in: [graph-layer-maplibre/src/MapLayer.ts:160](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-maplibre/src/MapLayer.ts#L160)

Domain-specific mount setup (subscribe to peers, attach renderer, etc.).

#### Parameters

##### ctx

`CanvasContext`

#### Returns

`void`

#### Overrides

`Layer.onMount`

***

### onUnmount()

> `protected` **onUnmount**(`ctx`): `void`

Defined in: [graph-layer-maplibre/src/MapLayer.ts:252](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-maplibre/src/MapLayer.ts#L252)

Domain-specific unmount teardown.

#### Parameters

##### ctx

`CanvasContext`

#### Returns

`void`

#### Overrides

`Layer.onUnmount`

***

### onVisibleChange()

> `protected` **onVisibleChange**(`_value`): `void`

Defined in: canvas/dist/index.d.ts:612

Called whenever `visible` changes (setter only — not on initial
construction). Subclasses override to keep their pixi container's
`.visible` in sync. Default: no-op.

#### Parameters

##### \_value

`boolean`

#### Returns

`void`

#### Inherited from

`Layer.onVisibleChange`

***

### project()

> **project**(`lngLat`): [`WorldPoint`](../interfaces/WorldPoint.md)

Defined in: [graph-layer-maplibre/src/MapLayer.ts:130](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-maplibre/src/MapLayer.ts#L130)

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

`Layer.redraw`

***

### unmount()

> **unmount**(): `void`

Defined in: canvas/dist/index.d.ts:577

#### Returns

`void`

#### Inherited from

`Layer.unmount`

***

### unproject()

> **unproject**(`world`): \[`number`, `number`\]

Defined in: [graph-layer-maplibre/src/MapLayer.ts:143](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-maplibre/src/MapLayer.ts#L143)

Inverse of [project](#project) — world coords back to `[lng, lat]`. Useful
for hit-testing or reporting the geographic location under a cursor.

#### Parameters

##### world

[`WorldPoint`](../interfaces/WorldPoint.md)

#### Returns

\[`number`, `number`\]
