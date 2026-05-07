# Interface: IShape\<TSpec\>

Defined in: [packages/canvas/src/renderers/types.ts:232](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L232)

## Type Parameters

### TSpec

`TSpec` *extends* [`BaseShapeSpec`](BaseShapeSpec.md) = [`BaseShapeSpec`](BaseShapeSpec.md)

## Properties

### gfx

> `readonly` **gfx**: `Container`

Defined in: [packages/canvas/src/renderers/types.ts:234](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L234)

Root display object — renderer adds/removes this on the host surface.

## Methods

### bounds()

> **bounds**(): [`ShapesRect`](ShapesRect.md)

Defined in: [packages/canvas/src/renderers/types.ts:238](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L238)

Local-space axis-aligned bounding box used for hit-testing & decorations.

#### Returns

[`ShapesRect`](ShapesRect.md)

***

### contains()?

> `optional` **contains**(`localX`, `localY`): `boolean`

Defined in: [packages/canvas/src/renderers/types.ts:247](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L247)

Optional precise containment test in local coordinates (i.e. coords
relative to `spec.x` / `spec.y`). The renderer first filters candidates
via the spatial index (bbox) and then calls `contains` for exact hit
resolution. If absent, the shape is considered hit anywhere inside its
bbox — a sensible default for rect / image / text. Round and polygon
primitives override.

#### Parameters

##### localX

`number`

##### localY

`number`

#### Returns

`boolean`

***

### destroy()

> **destroy**(): `void`

Defined in: [packages/canvas/src/renderers/types.ts:268](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L268)

#### Returns

`void`

***

### draw()

> **draw**(`spec`): `void`

Defined in: [packages/canvas/src/renderers/types.ts:236](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L236)

(Re)paint the shape from the current spec. Called on add and on update.

#### Parameters

##### spec

`TSpec`

#### Returns

`void`

***

### setLabelResolution()?

> `optional` **setLabelResolution**(`resolution`): `void`

Defined in: [packages/canvas/src/renderers/types.ts:267](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L267)

Optional label-rasterisation hook. Only meaningful for text-bearing
shapes. The host Layer calls
`ShapesRenderer.rasteriseLabel(id, resolution)` when label sharpness
should change (e.g. on a meaningful zoom delta). Shapes without text
ignore this.

#### Parameters

##### resolution

`number`

#### Returns

`void`

***

### setLODLevel()?

> `optional` **setLODLevel**(`level`): `void`

Defined in: [packages/canvas/src/renderers/types.ts:259](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L259)

Optional LOD hook. The host Layer drives LOD policy (e.g. "hide labels
when zoomed out beyond 0.4×") and tells the renderer which level each
shape should occupy via `ShapesRenderer.setLODLevel(id, level)`. The
shape interprets the level any way it wants — hide / use a low-detail
geometry / drop the icon, etc.

Convention used by the renderer's default fallback: `level === 0` means
"hide", `level >= 1` means "show at quality `level`". Shapes that
implement `setLODLevel` themselves override this default fully.

#### Parameters

##### level

`number`

#### Returns

`void`
