# Interface: ShapeCtor\<TSpec\>

Defined in: packages/canvas/src/primitives/types.ts:393

Constructor type for shapes registered via `registerShape`. Optionally
exposes a `static paintInto` so the shape can also serve as a connector
marker. Shapes without `paintInto` cannot be used as markers.

## Type Parameters

### TSpec

`TSpec` *extends* [`BaseShapeSpec`](BaseShapeSpec.md) = [`BaseShapeSpec`](BaseShapeSpec.md)

## Constructors

### Constructor

> **new ShapeCtor**(`spec`, `host`): [`IShape`](IShape.md)\<`TSpec`\>

Defined in: packages/canvas/src/primitives/types.ts:394

#### Parameters

##### spec

`TSpec`

##### host

[`ShapeHostInfo`](ShapeHostInfo.md)

#### Returns

[`IShape`](IShape.md)\<`TSpec`\>

## Properties

### paintInto?

> `readonly` `optional` **paintInto?**: (`g`, `spec`, `anchor`, `angleRad`, `style?`) => `void`

Defined in: packages/canvas/src/primitives/types.ts:402

Optional static paint surface for marker rendering. Connectors call
this to paint a marker at a polyline endpoint without instantiating
the shape. The spec's `x` / `y` are ignored — the caller supplies
position via `anchor`. When `style` is supplied, the shape's spec
colors are overridden (used by glow/halo to tint markers).

#### Parameters

##### g

[`Graphics`](Graphics.md)

##### spec

`Omit`\<`TSpec`, `"x"` \| `"y"`\>

##### anchor

[`Point`](Point.md)

##### angleRad

`number`

##### style?

[`ShapePaintStyle`](ShapePaintStyle.md)

#### Returns

`void`
