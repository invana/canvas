# Interface: IShape\<TSpec\>

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

Root display object — renderer adds/removes this on the host surface.

## Methods

### boundaryIntersect()?

> `optional` **boundaryIntersect**(`localFromCenter`): [`Point`](Point.md)

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

Local-space axis-aligned bounding box for hit-testing & decorations.

#### Returns

[`Rect`](Rect.md)

***

### contains()?

> `optional` **contains**(`localX`, `localY`): `boolean`

Optional precise containment in shape-local coordinates. Built-ins
delegate to the pure per-kind function in `specs/shapeGeometry/`, so a
caller holding an instance and a caller holding only a spec get the same
answer.

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

#### Returns

`void`

***

### draw()

> **draw**(`spec`): `void`

(Re)paint the shape from the current spec. Called on add and on update.

#### Parameters

##### spec

`TSpec`

#### Returns

`void`

***

### getHitArea()

> **getHitArea**(): `IHitArea`

Hit-test region for this shape in shape-local coordinates. Used by
`ShapeBase` to wire `gfx.hitArea` at construct time, and by
`PrimitivesRenderer.hitTest` as the **fallback** narrow phase for shape
kinds the pure spec geometry doesn't cover — i.e. kinds a consumer added
via `registerShape`. Built-in kinds are picked from the spec instead
(`containsSpec`), so picking works with no display object at all.

The default `ShapeBase` implementation derives the region from
`drawGeometry` via `bodyGfx.containsPoint`, so the hit area always
matches the rendered silhouette + stroke. Custom shapes that want
spec-driven picking should register their geometry rather than override
this.

#### Returns

`IHitArea`

***

### hitTestPart()?

> `optional` **hitTestPart**(`localX`, `localY`): `string`

Optional **sub-part** hit test in shape-local coordinates: returns the
`hitId` of the topmost interactive sub-part containing the point, or
`undefined`. Shapes composed of many addressable regions (e.g. a
[CompositeShape](../classes/CompositeShape.md) card with `hitId`-tagged parts) implement this so
the renderer can emit `shape:partover` / `shape:partout`. Omit for atomic
shapes — the renderer simply won't emit part events for them.

#### Parameters

##### localX

`number`

##### localY

`number`

#### Returns

`string`

***

### labelAnchorBox()?

> `optional` **labelAnchorBox**(`placement`): [`Rect`](Rect.md)

Optional shape-local box a `label` decoration should anchor against for
the given `placement`, overriding the shape's AABB. Return `undefined`
to keep the default (the full AABB).

This lets a shape with internal structure direct labels at the *region*
that placement names, rather than at the silhouette's outer box —
`TabbedRectShape` sends every `inside-*` placement into its tab, since
its body interior belongs to the content it frames. Because the
inside-placement inset is proportional to the anchor box, routing the
label to a small fixed region also decouples its position from how
large the rest of the shape grows.

Applies to both the anchor math and the `inside-*` fit cascade, so a
label targeted at a sub-region is also budgeted against it.

#### Parameters

##### placement

[`ShapeLabelPlacement`](../type-aliases/ShapeLabelPlacement.md)

#### Returns

[`Rect`](Rect.md)

***

### obstacleTest()?

> `optional` **obstacleTest**(): (`worldX`, `worldY`, `inflate`) => `boolean`

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

### setImageFillVisible()?

> `optional` **setImageFillVisible**(`visible`): `void`

#### Parameters

##### visible

`boolean`

#### Returns

`void`

***

### setInsetContentVisible()?

> `optional` **setInsetContentVisible**(`visible`): `void`

Optional content-visibility hooks used by zoom-visibility LOD; the renderer
feature-detects each.
- `setInsetContentVisible` — flip inset icons (`glyph` / `svg` / `svg-url`)
  on/off (`ShapeBase`).
- `setImageFillVisible` — show/hide the silhouette `image` fill, repainting
  the body (`ShapeBase`).
- `setTextVisible` — show/hide the shape's **internal** text (e.g. a
  `CompositeShape`'s `label` parts). Simple shapes carry no internal text —
  their label is a `'label'` decoration handled by the renderer — so they
  omit this.

#### Parameters

##### visible

`boolean`

#### Returns

`void`

***

### setLabelResolution()?

#### Call Signature

> `optional` **setLabelResolution**(`resolution`): `void`

Optional — re-rasterise any **internal text** this shape mounts (e.g. a
[CompositeShape](../classes/CompositeShape.md)'s `label` parts) at the given device resolution, so
it stays crisp when the camera zooms in. The renderer forwards its tracked
label resolution here on mount and whenever the label-resolution LOD
behaviour pushes a new value — the shape counterpart to a `LabelDecoration`'s
`setResolution`. Atomic shapes with no mounted text omit it.

##### Parameters

###### resolution

`number`

##### Returns

`void`

#### Call Signature

> `optional` **setLabelResolution**(`resolution`): `void`

Optional label-rasterization hook. Only meaningful for text-bearing shapes.

##### Parameters

###### resolution

`number`

##### Returns

`void`

***

### setLODLevel()?

> `optional` **setLODLevel**(`level`): `void`

Optional LOD hook. Renderer forwards via `setLODLevel(id, level)`.

#### Parameters

##### level

`number`

#### Returns

`void`

***

### setTextVisible()?

> `optional` **setTextVisible**(`visible`): `void`

#### Parameters

##### visible

`boolean`

#### Returns

`void`

***

### visualCenter()?

> `optional` **visualCenter**(): [`Point`](Point.md)

Optional shape-local "visual centre" — the point inset-content layers
with `anchor: 'center'` snap to. Defaults to the AABB midpoint when
omitted, which is correct for `CircleShape` and `RectShape` (their
silhouette fills the AABB). Non-rectangular shapes — triangle, hexagon,
star, free-form polygon — override to return the geometric centroid
(typically the shape's local origin), so a glyph drawn on a triangle
sits on the visual centroid instead of floating above it.

#### Returns

[`Point`](Point.md)
