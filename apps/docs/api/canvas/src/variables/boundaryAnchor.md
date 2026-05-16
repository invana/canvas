# Variable: boundaryAnchor

> `const` **boundaryAnchor**: [`IAnchor`](../type-aliases/IAnchor.md)

Defined in: [canvas/src/primitives/connectors/anchors/boundary.ts:24](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/connectors/anchors/boundary.ts#L24)

Boundary anchor — snaps the endpoint onto the shape silhouette where the
ray from the shape's geometric **centre** toward the *other* endpoint
exits.

The ray is cast from `ref.center` (the bounding-box centre, computed by
the renderer from `origin + bounds`) rather than from `ref.origin` so the
behaviour is uniform regardless of each shape's local-origin convention.
`RectShape` is anchored top-left, `CircleShape` is centred — `ref.center`
normalises the difference.

Calls the shape's optional `boundaryIntersect(localFromCenter)` for
analytical shapes (`CircleShape` overrides). For shapes that don't
override, falls back to a centred-AABB ray-exit (provided by
`ShapeBase.boundaryIntersect`). The input is centre-relative; the output
is centre-relative; this anchor converts back to world via `ref.center`.

Sets an outward-pointing `tangent` on the returned endpoint (unit vector
from shape centre to the boundary point) so port-aware routers can use it
as an exit-direction hint.
