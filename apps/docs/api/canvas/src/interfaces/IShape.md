# Interface: IShape\<TSpec\>

Defined in: packages/canvas/src/primitives/types.ts:323

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

Defined in: packages/canvas/src/primitives/types.ts:325

Root display object — renderer adds/removes this on the host surface.

## Methods

### bounds()

> **bounds**(): [`Rect`](Rect.md)

Defined in: packages/canvas/src/primitives/types.ts:329

Local-space axis-aligned bounding box for hit-testing & decorations.

#### Returns

[`Rect`](Rect.md)

***

### contains()?

> `optional` **contains**(`localX`, `localY`): `boolean`

Defined in: packages/canvas/src/primitives/types.ts:343

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

Defined in: packages/canvas/src/primitives/types.ts:348

#### Returns

`void`

***

### draw()

> **draw**(`spec`): `void`

Defined in: packages/canvas/src/primitives/types.ts:327

(Re)paint the shape from the current spec. Called on add and on update.

#### Parameters

##### spec

`TSpec`

#### Returns

`void`

***

### paintInto()?

> `optional` **paintInto**(`g`, `style?`): `void`

Defined in: packages/canvas/src/primitives/types.ts:341

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

Defined in: packages/canvas/src/primitives/types.ts:347

Optional label-rasterization hook. Only meaningful for text-bearing shapes.

#### Parameters

##### resolution

`number`

#### Returns

`void`

***

### setLODLevel()?

> `optional` **setLODLevel**(`level`): `void`

Defined in: packages/canvas/src/primitives/types.ts:345

Optional LOD hook. Renderer forwards via `setLODLevel(id, level)`.

#### Parameters

##### level

`number`

#### Returns

`void`
