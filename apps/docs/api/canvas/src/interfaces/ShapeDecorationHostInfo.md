# Interface: ShapeDecorationHostInfo

Defined in: [packages/canvas/src/primitives/types.ts:522](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L522)

Information a shape decoration receives in `mount` / `update`. Decorations
call `host.shape.paintInto(g, ...)` to repaint the host silhouette into
their own `Graphics` with style overrides — the entire shape ↔ decoration
contract.

## Properties

### bounds

> `readonly` **bounds**: [`Rect`](Rect.md)

Defined in: [packages/canvas/src/primitives/types.ts:527](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L527)

Local-space axis-aligned bounding box of the host shape.

***

### hostId

> `readonly` **hostId**: `string`

Defined in: [packages/canvas/src/primitives/types.ts:523](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L523)

***

### shape

> `readonly` **shape**: [`IShape`](IShape.md)

Defined in: [packages/canvas/src/primitives/types.ts:531](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L531)

The host shape itself — decorations call `shape.paintInto(...)`.

***

### slot

> `readonly` **slot**: `string`

Defined in: [packages/canvas/src/primitives/types.ts:524](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L524)

***

### slotZIndex

> `readonly` **slotZIndex**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:525](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L525)

***

### surface

> `readonly` **surface**: `Container`

Defined in: [packages/canvas/src/primitives/types.ts:529](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L529)

Surface to attach the decoration's `gfx` to. Set to the host shape's `gfx`.
