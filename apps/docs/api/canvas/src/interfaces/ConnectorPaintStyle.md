# Interface: ConnectorPaintStyle

Defined in: [packages/canvas/src/primitives/types.ts:326](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L326)

Mirror of `ShapePaintStyle` for connectors. No `inset` (connectors are 1D).

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:328](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L328)

***

### cap?

> `readonly` `optional` **cap?**: `"butt"` \| `"round"` \| `"square"`

Defined in: [packages/canvas/src/primitives/types.ts:332](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L332)

***

### color?

> `readonly` `optional` **color?**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:327](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L327)

***

### dashArray?

> `readonly` `optional` **dashArray?**: readonly \[`number`, `number`\]

Defined in: [packages/canvas/src/primitives/types.ts:330](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L330)

***

### dashOffset?

> `readonly` `optional` **dashOffset?**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:331](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L331)

***

### join?

> `readonly` `optional` **join?**: `"round"` \| `"miter"` \| `"bevel"`

Defined in: [packages/canvas/src/primitives/types.ts:333](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L333)

***

### markerHalo?

> `readonly` `optional` **markerHalo?**: `boolean`

Defined in: [packages/canvas/src/primitives/types.ts:358](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L358)

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

Defined in: [packages/canvas/src/primitives/types.ts:348](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L348)

When `true`, `paintInto` paints only the body (no source / target
markers). Useful for decorations that handle markers separately or
want to leave them untouched. `markerHalo` is preferred for glow /
halo coverage; reach for `skipMarkers` only when even outlined
markers would be wrong.

***

### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:329](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L329)

***

### tintMarkers?

> `readonly` `optional` **tintMarkers?**: `boolean`

Defined in: [packages/canvas/src/primitives/types.ts:340](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L340)

When `true`, markers paint with `color` / `alpha` instead of their own
spec colors. Glow / halo decorations use this so the decoration covers
path + markers as a unified silhouette; marching-ants leaves it
undefined so markers stay normal-colored over the dashed line.
