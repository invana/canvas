# Interface: IDecorationBase\<THostInfo, TStyle\>

Common base for shape and connector decorations. Presence of `tick` makes
the decoration animated — the renderer registers it into the per-frame
animation set; `tick` returns `true` to keep ticking, `false` to retire.
Static decorations omit `tick` and cost zero per frame after `mount`.

## Type Parameters

### THostInfo

`THostInfo`

### TStyle

`TStyle` = `unknown`

## Properties

### style

> `readonly` **style**: `TStyle`

## Methods

### destroy()?

> `optional` **destroy**(): `void`

#### Returns

`void`

***

### getEndPadding()?

> `optional` **getEndPadding**(): `object`

Connector-only: declare how many pixels of extra "outer extent" this
decoration needs past each endpoint of the routed path. The renderer
aggregates the max across all attached decorations and trims the path
by that amount before drawing — so the body + markers sit back from
the anchor, and the decoration's outer edge (halo radius, ripple peak)
lands at the anchor instead of overshooting into the host shape.
Omit (or return 0) when the decoration doesn't extend past endpoints
(e.g. marching-ants strokes the line at the host's width).

#### Returns

`object`

##### source

> `readonly` **source**: `number`

##### target

> `readonly` **target**: `number`

***

### getOuterExtent()?

> `optional` **getOuterExtent**(): `number`

Shape-only: declare how many pixels past the host silhouette this
decoration paints **at rest**. The renderer aggregates the max across
sibling decorations and threads it through `ShapeDecorationHostInfo`
so the `LabelDecoration` can push outside-placement labels past the
outermost ring / halo instead of overlapping them.

Return the resting (non-animated) outer edge — a `pulse-ring` whose
radius oscillates 0 → 24 → 0 should still report `0`, otherwise the
label would yo-yo with the pulse. Static decorations that overlay
the host silhouette directly (`marching-ants`, the label itself)
also return `0`. Omit entirely when irrelevant.

#### Returns

`number`

***

### mount()

> **mount**(`host`): `void`

#### Parameters

##### host

`THostInfo`

#### Returns

`void`

***

### tick()?

> `optional` **tick**(`deltaMs`): `boolean`

#### Parameters

##### deltaMs

`number`

#### Returns

`boolean`

***

### update()?

> `optional` **update**(`host`): `void`

#### Parameters

##### host

`THostInfo`

#### Returns

`void`
