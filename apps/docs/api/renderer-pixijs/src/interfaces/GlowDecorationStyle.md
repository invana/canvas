# Interface: GlowDecorationStyle

Halo / outer glow. Repaints the host's silhouette N times with widening
stroke and quadratic alpha falloff, producing a soft glow that hugs
whatever silhouette the host paints. Works on every shape that
implements `paintInto` (everything extending `ShapeBase`).

Static by default. Supply `pulse` to animate brightness sinusoidally —
the renderer will register `tick` and advance the phase each frame.

## Properties

### color

> `readonly` **color**: `number`

***

### innerAlpha?

> `readonly` `optional` **innerAlpha?**: `number`

Innermost (brightest) layer alpha. Default `0.55`.

***

### layers?

> `readonly` `optional` **layers?**: `number`

Number of feather layers (more = smoother + more expensive). Default `6`.

***

### pulse?

> `readonly` `optional` **pulse?**: `object`

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

Outermost feather layer's stroke width, px. The outermost stroke
extends this many pixels past the host silhouette (`paintInto`'s
default alignment is `'outside'`), so the visual outer reach of the
glow matches this value. Inner layers taper linearly to `1` px.
Default `12`.

Not a circle radius — the glow traces whatever silhouette the host
draws (rect / polygon / star / ...). The name reflects the underlying
stroke geometry, not the shape kind.
