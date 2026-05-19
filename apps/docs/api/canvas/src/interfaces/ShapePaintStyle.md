# Interface: ShapePaintStyle

Defined in: [canvas/src/primitives/types.ts:283](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L283)

Decoration entry-point override on `IShape.paintInto`. When supplied, the
shape ignores `spec.fill` / `spec.stroke` and paints with these values
instead. Decorations like glow widen `strokeWidth` and reduce `alpha` to
paint a halo; decorations like marching-ants supply `dashArray` /
`dashOffset` to render a dashed silhouette; decorations like ring/halo
with non-zero `inset` ask the shape to trace a parallel-offset version of
its own silhouette.

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [canvas/src/primitives/types.ts:285](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L285)

***

### color?

> `readonly` `optional` **color?**: `number`

Defined in: [canvas/src/primitives/types.ts:284](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L284)

***

### dashArray?

> `readonly` `optional` **dashArray?**: readonly \[`number`, `number`\]

Defined in: [canvas/src/primitives/types.ts:289](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L289)

***

### dashOffset?

> `readonly` `optional` **dashOffset?**: `number`

Defined in: [canvas/src/primitives/types.ts:290](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L290)

***

### fill?

> `readonly` `optional` **fill?**: `boolean`

Defined in: [canvas/src/primitives/types.ts:288](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L288)

Default `false` — decorations almost always stroke without filling.

***

### inset?

> `readonly` `optional` **inset?**: `number`

Defined in: [canvas/src/primitives/types.ts:292](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L292)

Positive = inside the silhouette, negative = outside. Default `0`.

***

### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`

Defined in: [canvas/src/primitives/types.ts:286](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L286)
