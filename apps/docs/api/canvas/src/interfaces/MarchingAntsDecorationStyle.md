# Interface: MarchingAntsDecorationStyle

Defined in: [packages/canvas/src/primitives/decorations/shape/MarchingAntsDecoration.ts:15](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/decorations/shape/MarchingAntsDecoration.ts#L15)

Classic "marching ants" selection outline. Strokes the host silhouette
with a dashed border whose `dashOffset` advances each frame, producing
the characteristic crawling-along-the-edge animation seen in selection
marquees (Photoshop, Figma, etc.).

Geometry is delegated to `host.shape.paintInto` with `dashArray` /
`dashOffset` overrides — the shape primitive itself does the
silhouette tessellation. Works on every shape that implements
`paintInto` (anything extending `ShapeBase`).

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [packages/canvas/src/primitives/decorations/shape/MarchingAntsDecoration.ts:34](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/decorations/shape/MarchingAntsDecoration.ts#L34)

Overall decoration alpha. Default `1`.

***

### color

> `readonly` **color**: `number`

Defined in: [packages/canvas/src/primitives/decorations/shape/MarchingAntsDecoration.ts:16](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/decorations/shape/MarchingAntsDecoration.ts#L16)

***

### dashLength?

> `readonly` `optional` **dashLength?**: `number`

Defined in: [packages/canvas/src/primitives/decorations/shape/MarchingAntsDecoration.ts:20](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/decorations/shape/MarchingAntsDecoration.ts#L20)

Dash length in px. Default `6`.

***

### gapLength?

> `readonly` `optional` **gapLength?**: `number`

Defined in: [packages/canvas/src/primitives/decorations/shape/MarchingAntsDecoration.ts:22](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/decorations/shape/MarchingAntsDecoration.ts#L22)

Gap length in px. Default `4`.

***

### inset?

> `readonly` `optional` **inset?**: `number`

Defined in: [packages/canvas/src/primitives/decorations/shape/MarchingAntsDecoration.ts:32](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/decorations/shape/MarchingAntsDecoration.ts#L32)

Distance from the host silhouette. Positive = inside, negative =
outside. Default `0` (on the silhouette itself).

***

### speedPxPerSec?

> `readonly` `optional` **speedPxPerSec?**: `number`

Defined in: [packages/canvas/src/primitives/decorations/shape/MarchingAntsDecoration.ts:27](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/decorations/shape/MarchingAntsDecoration.ts#L27)

March speed in px/sec along the perimeter. Default `24`.
Negative values reverse the march direction.

***

### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`

Defined in: [packages/canvas/src/primitives/decorations/shape/MarchingAntsDecoration.ts:18](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/decorations/shape/MarchingAntsDecoration.ts#L18)

Stroke width in px. Default `1.5`.
