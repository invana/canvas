# Interface: IDecorationBase\<THostInfo, TStyle\>

Defined in: [canvas/src/primitives/types.ts:812](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L812)

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

Defined in: [canvas/src/primitives/types.ts:813](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L813)

## Methods

### destroy()?

> `optional` **destroy**(): `void`

Defined in: [canvas/src/primitives/types.ts:817](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L817)

#### Returns

`void`

***

### getEndPadding()?

> `optional` **getEndPadding**(): `object`

Defined in: [canvas/src/primitives/types.ts:828](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L828)

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

Defined in: [canvas/src/primitives/types.ts:842](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L842)

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

Defined in: [canvas/src/primitives/types.ts:814](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L814)

#### Parameters

##### host

`THostInfo`

#### Returns

`void`

***

### tick()?

> `optional` **tick**(`deltaMs`): `boolean`

Defined in: [canvas/src/primitives/types.ts:816](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L816)

#### Parameters

##### deltaMs

`number`

#### Returns

`boolean`

***

### update()?

> `optional` **update**(`host`): `void`

Defined in: [canvas/src/primitives/types.ts:815](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L815)

#### Parameters

##### host

`THostInfo`

#### Returns

`void`
