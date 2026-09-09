# Interface: ConnectorPaintStyle

Mirror of `ShapePaintStyle` for connectors. No `inset` (connectors are 1D).

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

***

### cap?

> `readonly` `optional` **cap?**: `"butt"` \| `"round"` \| `"square"`

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

### join?

> `readonly` `optional` **join?**: `"round"` \| `"miter"` \| `"bevel"`

***

### markerHalo?

> `readonly` `optional` **markerHalo?**: `boolean`

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

When `true`, `paintInto` paints only the body (no source / target
markers). Useful for decorations that handle markers separately or
want to leave them untouched. `markerHalo` is preferred for glow /
halo coverage; reach for `skipMarkers` only when even outlined
markers would be wrong.

***

### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`

***

### tintMarkers?

> `readonly` `optional` **tintMarkers?**: `boolean`

When `true`, markers paint with `color` / `alpha` instead of their own
spec colors. Glow / halo decorations use this so the decoration covers
path + markers as a unified silhouette; marching-ants leaves it
undefined so markers stay normal-colored over the dashed line.
