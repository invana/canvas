# Interface: Point

Defined in: [packages/canvas/src/renderers/draw/types.ts:48](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/types.ts#L48)

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

## Properties

### x

> `readonly` **x**: `number`

Defined in: [packages/canvas/src/renderers/draw/types.ts:49](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/types.ts#L49)

***

### y

> `readonly` **y**: `number`

Defined in: [packages/canvas/src/renderers/draw/types.ts:50](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/types.ts#L50)
