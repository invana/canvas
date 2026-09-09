# Interface: ShapeDecorationHostInfo

Information a shape decoration receives in `mount` / `update`. Decorations
call `host.shape.paintInto(g, ...)` to repaint the host silhouette into
their own `Graphics` with style overrides — the entire shape ↔ decoration
contract.

## Properties

### bounds

> `readonly` **bounds**: [`Rect`](Rect.md)

Local-space axis-aligned bounding box of the host shape.

***

### hostId

> `readonly` **hostId**: `string`

***

### outerDecorationExtent

> `readonly` **outerDecorationExtent**: `number`

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

The host shape itself — decorations call `shape.paintInto(...)`.

***

### slot

> `readonly` **slot**: `string`

***

### slotZIndex

> `readonly` **slotZIndex**: `number`

***

### surface

> `readonly` **surface**: `Container`

Surface to attach the decoration's `gfx` to. Set to the host shape's `gfx`.
