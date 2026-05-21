# Interface: ResizeHandleHitGeometry

Defined in: [canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts:55](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts#L55)

Shape-local hit geometry for a `ResizeHandleDecoration`. Same coordinate
convention as the toggle's: add the host shape's spec `x` / `y` to convert
to world. The geometry is a square — a behaviour testing a pointer hit
compares against the AABB `[cx-half, cx+half] × [cy-half, cy+half]`.

## Properties

### cx

> `readonly` **cx**: `number`

Defined in: [canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts:56](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts#L56)

***

### cy

> `readonly` **cy**: `number`

Defined in: [canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts:57](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts#L57)

***

### half

> `readonly` **half**: `number`

Defined in: [canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts:59](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts#L59)

Half side-length in shape-local px.

***

### placement

> `readonly` **placement**: [`ResizeHandlePlacement`](../type-aliases/ResizeHandlePlacement.md)

Defined in: [canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts:60](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts#L60)
