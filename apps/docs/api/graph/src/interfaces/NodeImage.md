# Interface: NodeImage

Defined in: [graph/src/layer/types.ts:391](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L391)

Raster image attached to a node. Mirrors the canvas-level `kind: 'image'`
`ShapeFillLayer` field-for-field. Two orthogonal sizing knobs:

- `fit` (default `'cover'`) — `'cover'` scales by `max(...)` and fully
  covers the silhouette's AABB (may crop on the cross-axis);
  `'contain'` scales by `min(...)` and fully fits, leaving the
  cross-axis margin transparent (the underlying `bgFill` reads
  through; the texture sampler is pinned to `clamp-to-edge` so the
  margin doesn't tile).
- `padding` (default `0`) — pixel inset on the silhouette before fit
  math runs. The silhouette is re-traced at that inset for the image
  layer only, so the gap between full and inset silhouette paints
  from layers underneath (typically a `solid` `bgFill`). Useful when
  the host silhouette is more restrictive than its AABB (circle,
  polygon, star, arc) and texture corners would otherwise clip
  against the curve.

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [graph/src/layer/types.ts:393](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L393)

***

### fit?

> `readonly` `optional` **fit?**: `"cover"` \| `"contain"`

Defined in: [graph/src/layer/types.ts:394](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L394)

***

### padding?

> `readonly` `optional` **padding?**: `number`

Defined in: [graph/src/layer/types.ts:395](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L395)

***

### url

> `readonly` **url**: `string`

Defined in: [graph/src/layer/types.ts:392](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L392)
