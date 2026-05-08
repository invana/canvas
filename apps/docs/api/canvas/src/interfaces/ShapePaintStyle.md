# Interface: ShapePaintStyle

Defined in: packages/canvas/src/primitives/types.ts:171

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

Defined in: packages/canvas/src/primitives/types.ts:173

***

### color?

> `readonly` `optional` **color?**: `number`

Defined in: packages/canvas/src/primitives/types.ts:172

***

### dashArray?

> `readonly` `optional` **dashArray?**: readonly \[`number`, `number`\]

Defined in: packages/canvas/src/primitives/types.ts:177

***

### dashOffset?

> `readonly` `optional` **dashOffset?**: `number`

Defined in: packages/canvas/src/primitives/types.ts:178

***

### fill?

> `readonly` `optional` **fill?**: `boolean`

Defined in: packages/canvas/src/primitives/types.ts:176

Default `false` — decorations almost always stroke without filling.

***

### inset?

> `readonly` `optional` **inset?**: `number`

Defined in: packages/canvas/src/primitives/types.ts:180

Positive = inside the silhouette, negative = outside. Default `0`.

***

### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`

Defined in: packages/canvas/src/primitives/types.ts:174
