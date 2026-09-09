# Interface: GlowConnectorDecorationStyle

Soft halo around the routed path of a connector. Repaints the path N
times with widening stroke and quadratic alpha falloff, producing a
glow that hugs whatever curve the path resolves to. Works on every
router / pathStyle because geometry is delegated to
`host.connector.paintInto`.

Static by default. Supply `pulse` to animate brightness sinusoidally —
geometry is only repainted on `repaint`; per-frame work touches
`this.gfx.alpha` and nothing else, so the pulse is essentially free.

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

### radius?

> `readonly` `optional` **radius?**: `number`

Outermost glow extent in px (widest stroke). Default `12`.
