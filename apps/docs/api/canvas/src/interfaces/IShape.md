# Interface: IShape\<TSpec\>

Defined in: [canvas/src/primitives/types.ts:687](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L687)

A 2D primitive with a closed silhouette (circle, rect, polygon, path).
Implementations typically extend `ShapeBase` (which provides `paintInto`,
fill/stroke resolution, and icon-layer plumbing for free); shapes whose
`draw` and `paintInto` differ (text, images-as-sprites) implement this
interface directly.

## Type Parameters

### TSpec

`TSpec` *extends* [`BaseShapeSpec`](BaseShapeSpec.md) = [`BaseShapeSpec`](BaseShapeSpec.md)

## Properties

### gfx

> `readonly` **gfx**: `Container`

Defined in: [canvas/src/primitives/types.ts:689](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L689)

Root display object — renderer adds/removes this on the host surface.

## Methods

### boundaryIntersect()?

> `optional` **boundaryIntersect**(`localFromCenter`): `Point`

Defined in: [canvas/src/primitives/types.ts:741](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L741)

Optional analytical boundary-intersection in shape-local coordinates,
**relative to the shape's geometric centre** (NOT its `(0, 0)` origin).
Returns the point on the silhouette where the ray from the centre to
`localFromCenter` exits — or `null` to defer to the AABB fallback.

The centre-relative convention decouples anchor placement from each
shape's local-origin choice (`CircleShape` is centred at origin;
`RectShape` is anchored top-left). Shapes with non-rectangular
silhouettes (circle, ellipse, polygon) override; rect-like shapes fall
back to the centred-AABB ray-exit provided by `ShapeBase`.

#### Parameters

##### localFromCenter

`Point`

#### Returns

`Point`

***

### bounds()

> **bounds**(): `Rect`

Defined in: [canvas/src/primitives/types.ts:693](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L693)

Local-space axis-aligned bounding box for hit-testing & decorations.

#### Returns

`Rect`

***

### contains()?

> `optional` **contains**(`localX`, `localY`): `boolean`

Defined in: [canvas/src/primitives/types.ts:718](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L718)

Optional precise containment in shape-local coordinates.

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

Defined in: [canvas/src/primitives/types.ts:762](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L762)

#### Returns

`void`

***

### draw()

> **draw**(`spec`): `void`

Defined in: [canvas/src/primitives/types.ts:691](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L691)

(Re)paint the shape from the current spec. Called on add and on update.

#### Parameters

##### spec

`TSpec`

#### Returns

`void`

***

### getHitArea()

> **getHitArea**(): `IHitArea`

Defined in: [canvas/src/primitives/types.ts:716](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L716)

Hit-test region for this shape in shape-local coordinates. Used by
`ShapeBase` to wire `gfx.hitArea` at construct time and by
`PrimitivesRenderer.hitTest` for the rbush-backed manual hit-test path.

The default `ShapeBase` implementation derives the region from
`drawGeometry` via `bodyGfx.containsPoint`, so the hit area always
matches the rendered silhouette + stroke. Subclasses may override with
a cheaper analytical test (e.g. `CircleShape`: `x² + y² ≤ r²`).

#### Returns

`IHitArea`

***

### obstacleTest()?

> `optional` **obstacleTest**(): (`worldX`, `worldY`, `inflate`) => `boolean`

Defined in: [canvas/src/primitives/types.ts:757](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L757)

Optional silhouette obstacle-test factory. Returns a world-space test
`(worldX, worldY, inflate) → boolean` that says whether a point lies
inside (or within `inflate` units of) the shape's silhouette. Called
by the renderer once per route to populate `Obstacle.containsInflated`.

Shapes with non-rectangular silhouettes implement this for pixel-tight
routing (`CircleShape`: distance from centre ≤ radius + inflate;
`PolygonShape`: signed-distance to outline; etc.). Rect-like shapes
with an exact AABB silhouette can omit it — the inflated AABB is
already tight.

The returned callable captures the shape's current spec; the renderer
re-invokes `obstacleTest()` on every route so movement is reflected.

#### Returns

(`worldX`, `worldY`, `inflate`) => `boolean`

***

### paintInto()?

> `optional` **paintInto**(`g`, `style?`): `void`

Defined in: [canvas/src/primitives/types.ts:705](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L705)

Decoration entry point — repaint the silhouette into someone else's
`Graphics` with a style override. The shape uses its own current spec;
decorations don't pass one. (Distinct from `ShapeCtor.paintInto` —
the static method markers use, which takes an explicit spec + anchor.)

Optional for back-compat: `TextShape` (and similar non-silhouette shapes)
may omit it. Decorations check for presence before calling and silently
skip when absent (text labels just won't have glow / halo applied).
Every shape that extends `ShapeBase` has it for free.

#### Parameters

##### g

`Graphics`

##### style?

[`ShapePaintStyle`](ShapePaintStyle.md)

#### Returns

`void`

***

### setLabelResolution()?

> `optional` **setLabelResolution**(`resolution`): `void`

Defined in: [canvas/src/primitives/types.ts:761](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L761)

Optional label-rasterization hook. Only meaningful for text-bearing shapes.

#### Parameters

##### resolution

`number`

#### Returns

`void`

***

### setLODLevel()?

> `optional` **setLODLevel**(`level`): `void`

Defined in: [canvas/src/primitives/types.ts:759](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L759)

Optional LOD hook. Renderer forwards via `setLODLevel(id, level)`.

#### Parameters

##### level

`number`

#### Returns

`void`

***

### visualCenter()?

> `optional` **visualCenter**(): `Point`

Defined in: [canvas/src/primitives/types.ts:728](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L728)

Optional shape-local "visual centre" — the point inset-content layers
with `anchor: 'center'` snap to. Defaults to the AABB midpoint when
omitted, which is correct for `CircleShape` and `RectShape` (their
silhouette fills the AABB). Non-rectangular shapes — triangle, hexagon,
star, free-form polygon — override to return the geometric centroid
(typically the shape's local origin), so a glyph drawn on a triangle
sits on the visual centroid instead of floating above it.

#### Returns

`Point`
