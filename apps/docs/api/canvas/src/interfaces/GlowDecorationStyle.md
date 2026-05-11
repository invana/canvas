# Interface: GlowDecorationStyle

Defined in: [packages/canvas/src/primitives/decorations/shape/GlowDecoration.ts:13](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/decorations/shape/GlowDecoration.ts#L13)

Halo / outer glow. Repaints the host's silhouette N times with widening
stroke and quadratic alpha falloff, producing a soft glow that hugs
whatever silhouette the host paints. Works on every shape that
implements `paintInto` (everything extending `ShapeBase`).

Static — does not animate. Future variants (pulsating glow, breathing
glow) will extend this and add a `tick`.

## Properties

### color

> `readonly` **color**: `number`

Defined in: [packages/canvas/src/primitives/decorations/shape/GlowDecoration.ts:14](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/decorations/shape/GlowDecoration.ts#L14)

***

### innerAlpha?

> `readonly` `optional` **innerAlpha?**: `number`

Defined in: [packages/canvas/src/primitives/decorations/shape/GlowDecoration.ts:20](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/decorations/shape/GlowDecoration.ts#L20)

Innermost (brightest) layer alpha. Default `0.55`.

***

### layers?

> `readonly` `optional` **layers?**: `number`

Defined in: [packages/canvas/src/primitives/decorations/shape/GlowDecoration.ts:18](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/decorations/shape/GlowDecoration.ts#L18)

Number of feather layers (more = smoother + more expensive). Default `6`.

***

### radius?

> `readonly` `optional` **radius?**: `number`

Defined in: [packages/canvas/src/primitives/decorations/shape/GlowDecoration.ts:16](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/decorations/shape/GlowDecoration.ts#L16)

Outermost glow extent, px. Default `12`.
