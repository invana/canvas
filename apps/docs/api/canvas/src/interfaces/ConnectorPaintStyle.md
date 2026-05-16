# Interface: ConnectorPaintStyle

Defined in: [canvas/src/primitives/types.ts:296](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L296)

Mirror of `ShapePaintStyle` for connectors. No `inset` (connectors are 1D).

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [canvas/src/primitives/types.ts:298](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L298)

***

### cap?

> `readonly` `optional` **cap?**: `"butt"` \| `"round"` \| `"square"`

Defined in: [canvas/src/primitives/types.ts:302](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L302)

***

### color?

> `readonly` `optional` **color?**: `number`

Defined in: [canvas/src/primitives/types.ts:297](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L297)

***

### dashArray?

> `readonly` `optional` **dashArray?**: readonly \[`number`, `number`\]

Defined in: [canvas/src/primitives/types.ts:300](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L300)

***

### dashOffset?

> `readonly` `optional` **dashOffset?**: `number`

Defined in: [canvas/src/primitives/types.ts:301](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L301)

***

### join?

> `readonly` `optional` **join?**: `"round"` \| `"miter"` \| `"bevel"`

Defined in: [canvas/src/primitives/types.ts:303](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L303)

***

### markerHalo?

> `readonly` `optional` **markerHalo?**: `boolean`

Defined in: [canvas/src/primitives/types.ts:328](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L328)

When `true`, markers paint as **outlines** at `style.strokeWidth`
(using `style.color` / `style.alpha`) instead of as filled silhouettes.
Marker geometry continues to size off the host connector's spec
stroke width — the halo width affects only the outline stroke, never
the marker's tip-to-base / wing-spread dimensions. Combined with the
widening-stroke / decreasing-alpha pattern of a glow decoration,
this produces a halo around the marker that matches the body halo.

***

### skipMarkers?

> `readonly` `optional` **skipMarkers?**: `boolean`

Defined in: [canvas/src/primitives/types.ts:318](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L318)

When `true`, `paintInto` paints only the body (no source / target
markers). Useful for decorations that handle markers separately or
want to leave them untouched. `markerHalo` is preferred for glow /
halo coverage; reach for `skipMarkers` only when even outlined
markers would be wrong.

***

### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`

Defined in: [canvas/src/primitives/types.ts:299](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L299)

***

### tintMarkers?

> `readonly` `optional` **tintMarkers?**: `boolean`

Defined in: [canvas/src/primitives/types.ts:310](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L310)

When `true`, markers paint with `color` / `alpha` instead of their own
spec colors. Glow / halo decorations use this so the decoration covers
path + markers as a unified silhouette; marching-ants leaves it
undefined so markers stay normal-colored over the dashed line.
