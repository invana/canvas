# Interface: ShapeDecorationHostInfo

Defined in: [packages/canvas/src/primitives/types.ts:579](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L579)

Information a shape decoration receives in `mount` / `update`. Decorations
call `host.shape.paintInto(g, ...)` to repaint the host silhouette into
their own `Graphics` with style overrides — the entire shape ↔ decoration
contract.

## Properties

### bounds

> `readonly` **bounds**: [`Rect`](Rect.md)

Defined in: [packages/canvas/src/primitives/types.ts:584](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L584)

Local-space axis-aligned bounding box of the host shape.

***

### hostId

> `readonly` **hostId**: `string`

Defined in: [packages/canvas/src/primitives/types.ts:580](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L580)

***

### shape

> `readonly` **shape**: [`IShape`](IShape.md)

Defined in: [packages/canvas/src/primitives/types.ts:588](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L588)

The host shape itself — decorations call `shape.paintInto(...)`.

***

### slot

> `readonly` **slot**: `string`

Defined in: [packages/canvas/src/primitives/types.ts:581](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L581)

***

### slotZIndex

> `readonly` **slotZIndex**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:582](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L582)

***

### surface

> `readonly` **surface**: `Container`

Defined in: [packages/canvas/src/primitives/types.ts:586](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L586)

Surface to attach the decoration's `gfx` to. Set to the host shape's `gfx`.
