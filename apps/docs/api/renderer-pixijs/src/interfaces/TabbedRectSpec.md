# Interface: TabbedRectSpec

Rectangle carrying a smaller raised **tab** on its top edge, traced as one
continuous silhouette — the "folder" outline. Fill and stroke run around
body and tab together, so it reads as a single object rather than a rect
with a badge stuck on it.

Anchored at the **top-left of the full AABB**, i.e. the top-left of the
tab band — so `(spec.x, spec.y)` is the topmost point of the silhouette,
`height` describes the *body* only, and `bounds().height` is
`tabHeight + height`. The body spans `y ∈ [tabHeight, tabHeight + height]`
across the full `width`; the tab spans `tabHeight` above it, inset
horizontally per [tabAlign](#tabalign) / [tabOffset](#taboffset).

A tab as wide as the body degenerates to a plain rect of the combined
height; that's a valid (if pointless) spec, not an error. `height: 0` is
the other degenerate end and a useful one — see [TabbedRectSpec.height](#height).

## Extends

- [`BaseShapeSpec`](BaseShapeSpec.md)

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`alpha`](BaseShapeSpec.md#alpha)

***

### cornerRadius?

> `readonly` `optional` **cornerRadius?**: `number`

Fillet applied to the body's outer corners. Default `0` (sharp).

***

### fill?

> `readonly` `optional` **fill?**: [`ShapeFill`](../type-aliases/ShapeFill.md)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`fill`](BaseShapeSpec.md#fill)

***

### height

> `readonly` **height**: `number`

Height of the **body alone**, excluding [tabHeight](#tabheight).

`0` (or less) draws the **tab by itself** — a closed folder. The tab's
base becomes an exterior edge (so it takes a fillet and loses the fold
line), the tab is free to lean even when flush with the body's former
edges, and `bounds().height` is just `tabHeight`. Anything anchored to
the silhouette (labels, edges, decorations) follows the tab.

***

### kind

> `readonly` **kind**: `"tabbed-rect"`

#### Overrides

[`BaseShapeSpec`](BaseShapeSpec.md).[`kind`](BaseShapeSpec.md#kind)

***

### plane?

> `readonly` `optional` **plane?**: `PlaneName`

Which paint stripe this shape renders into. Default `'content'` — with
every shape above every connector, the renderer's long-standing
"nodes above edges" convention.

`'backdrop'` moves the shape **below the connectors**, for scenery rather
than content: a group frame, a swimlane band, a region wash. Purely visual —
hit resolution still reads [zIndex](BaseShapeSpec.md#zindex) recorded at insert, so a backdrop
shape is picked exactly as it was before.

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`plane`](BaseShapeSpec.md#plane)

***

### rotation?

> `readonly` `optional` **rotation?**: `number`

Container-level rotation in radians, applied around the shape's
top-left local origin. Composes with effect-driven transform deltas
— the effect aggregator writes `(spec.rotation ?? 0) + dRot` per frame
so connector-hosted badges with `autoRotate: true` keep rotating
smoothly even while a `shake` / `breathing` effect runs on top.

For per-shape geometric rotation (the visible rotation of a regular
polygon's vertices, a star's points, etc.), use the kind-specific
`rotation` field on those shape specs — that one rotates the *geometry*
before it's drawn; this one rotates the *container* after.

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`rotation`](BaseShapeSpec.md#rotation)

***

### stroke?

> `readonly` `optional` **stroke?**: [`ShapeStroke`](ShapeStroke.md)

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`stroke`](BaseShapeSpec.md#stroke)

***

### tabAlign?

> `readonly` `optional` **tabAlign?**: [`TabAlign`](../type-aliases/TabAlign.md)

Which side the tab hugs. Default `'left'`.

***

### tabCornerRadius?

> `readonly` `optional` **tabCornerRadius?**: `number`

Fillet applied to the tab's two top corners. Defaults to
[cornerRadius](#cornerradius) so a uniformly-rounded folder needs one field.
The two re-entrant "shoulder" corners where the tab meets the body
always stay sharp — rounding them reads as a dent, not a fold.

***

### tabDivider?

> `readonly` `optional` **tabDivider?**: `boolean`

Draw the tab's bottom border — the fold line across the tab's base where
it meets the body. Default `true`; set `false` for an open profile where
the tab flows into the body with no seam.

It's interior geometry, painted only on the shape's own pass: a
decoration borrowing this silhouette (glow, halo, marching ants) traces
the outline alone. It's also skipped when the spec carries no stroke —
it's a border, with no colour of its own to fall back on.

***

### tabHeight

> `readonly` **tabHeight**: `number`

Height of the raised tab, added above the body.

***

### tabOffset?

> `readonly` `optional` **tabOffset?**: `number`

Distance from the [tabAlign](#tabalign) edge to the tab. Default `0` — the
tab is flush with that side, which merges its outer edge into the
body's and produces the classic folder profile. Ignored when
`tabAlign: 'center'`.

***

### tabPadding?

> `readonly` `optional` **tabPadding?**: `number`

Horizontal breathing room between the tab's content and each of its ends,
used when `ShapeCtor.fitToContent` sizes the tab. Default `10`. Ignored
when [tabWidth](#tabwidth) is pinned.

***

### tabSkew?

> `readonly` `optional` **tabSkew?**: `number`

Horizontal run of the tab's **angled** side, in px. Default `0` (a
square tab). A non-zero value tapers the tab inward toward its top,
which is what separates a folder tab from a box parked on a rectangle.

The lean is always on the side facing the rest of the frame — the right
edge for `tabAlign: 'left'`, the left edge for `'right'`, and both for
`'center'`. A side flush with the body's own edge can't lean, since the
two edges have merged.

[tabWidth](#tabwidth) measures the tab at its **base**, so the skew eats into
the top edge rather than widening the footprint. Clamped so the slants
can never consume more than half the tab.

***

### tabWidth?

> `readonly` `optional` **tabWidth?**: `number`

Width of the raised tab, measured at its base. Clamped to [width](#width)
while a body is present; on a bodyless folder (`height <= 0`) the tab is
the whole silhouette, so it sizes freely and *becomes* the AABB width.

Omit to leave it unresolved — it then falls back to `width` (a full-width
tab), and `ShapeCtor.fitToContent` sizes it to the title the caller
measures. Set it to pin the tab and opt out of that fitting.

***

### visible?

> `readonly` `optional` **visible?**: `boolean`

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`visible`](BaseShapeSpec.md#visible)

***

### width

> `readonly` **width**: `number`

Width of the body — also the AABB width; the tab never exceeds it.

***

### x

> `readonly` **x**: `number`

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`x`](BaseShapeSpec.md#x)

***

### y

> `readonly` **y**: `number`

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`y`](BaseShapeSpec.md#y)

***

### zIndex?

> `readonly` `optional` **zIndex?**: `number`

Default `0`. Higher = on top. Used for hit-test resolution.

#### Inherited from

[`BaseShapeSpec`](BaseShapeSpec.md).[`zIndex`](BaseShapeSpec.md#zindex)
