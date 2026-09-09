# Interface: ShapeEffectHostInfo

What an effect modulates. Distinguishes effects that wiggle the host's
transform (shake, breathing, jiggle) from effects that override the host's
style channels (shimmer, fade-pulse, color-flash).

Effects are NOT decorations. A decoration adds geometry alongside the host;
an effect modulates the host itself. Spec is untouched in either case — the
renderer applies the effect's contribution to the host's gfx each frame.

## Properties

### bounds

> `readonly` **bounds**: [`Rect`](Rect.md)

Local-space axis-aligned bounding box of the host shape.

***

### hostId

> `readonly` **hostId**: `string`

***

### shape

> `readonly` **shape**: [`IShape`](IShape.md)

The host shape itself — effects may read shape state but never paint.

***

### slot

> `readonly` **slot**: `string`
