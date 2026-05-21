# Class: MapLayer

Defined in: [graph-layer-maplibre/src/MapLayer.ts:79](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layer-maplibre/src/MapLayer.ts#L79)

The subset of `Layer` the `LayerRegistry` and `Canvas.tick` interact with.
Lets the registry stay decoupled from the abstract class implementation.

## Extends

- [`Layer`](../../../canvas/src/classes/Layer.md)\<[`MapLayerOptions`](../interfaces/MapLayerOptions.md), [`MapLayerState`](../interfaces/MapLayerState.md), [`MapLayerEvents`](../interfaces/MapLayerEvents.md)\>

## Constructors

### Constructor

> **new MapLayer**(`opts`): `MapLayer`

Defined in: [graph-layer-maplibre/src/MapLayer.ts:97](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layer-maplibre/src/MapLayer.ts#L97)

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

Defined in: [canvas/src/layers/Layer.ts:108](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L108)

Set by `mount(ctx)`; cleared by `unmount()`.

#### Inherited from

[`Layer`](../../../canvas/src/classes/Layer.md).[`ctx`](../../../canvas/src/classes/Layer.md#ctx)

***

### cullable

> **cullable**: `boolean`

Defined in: [canvas/src/layers/Layer.ts:91](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L91)

#### Inherited from

[`Layer`](../../../canvas/src/classes/Layer.md).[`cullable`](../../../canvas/src/classes/Layer.md#cullable)

***

### dirty

> `readonly` **dirty**: [`DirtyBatcher`](../../../canvas/src/classes/DirtyBatcher.md)\<`string`\>

Defined in: [canvas/src/layers/Layer.ts:85](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L85)

#### Inherited from

[`Layer`](../../../canvas/src/classes/Layer.md).[`dirty`](../../../canvas/src/classes/Layer.md#dirty)

***

### events

> `readonly` **events**: [`SourceEmitter`](../../../canvas/src/classes/SourceEmitter.md)\<[`MapLayerEvents`](../interfaces/MapLayerEvents.md)\>

Defined in: [canvas/src/layers/Layer.ts:84](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L84)

#### Inherited from

[`Layer`](../../../canvas/src/classes/Layer.md).[`events`](../../../canvas/src/classes/Layer.md#events)

***

### hittable

> **hittable**: `boolean`

Defined in: [canvas/src/layers/Layer.ts:89](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L89)

#### Inherited from

[`Layer`](../../../canvas/src/classes/Layer.md).[`hittable`](../../../canvas/src/classes/Layer.md#hittable)

***

### id

> `readonly` **id**: `string`

Defined in: [canvas/src/layers/Layer.ts:81](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L81)

#### Inherited from

[`Layer`](../../../canvas/src/classes/Layer.md).[`id`](../../../canvas/src/classes/Layer.md#id)

***

### options

> `readonly` **options**: [`MapLayerOptions`](../interfaces/MapLayerOptions.md)

Defined in: [canvas/src/layers/Layer.ts:82](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L82)

#### Inherited from

[`Layer`](../../../canvas/src/classes/Layer.md).[`options`](../../../canvas/src/classes/Layer.md#options)

***

### state

> `readonly` **state**: [`Store`](../../../canvas/src/type-aliases/Store.md)\<[`MapLayerState`](../interfaces/MapLayerState.md)\>

Defined in: [canvas/src/layers/Layer.ts:83](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L83)

#### Inherited from

[`Layer`](../../../canvas/src/classes/Layer.md).[`state`](../../../canvas/src/classes/Layer.md#state)

***

### zIndex

> **zIndex**: `number`

Defined in: [canvas/src/layers/Layer.ts:90](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L90)

#### Inherited from

[`Layer`](../../../canvas/src/classes/Layer.md).[`zIndex`](../../../canvas/src/classes/Layer.md#zindex)

## Accessors

### context

#### Get Signature

> **get** `protected` **context**(): [`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

Defined in: [canvas/src/layers/Layer.ts:156](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L156)

Convenience accessor; throws when called pre-mount.

##### Returns

[`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Inherited from

[`Layer`](../../../canvas/src/classes/Layer.md).[`context`](../../../canvas/src/classes/Layer.md#context)

***

### maplibre

#### Get Signature

> **get** **maplibre**(): `any`

Defined in: [graph-layer-maplibre/src/MapLayer.ts:111](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layer-maplibre/src/MapLayer.ts#L111)

The underlying MapLibre Map. `null` before mount / after unmount.

##### Returns

`any`

***

### mounted

#### Get Signature

> **get** **mounted**(): `boolean`

Defined in: [canvas/src/layers/Layer.ts:111](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L111)

True between `mount` and `unmount`.

##### Returns

`boolean`

#### Inherited from

[`Layer`](../../../canvas/src/classes/Layer.md).[`mounted`](../../../canvas/src/classes/Layer.md#mounted)

***

### visible

#### Get Signature

> **get** **visible**(): `boolean`

Defined in: [canvas/src/layers/Layer.ts:98](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L98)

Whether this layer renders. Setting `false` hides the layer's pixi
container (via `onVisibleChange`, overridden by `WorldLayer` /
`ScreenLayer`) and the Canvas tick skips its flush.

##### Returns

`boolean`

#### Set Signature

> **set** **visible**(`value`): `void`

Defined in: [canvas/src/layers/Layer.ts:101](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L101)

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

Defined in: [canvas/src/layers/Layer.ts:189](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L189)

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

Defined in: [graph-layer-maplibre/src/MapLayer.ts:115](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layer-maplibre/src/MapLayer.ts#L115)

Build the initial UI / interaction state. Called once in the constructor.

#### Returns

[`MapLayerState`](../interfaces/MapLayerState.md)

#### Overrides

[`Layer`](../../../canvas/src/classes/Layer.md).[`createState`](../../../canvas/src/classes/Layer.md#createstate)

***

### flush()

> **flush**(): `void`

Defined in: [canvas/src/layers/Layer.ts:174](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L174)

Called by Canvas tick when `hasPending()` is true. Swaps the dirty
snapshot, hands it to `applyDirty`. Subclasses normally don't override.

#### Returns

`void`

#### Inherited from

[`Layer`](../../../canvas/src/classes/Layer.md).[`flush`](../../../canvas/src/classes/Layer.md#flush)

***

### flyTo()

> **flyTo**(`opts`): `void`

Defined in: [graph-layer-maplibre/src/MapLayer.ts:151](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layer-maplibre/src/MapLayer.ts#L151)

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

Defined in: [canvas/src/layers/Layer.ts:166](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L166)

Whether `flush()` has work to do this frame.

#### Returns

`boolean`

#### Inherited from

[`Layer`](../../../canvas/src/classes/Layer.md).[`hasPending`](../../../canvas/src/classes/Layer.md#haspending)

***

### mount()

> **mount**(`ctx`): `void`

Defined in: [canvas/src/layers/Layer.ts:137](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L137)

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

Defined in: [graph-layer-maplibre/src/MapLayer.ts:160](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layer-maplibre/src/MapLayer.ts#L160)

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

Defined in: [graph-layer-maplibre/src/MapLayer.ts:252](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layer-maplibre/src/MapLayer.ts#L252)

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

Defined in: [canvas/src/layers/Layer.ts:208](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L208)

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

Defined in: [graph-layer-maplibre/src/MapLayer.ts:130](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layer-maplibre/src/MapLayer.ts#L130)

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

### unmount()

> **unmount**(): `void`

Defined in: [canvas/src/layers/Layer.ts:146](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/Layer.ts#L146)

#### Returns

`void`

#### Inherited from

[`Layer`](../../../canvas/src/classes/Layer.md).[`unmount`](../../../canvas/src/classes/Layer.md#unmount)

***

### unproject()

> **unproject**(`world`): \[`number`, `number`\]

Defined in: [graph-layer-maplibre/src/MapLayer.ts:143](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layer-maplibre/src/MapLayer.ts#L143)

Inverse of [project](#project) — world coords back to `[lng, lat]`. Useful
for hit-testing or reporting the geographic location under a cursor.

#### Parameters

##### world

[`WorldPoint`](../interfaces/WorldPoint.md)

#### Returns

\[`number`, `number`\]
