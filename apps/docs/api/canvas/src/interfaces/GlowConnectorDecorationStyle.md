# Interface: GlowConnectorDecorationStyle

Defined in: [canvas/src/primitives/decorations/connector/GlowConnectorDecoration.ts:15](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/connector/GlowConnectorDecoration.ts#L15)

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

Defined in: [canvas/src/primitives/decorations/connector/GlowConnectorDecoration.ts:16](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/connector/GlowConnectorDecoration.ts#L16)

***

### innerAlpha?

> `readonly` `optional` **innerAlpha?**: `number`

Defined in: [canvas/src/primitives/decorations/connector/GlowConnectorDecoration.ts:22](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/connector/GlowConnectorDecoration.ts#L22)

Innermost (brightest) layer alpha. Default `0.55`.

***

### layers?

> `readonly` `optional` **layers?**: `number`

Defined in: [canvas/src/primitives/decorations/connector/GlowConnectorDecoration.ts:20](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/connector/GlowConnectorDecoration.ts#L20)

Number of feather layers (more = smoother + more expensive). Default `6`.

***

### pulse?

> `readonly` `optional` **pulse?**: `object`

Defined in: [canvas/src/primitives/decorations/connector/GlowConnectorDecoration.ts:28](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/connector/GlowConnectorDecoration.ts#L28)

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

Defined in: [canvas/src/primitives/decorations/connector/GlowConnectorDecoration.ts:18](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/connector/GlowConnectorDecoration.ts#L18)

Outermost glow extent in px (widest stroke). Default `12`.
