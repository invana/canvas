# Interface: ShapePaintStyle

Defined in: [packages/canvas/src/primitives/types.ts:313](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L313)

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

Defined in: [packages/canvas/src/primitives/types.ts:315](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L315)

***

### color?

> `readonly` `optional` **color?**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:314](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L314)

***

### dashArray?

> `readonly` `optional` **dashArray?**: readonly \[`number`, `number`\]

Defined in: [packages/canvas/src/primitives/types.ts:319](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L319)

***

### dashOffset?

> `readonly` `optional` **dashOffset?**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:320](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L320)

***

### fill?

> `readonly` `optional` **fill?**: `boolean`

Defined in: [packages/canvas/src/primitives/types.ts:318](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L318)

Default `false` — decorations almost always stroke without filling.

***

### inset?

> `readonly` `optional` **inset?**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:322](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L322)

Positive = inside the silhouette, negative = outside. Default `0`.

***

### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:316](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L316)
