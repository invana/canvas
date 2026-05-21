# Interface: ShapeDecorationHostInfo

Defined in: [canvas/src/primitives/types.ts:638](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L638)

Information a shape decoration receives in `mount` / `update`. Decorations
call `host.shape.paintInto(g, ...)` to repaint the host silhouette into
their own `Graphics` with style overrides — the entire shape ↔ decoration
contract.

## Properties

### bounds

> `readonly` **bounds**: [`Rect`](Rect.md)

Defined in: [canvas/src/primitives/types.ts:643](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L643)

Local-space axis-aligned bounding box of the host shape.

***

### hostId

> `readonly` **hostId**: `string`

Defined in: [canvas/src/primitives/types.ts:639](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L639)

***

### outerDecorationExtent

> `readonly` **outerDecorationExtent**: `number`

Defined in: [canvas/src/primitives/types.ts:660](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L660)

Max resting outer extent across every decoration attached to this host
(including this one — but most decorations contribute `0`, so it acts
like a sibling max in practice). Aggregated from each decoration's
`getOuterExtent()` by the renderer. The `LabelDecoration` reads this
to push outside-placement labels past the outermost ring / halo so
they don't collide.

Animated transients (pulse-ring, ripple) contribute `0` by design —
labels stay anchored to the resting silhouette rather than tracking
the peak of an animation.

***

### shape

> `readonly` **shape**: [`IShape`](IShape.md)

Defined in: [canvas/src/primitives/types.ts:647](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L647)

The host shape itself — decorations call `shape.paintInto(...)`.

***

### slot

> `readonly` **slot**: `string`

Defined in: [canvas/src/primitives/types.ts:640](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L640)

***

### slotZIndex

> `readonly` **slotZIndex**: `number`

Defined in: [canvas/src/primitives/types.ts:641](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L641)

***

### surface

> `readonly` **surface**: `Container`

Defined in: [canvas/src/primitives/types.ts:645](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L645)

Surface to attach the decoration's `gfx` to. Set to the host shape's `gfx`.
