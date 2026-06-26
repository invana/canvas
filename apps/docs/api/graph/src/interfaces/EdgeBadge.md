# Interface: EdgeBadge

Defined in: [graph/src/layer/types.ts:589](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L589)

Small overlay attached to an edge — e.g. flow-rate chip on the midpoint,
count badge at the source endpoint, arrow-tag at the target. A badge is
rendered as a real shape (any registered [NodeShapeOptions](../type-aliases/NodeShapeOptions.md) kind);
placement is parametric along the routed path.

Position resolves via `samplePathAt(path, t)` so the badge re-anchors
automatically when the path changes (source / target shape moves, anchor
/ router / waypoints change). For loop edges, `'middle'` naturally lands
on the loop apex because the path passes through it at `t ≈ 0.5`.

Decorations and effects compose exactly the way they do on
[NodeBadge](NodeBadge.md); the badge being shape-rendered means shape decorations
(`glow`, `ring`, `marching-ants`, `pulse-ring`, …) apply uniformly.

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [graph/src/layer/types.ts:618](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L618)

***

### autoRotate?

> `readonly` `optional` **autoRotate?**: `boolean`

Defined in: [graph/src/layer/types.ts:652](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L652)

When `true`, the badge rotates to follow the path tangent at the
anchor point. Default `false` (badges stay axis-aligned). Useful for
arrow-shaped or directional badges on curved edges.

***

### decorations?

> `readonly` `optional` **decorations?**: readonly `any`[]

Defined in: [graph/src/layer/types.ts:670](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L670)

Decorations attached to the badge plate. Same surface as
[NodeBadge.decorations](NodeBadge.md#decorations) — shape decorations (`glow`, `ring`,
`marching-ants`, `pulse-ring`) apply because the badge is itself a
shape, regardless of being hosted on a connector.

***

### effects?

> `readonly` `optional` **effects?**: [`NodeEffects`](NodeEffects.md)

Defined in: [graph/src/layer/types.ts:677](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L677)

Effects modulating the badge plate's transform / style each frame
(`shake`, `breathing`, …). Same surface as
[NodeBadge.effects](NodeBadge.md#effects).

***

### fill?

> `readonly` `optional` **fill?**: `number`

Defined in: [graph/src/layer/types.ts:617](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L617)

Solid plate colour — projects to the badge shape's first fill layer.

***

### icon?

> `readonly` `optional` **icon?**: [`NodeIcon`](../type-aliases/NodeIcon.md)

Defined in: [graph/src/layer/types.ts:626](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L626)

Vector inset rendered inside the badge plate (glyph / svg / svg-url).
Projects to an extra fill layer stacked on top of the solid plate.

***

### id?

> `readonly` `optional` **id?**: `string`

Defined in: [graph/src/layer/types.ts:595](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L595)

Stable id within the edge, for keyed updates / state-overlay diffing.
When omitted, identity falls back to the badge's position in the
containing `badges[]` array.

***

### keepUpright?

> `readonly` `optional` **keepUpright?**: `boolean`

Defined in: [graph/src/layer/types.ts:660](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L660)

When [autoRotate](#autorotate) is `true`, flip the badge by 180° on the
"downward" half of the path so text decorations stay readable on
every edge orientation. Default `true`. Ignored when `autoRotate` is
`false`.

***

### labelColor?

> `readonly` `optional` **labelColor?**: `number`

Defined in: [graph/src/layer/types.ts:633](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L633)

***

### labelFontSize?

> `readonly` `optional` **labelFontSize?**: `number`

Defined in: [graph/src/layer/types.ts:634](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L634)

***

### labelText?

> `readonly` `optional` **labelText?**: `string`

Defined in: [graph/src/layer/types.ts:632](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L632)

Optional short text rendered centred on the badge (count "3", "!").
Projects to a `'label'` decoration on the badge.

***

### offsetX?

> `readonly` `optional` **offsetX?**: `number`

Defined in: [graph/src/layer/types.ts:644](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L644)

Pixel offset applied after placement resolution.

***

### offsetY?

> `readonly` `optional` **offsetY?**: `number`

Defined in: [graph/src/layer/types.ts:645](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L645)

***

### origin?

> `readonly` `optional` **origin?**: [`BadgeOrigin`](../type-aliases/BadgeOrigin.md)

Defined in: [graph/src/layer/types.ts:607](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L607)

Which point of the badge's own AABB lands at the path anchor.
Default for edge badges is `'center'` — the badge centres on the path
point. Use other origins to lift the badge off the line (e.g.
`origin: 'bottom'` puts the badge above the line with its bottom edge
touching the path).

***

### pathOffset?

> `readonly` `optional` **pathOffset?**: `number`

Defined in: [graph/src/layer/types.ts:641](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L641)

Shift the path-anchor along the local tangent (positive = forward
toward `'end'`, negative = backward toward `'start'`). Useful for
nudging a `'middle'`-anchored badge sideways without changing `t`.

***

### placement

> `readonly` **placement**: [`EdgeBadgePlacement`](../type-aliases/EdgeBadgePlacement.md)

Defined in: [graph/src/layer/types.ts:598](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L598)

Where along the routed path the badge attaches.

***

### shape

> `readonly` **shape**: [`NodeShapeOptions`](../type-aliases/NodeShapeOptions.md)

Defined in: [graph/src/layer/types.ts:614](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L614)

Pure geometry — any registered [NodeShapeOptions](../type-aliases/NodeShapeOptions.md) kind. Fill /
stroke / alpha come from the flat sugar fields below, mirroring the
`NodeStyle.shape` + `bgFill` split used for node bodies.

***

### strokeColor?

> `readonly` `optional` **strokeColor?**: `number`

Defined in: [graph/src/layer/types.ts:619](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L619)

***

### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`

Defined in: [graph/src/layer/types.ts:620](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L620)

***

### zIndex?

> `readonly` `optional` **zIndex?**: `number`

Defined in: [graph/src/layer/types.ts:662](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L662)
