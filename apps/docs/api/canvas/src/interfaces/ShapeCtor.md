# Interface: ShapeCtor\<TSpec\>

Defined in: [packages/canvas/src/renderers/types.ts:375](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L375)

Constructor type for shapes registered via `registerShape`. Optionally
exposes a static `paintInto` so the shape can also serve as a connector
marker — the connector calls `Ctor.paintInto(g, spec, anchor, angle)` to
paint the marker geometry into the connector's Graphics, oriented along
the polyline tangent. Shapes without `paintInto` are still valid for
`addShape` usage but cannot be used as markers.

## Type Parameters

### TSpec

`TSpec` *extends* [`BaseShapeSpec`](BaseShapeSpec.md) = [`BaseShapeSpec`](BaseShapeSpec.md)

## Constructors

### Constructor

> **new ShapeCtor**(`spec`, `host`): [`IShape`](IShape.md)\<`TSpec`\>

Defined in: [packages/canvas/src/renderers/types.ts:376](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L376)

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

Defined in: [packages/canvas/src/renderers/types.ts:384](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L384)

Optional static paint function. Paints the spec's drawing fields into a
caller-supplied `Graphics`, anchored at `anchor` and rotated by
`angleRad` (radians) around it. The spec's `x` / `y` are ignored — the
caller (a connector) supplies position via `anchor`. When `style` is
supplied, the shape's spec colour/alpha are overridden.

#### Parameters

##### g

[`Graphics`](Graphics.md)

##### spec

`Omit`\<`TSpec`, `"x"` \| `"y"`\>

##### anchor

[`ShapesPoint`](ShapesPoint.md)

##### angleRad

`number`

##### style?

[`ShapePaintStyle`](ShapePaintStyle.md)

#### Returns

`void`
