# Interface: ShapePaintStyle

Defined in: [canvas/src/primitives/types.ts:327](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L327)

Decoration entry-point override on `IShape.paintInto`. When supplied, the
shape ignores `spec.fill` / `spec.stroke` and paints with these values
instead. Decorations like glow widen `strokeWidth` and reduce `alpha` to
paint a halo; decorations like marching-ants supply `dashArray` /
`dashOffset` to render a dashed silhouette; decorations like ring/halo
with non-zero `inset` ask the shape to trace a parallel-offset version of
its own silhouette.

## Properties

### alignment?

> `readonly` `optional` **alignment?**: `"center"` \| `"inside"` \| `"outside"`

Defined in: [canvas/src/primitives/types.ts:338](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L338)

Stroke alignment relative to the silhouette. Default `'outside'` —
decorations almost always want their geometry painted outside the
host body (halo, glow, ring), so the inner band doesn't eat into the
fill. Override per-call when a decoration genuinely wants to bleed
inward (e.g. an "inset border" effect).

***

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [canvas/src/primitives/types.ts:329](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L329)

***

### color?

> `readonly` `optional` **color?**: `number`

Defined in: [canvas/src/primitives/types.ts:328](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L328)

***

### dashArray?

> `readonly` `optional` **dashArray?**: readonly \[`number`, `number`\]

Defined in: [canvas/src/primitives/types.ts:341](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L341)

***

### dashOffset?

> `readonly` `optional` **dashOffset?**: `number`

Defined in: [canvas/src/primitives/types.ts:342](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L342)

***

### fill?

> `readonly` `optional` **fill?**: `boolean`

Defined in: [canvas/src/primitives/types.ts:340](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L340)

Default `false` — decorations almost always stroke without filling.

***

### inset?

> `readonly` `optional` **inset?**: `number`

Defined in: [canvas/src/primitives/types.ts:344](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L344)

Positive = inside the silhouette, negative = outside. Default `0`.

***

### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`

Defined in: [canvas/src/primitives/types.ts:330](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L330)
