# Interface: IShape\<TSpec\>

Defined in: [packages/canvas/src/primitives/types.ts:615](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L615)

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

Defined in: [packages/canvas/src/primitives/types.ts:617](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L617)

Root display object — renderer adds/removes this on the host surface.

## Methods

### boundaryIntersect()?

> `optional` **boundaryIntersect**(`localFromCenter`): [`Point`](Point.md)

Defined in: [packages/canvas/src/primitives/types.ts:658](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L658)

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

[`Point`](Point.md)

#### Returns

[`Point`](Point.md)

***

### bounds()

> **bounds**(): [`Rect`](Rect.md)

Defined in: [packages/canvas/src/primitives/types.ts:621](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L621)

Local-space axis-aligned bounding box for hit-testing & decorations.

#### Returns

[`Rect`](Rect.md)

***

### contains()?

> `optional` **contains**(`localX`, `localY`): `boolean`

Defined in: [packages/canvas/src/primitives/types.ts:635](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L635)

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

Defined in: [packages/canvas/src/primitives/types.ts:679](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L679)

#### Returns

`void`

***

### draw()

> **draw**(`spec`): `void`

Defined in: [packages/canvas/src/primitives/types.ts:619](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L619)

(Re)paint the shape from the current spec. Called on add and on update.

#### Parameters

##### spec

`TSpec`

#### Returns

`void`

***

### obstacleTest()?

> `optional` **obstacleTest**(): (`worldX`, `worldY`, `inflate`) => `boolean`

Defined in: [packages/canvas/src/primitives/types.ts:674](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L674)

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

Defined in: [packages/canvas/src/primitives/types.ts:633](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L633)

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

[`Graphics`](Graphics.md)

##### style?

[`ShapePaintStyle`](ShapePaintStyle.md)

#### Returns

`void`

***

### setLabelResolution()?

> `optional` **setLabelResolution**(`resolution`): `void`

Defined in: [packages/canvas/src/primitives/types.ts:678](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L678)

Optional label-rasterization hook. Only meaningful for text-bearing shapes.

#### Parameters

##### resolution

`number`

#### Returns

`void`

***

### setLODLevel()?

> `optional` **setLODLevel**(`level`): `void`

Defined in: [packages/canvas/src/primitives/types.ts:676](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L676)

Optional LOD hook. Renderer forwards via `setLODLevel(id, level)`.

#### Parameters

##### level

`number`

#### Returns

`void`

***

### visualCenter()?

> `optional` **visualCenter**(): [`Point`](Point.md)

Defined in: [packages/canvas/src/primitives/types.ts:645](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L645)

Optional shape-local "visual centre" — the point inset-content layers
with `anchor: 'center'` snap to. Defaults to the AABB midpoint when
omitted, which is correct for `CircleShape` and `RectShape` (their
silhouette fills the AABB). Non-rectangular shapes — triangle, hexagon,
star, free-form polygon — override to return the geometric centroid
(typically the shape's local origin), so a glyph drawn on a triangle
sits on the visual centroid instead of floating above it.

#### Returns

[`Point`](Point.md)
