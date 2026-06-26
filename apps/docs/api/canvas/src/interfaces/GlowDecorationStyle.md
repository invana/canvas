# Interface: GlowDecorationStyle

Defined in: [canvas/src/primitives/decorations/shape/GlowDecoration.ts:13](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/GlowDecoration.ts#L13)

Halo / outer glow. Repaints the host's silhouette N times with widening
stroke and quadratic alpha falloff, producing a soft glow that hugs
whatever silhouette the host paints. Works on every shape that
implements `paintInto` (everything extending `ShapeBase`).

Static by default. Supply `pulse` to animate brightness sinusoidally —
the renderer will register `tick` and advance the phase each frame.

## Properties

### color

> `readonly` **color**: `number`

Defined in: [canvas/src/primitives/decorations/shape/GlowDecoration.ts:14](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/GlowDecoration.ts#L14)

***

### innerAlpha?

> `readonly` `optional` **innerAlpha?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/GlowDecoration.ts:30](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/GlowDecoration.ts#L30)

Innermost (brightest) layer alpha. Default `0.55`.

***

### layers?

> `readonly` `optional` **layers?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/GlowDecoration.ts:28](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/GlowDecoration.ts#L28)

Number of feather layers (more = smoother + more expensive). Default `6`.

***

### pulse?

> `readonly` `optional` **pulse?**: `object`

Defined in: [canvas/src/primitives/decorations/shape/GlowDecoration.ts:36](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/GlowDecoration.ts#L36)

Optional brightness pulse. When omitted, the glow is static. When set,
the decoration alpha-multiplies between `1` and `1 - amplitude` on a
sinusoidal cycle of `periodMs` milliseconds.

#### amplitude?

> `readonly` `optional` **amplitude?**: `number`

How far below full brightness the dim phase reaches, `[0, 1]`. Default `0.5`.

#### periodMs?

> `readonly` `optional` **periodMs?**: `number`

Cycle length in ms. Default `1200`.

***

### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`

Defined in: [canvas/src/primitives/decorations/shape/GlowDecoration.ts:26](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/GlowDecoration.ts#L26)

Outermost feather layer's stroke width, px. The outermost stroke
extends this many pixels past the host silhouette (`paintInto`'s
default alignment is `'outside'`), so the visual outer reach of the
glow matches this value. Inner layers taper linearly to `1` px.
Default `12`.

Not a circle radius — the glow traces whatever silhouette the host
draws (rect / polygon / star / ...). The name reflects the underlying
stroke geometry, not the shape kind.
