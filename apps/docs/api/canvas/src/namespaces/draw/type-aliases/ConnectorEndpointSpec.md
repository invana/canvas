# Type Alias: ConnectorEndpointSpec

> **ConnectorEndpointSpec** = \{ `kind`: `"point"`; `tangent?`: [`Vec2`](../interfaces/Vec2.md); `x`: `number`; `y`: `number`; \} \| \{ `kind`: `"shape"`; `shapeId`: `string`; \}

Defined in: [packages/canvas/src/renderers/draw/types.ts:99](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/types.ts#L99)

`@invana/canvas/draw` — pure-function paint primitives.

The low-level drawing API for everything that consumes the renderer:
graph viz, ER diagrams, swimlanes, flowcharts, server-room visualisations,
and any other domain layer built on top of `ShapesRenderer`.

Primitives have ONE responsibility each:
  - shape primitives    : emit a shape's geometry into a Graphics
  - connector primitives: emit a polyline into a Graphics (no markers!)
  - text primitives     : mount a Text/HTMLText display object into a Container
  - routers             : pure (endpoints) → polyline
  - decorations         : emit decoration geometry given host bounds

The draw module never composes two primitives into one — composition (a
node that has a label, an edge that has an arrow, a rack that has blinking
lights) is always a Layer concern.
