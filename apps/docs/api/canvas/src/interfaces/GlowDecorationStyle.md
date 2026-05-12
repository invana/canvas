# Interface: GlowDecorationStyle

Defined in: [packages/canvas/src/primitives/decorations/shape/GlowDecoration.ts:13](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/decorations/shape/GlowDecoration.ts#L13)

Halo / outer glow. Repaints the host's silhouette N times with widening
stroke and quadratic alpha falloff, producing a soft glow that hugs
whatever silhouette the host paints. Works on every shape that
implements `paintInto` (everything extending `ShapeBase`).

Static by default. Supply `pulse` to animate brightness sinusoidally —
the renderer will register `tick` and advance the phase each frame.

## Properties

### color

> `readonly` **color**: `number`

Defined in: [packages/canvas/src/primitives/decorations/shape/GlowDecoration.ts:14](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/decorations/shape/GlowDecoration.ts#L14)

***

### innerAlpha?

> `readonly` `optional` **innerAlpha?**: `number`

Defined in: [packages/canvas/src/primitives/decorations/shape/GlowDecoration.ts:20](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/decorations/shape/GlowDecoration.ts#L20)

Innermost (brightest) layer alpha. Default `0.55`.

***

### layers?

> `readonly` `optional` **layers?**: `number`

Defined in: [packages/canvas/src/primitives/decorations/shape/GlowDecoration.ts:18](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/decorations/shape/GlowDecoration.ts#L18)

Number of feather layers (more = smoother + more expensive). Default `6`.

***

### pulse?

> `readonly` `optional` **pulse?**: `object`

Defined in: [packages/canvas/src/primitives/decorations/shape/GlowDecoration.ts:26](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/decorations/shape/GlowDecoration.ts#L26)

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

Defined in: [packages/canvas/src/primitives/decorations/shape/GlowDecoration.ts:16](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/decorations/shape/GlowDecoration.ts#L16)

Outermost glow extent, px. Default `12`.
