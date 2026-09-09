# Interface: ShapePaintStyle

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

Stroke alignment relative to the silhouette. Default `'outside'` —
decorations almost always want their geometry painted outside the
host body (halo, glow, ring), so the inner band doesn't eat into the
fill. Override per-call when a decoration genuinely wants to bleed
inward (e.g. an "inset border" effect).

***

### alpha?

> `readonly` `optional` **alpha?**: `number`

***

### color?

> `readonly` `optional` **color?**: `number`

***

### dashArray?

> `readonly` `optional` **dashArray?**: readonly \[`number`, `number`\]

***

### dashOffset?

> `readonly` `optional` **dashOffset?**: `number`

***

### fill?

> `readonly` `optional` **fill?**: `boolean`

Default `false` — decorations almost always stroke without filling.

***

### inset?

> `readonly` `optional` **inset?**: `number`

Positive = inside the silhouette, negative = outside. Default `0`.

***

### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`
