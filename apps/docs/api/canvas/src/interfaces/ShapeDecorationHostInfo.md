# Interface: ShapeDecorationHostInfo

Defined in: packages/canvas/src/primitives/types.ts:287

Information a shape decoration receives in `mount` / `update`. Decorations
call `host.shape.paintInto(g, ...)` to repaint the host silhouette into
their own `Graphics` with style overrides — the entire shape ↔ decoration
contract.

## Properties

### bounds

> `readonly` **bounds**: [`Rect`](Rect.md)

Defined in: packages/canvas/src/primitives/types.ts:292

Local-space axis-aligned bounding box of the host shape.

***

### hostId

> `readonly` **hostId**: `string`

Defined in: packages/canvas/src/primitives/types.ts:288

***

### shape

> `readonly` **shape**: [`IShape`](IShape.md)

Defined in: packages/canvas/src/primitives/types.ts:296

The host shape itself — decorations call `shape.paintInto(...)`.

***

### slot

> `readonly` **slot**: `string`

Defined in: packages/canvas/src/primitives/types.ts:289

***

### slotZIndex

> `readonly` **slotZIndex**: `number`

Defined in: packages/canvas/src/primitives/types.ts:290

***

### surface

> `readonly` **surface**: `Container`

Defined in: packages/canvas/src/primitives/types.ts:294

Surface to attach the decoration's `gfx` to. Set to the host shape's `gfx`.
