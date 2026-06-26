# Interface: BaseShapeSpec

Defined in: [canvas/src/primitives/types.ts:385](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L385)

## Extended by

- [`CompositeSpec`](CompositeSpec.md)
- [`ArrowMarkerSpec`](ArrowMarkerSpec.md)
- [`CircleSpec`](CircleSpec.md)
- [`RectSpec`](RectSpec.md)
- [`PolygonSpec`](PolygonSpec.md)
- [`RegularPolygonSpec`](RegularPolygonSpec.md)
- [`StarSpec`](StarSpec.md)
- [`ArcSpec`](ArcSpec.md)

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [canvas/src/primitives/types.ts:393](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L393)

***

### fill?

> `readonly` `optional` **fill?**: [`ShapeFill`](../type-aliases/ShapeFill.md)

Defined in: [canvas/src/primitives/types.ts:389](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L389)

***

### kind

> `readonly` **kind**: `string`

Defined in: [canvas/src/primitives/types.ts:386](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L386)

***

### rotation?

> `readonly` `optional` **rotation?**: `number`

Defined in: [canvas/src/primitives/types.ts:407](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L407)

Container-level rotation in radians, applied around the shape's
top-left local origin. Composes with effect-driven transform deltas
— the effect aggregator writes `(spec.rotation ?? 0) + dRot` per frame
so connector-hosted badges with `autoRotate: true` keep rotating
smoothly even while a `shake` / `breathing` effect runs on top.

For per-shape geometric rotation (the visible rotation of a regular
polygon's vertices, a star's points, etc.), use the kind-specific
`rotation` field on those shape specs — that one rotates the *geometry*
before it's drawn; this one rotates the *container* after.

***

### stroke?

> `readonly` `optional` **stroke?**: [`ShapeStroke`](ShapeStroke.md)

Defined in: [canvas/src/primitives/types.ts:390](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L390)

***

### visible?

> `readonly` `optional` **visible?**: `boolean`

Defined in: [canvas/src/primitives/types.ts:394](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L394)

***

### x

> `readonly` **x**: `number`

Defined in: [canvas/src/primitives/types.ts:387](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L387)

***

### y

> `readonly` **y**: `number`

Defined in: [canvas/src/primitives/types.ts:388](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L388)

***

### zIndex?

> `readonly` `optional` **zIndex?**: `number`

Defined in: [canvas/src/primitives/types.ts:392](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L392)

Default `0`. Higher = on top. Used for hit-test resolution.
