# Interface: ShapeDecorationHostInfo

Defined in: [canvas/src/primitives/types.ts:573](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/types.ts#L573)

Information a shape decoration receives in `mount` / `update`. Decorations
call `host.shape.paintInto(g, ...)` to repaint the host silhouette into
their own `Graphics` with style overrides — the entire shape ↔ decoration
contract.

## Properties

### bounds

> `readonly` **bounds**: [`Rect`](Rect.md)

Defined in: [canvas/src/primitives/types.ts:578](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/types.ts#L578)

Local-space axis-aligned bounding box of the host shape.

***

### hostId

> `readonly` **hostId**: `string`

Defined in: [canvas/src/primitives/types.ts:574](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/types.ts#L574)

***

### shape

> `readonly` **shape**: [`IShape`](IShape.md)

Defined in: [canvas/src/primitives/types.ts:582](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/types.ts#L582)

The host shape itself — decorations call `shape.paintInto(...)`.

***

### slot

> `readonly` **slot**: `string`

Defined in: [canvas/src/primitives/types.ts:575](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/types.ts#L575)

***

### slotZIndex

> `readonly` **slotZIndex**: `number`

Defined in: [canvas/src/primitives/types.ts:576](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/types.ts#L576)

***

### surface

> `readonly` **surface**: `Container`

Defined in: [canvas/src/primitives/types.ts:580](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/types.ts#L580)

Surface to attach the decoration's `gfx` to. Set to the host shape's `gfx`.
