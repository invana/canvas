# Interface: ConnectorPaintStyle

Defined in: [canvas/src/primitives/types.ts:348](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L348)

Mirror of `ShapePaintStyle` for connectors. No `inset` (connectors are 1D).

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [canvas/src/primitives/types.ts:350](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L350)

***

### cap?

> `readonly` `optional` **cap?**: `"butt"` \| `"round"` \| `"square"`

Defined in: [canvas/src/primitives/types.ts:354](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L354)

***

### color?

> `readonly` `optional` **color?**: `number`

Defined in: [canvas/src/primitives/types.ts:349](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L349)

***

### dashArray?

> `readonly` `optional` **dashArray?**: readonly \[`number`, `number`\]

Defined in: [canvas/src/primitives/types.ts:352](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L352)

***

### dashOffset?

> `readonly` `optional` **dashOffset?**: `number`

Defined in: [canvas/src/primitives/types.ts:353](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L353)

***

### join?

> `readonly` `optional` **join?**: `"round"` \| `"miter"` \| `"bevel"`

Defined in: [canvas/src/primitives/types.ts:355](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L355)

***

### markerHalo?

> `readonly` `optional` **markerHalo?**: `boolean`

Defined in: [canvas/src/primitives/types.ts:380](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L380)

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

Defined in: [canvas/src/primitives/types.ts:370](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L370)

When `true`, `paintInto` paints only the body (no source / target
markers). Useful for decorations that handle markers separately or
want to leave them untouched. `markerHalo` is preferred for glow /
halo coverage; reach for `skipMarkers` only when even outlined
markers would be wrong.

***

### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`

Defined in: [canvas/src/primitives/types.ts:351](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L351)

***

### tintMarkers?

> `readonly` `optional` **tintMarkers?**: `boolean`

Defined in: [canvas/src/primitives/types.ts:362](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L362)

When `true`, markers paint with `color` / `alpha` instead of their own
spec colors. Glow / halo decorations use this so the decoration covers
path + markers as a unified silhouette; marching-ants leaves it
undefined so markers stay normal-colored over the dashed line.
