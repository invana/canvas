# Interface: AnchorShapeRef

Defined in: [canvas/src/primitives/types.ts:477](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/types.ts#L477)

Read-only view of a shape that an anchor function consumes. The renderer
builds one of these for the referenced shape id and hands it to the
registered anchor. Anchors operate against this — they never see the live
`ShapeInstance` or `Pixi` objects.

**Origin vs centre.** `origin` is the shape's spec position `(spec.x,
spec.y)` — this is the top-left for `RectShape`, the centre for
`CircleShape`, and shape-dependent for others. `center` is the geometric
centre of the bounding box in world space, computed by the renderer from
`origin` + `bounds`. Anchors should reference `center` (not `origin`) so
their behaviour is uniform across shape kinds.

## Properties

### bounds

> `readonly` **bounds**: [`Rect`](Rect.md)

Defined in: [canvas/src/primitives/types.ts:481](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/types.ts#L481)

Local-space axis-aligned bounding box (relative to `origin`).

***

### center

> `readonly` **center**: [`Point`](Point.md)

Defined in: [canvas/src/primitives/types.ts:483](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/types.ts#L483)

World-space geometric centre of the shape's bounding box.

***

### origin

> `readonly` **origin**: [`Point`](Point.md)

Defined in: [canvas/src/primitives/types.ts:479](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/types.ts#L479)

World-space origin of the shape (`(spec.x, spec.y)`).

## Methods

### boundaryIntersect()?

> `optional` **boundaryIntersect**(`localFromCenter`): [`Point`](Point.md)

Defined in: [canvas/src/primitives/types.ts:491](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/types.ts#L491)

Optional analytical boundary-intersection in shape-local coordinates,
relative to the shape's geometric **centre** (not its `origin`).
Anchors fall back to a default centred-AABB ray-exit when this is
absent. `localFromCenter` is the other endpoint's offset from the
shape's centre.

#### Parameters

##### localFromCenter

[`Point`](Point.md)

#### Returns

[`Point`](Point.md)
