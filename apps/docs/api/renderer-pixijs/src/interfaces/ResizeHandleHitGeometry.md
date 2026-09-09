# Interface: ResizeHandleHitGeometry

Shape-local hit geometry for a `ResizeHandleDecoration`. Same coordinate
convention as the toggle's: add the host shape's spec `x` / `y` to convert
to world. The geometry is a square — a behaviour testing a pointer hit
compares against the AABB `[cx-half, cx+half] × [cy-half, cy+half]`.

## Properties

### cx

> `readonly` **cx**: `number`

***

### cy

> `readonly` **cy**: `number`

***

### half

> `readonly` **half**: `number`

Half side-length in shape-local px.

***

### placement

> `readonly` **placement**: [`ResizeHandlePlacement`](../type-aliases/ResizeHandlePlacement.md)
