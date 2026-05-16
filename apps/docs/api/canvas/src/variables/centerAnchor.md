# Variable: centerAnchor

> `const` **centerAnchor**: [`IAnchor`](../type-aliases/IAnchor.md)

Defined in: [canvas/src/primitives/connectors/anchors/center.ts:12](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/connectors/anchors/center.ts#L12)

Default anchor — resolves a shape endpoint to the shape's bounding-box
**centre** in world space. Uses `ref.center` (computed by the renderer
from `origin + bounds`) rather than the raw `(spec.x, spec.y)` origin so
the anchor is uniform regardless of each shape's local-origin convention
(`RectShape` is anchored top-left; `CircleShape` is centred).

Ignores `fromPoint`; the centre never depends on the other endpoint.
