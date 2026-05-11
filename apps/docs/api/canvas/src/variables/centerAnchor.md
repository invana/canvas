# Variable: centerAnchor

> `const` **centerAnchor**: [`IAnchor`](../type-aliases/IAnchor.md)

Defined in: [packages/canvas/src/primitives/connectors/anchors/center.ts:12](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/connectors/anchors/center.ts#L12)

Default anchor — resolves a shape endpoint to the shape's bounding-box
**centre** in world space. Uses `ref.center` (computed by the renderer
from `origin + bounds`) rather than the raw `(spec.x, spec.y)` origin so
the anchor is uniform regardless of each shape's local-origin convention
(`RectShape` is anchored top-left; `CircleShape` is centred).

Ignores `fromPoint`; the centre never depends on the other endpoint.
