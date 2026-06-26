# Interface: NodeBadge

Defined in: [graph/src/layer/types.ts:489](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L489)

Small overlay attached to a node — e.g. notification dot, count chip,
status indicator. A badge is rendered as a real shape, so it inherits the
full shape surface: any registered [NodeShapeOptions](../type-aliases/NodeShapeOptions.md) kind as the
plate, optional [NodeIcon](../type-aliases/NodeIcon.md) as content, optional label text, plus
nested [decorations](#decorations) / [effects](#effects) that compose exactly the way
they do on a node body.

Position resolves from the host's AABB + the `placement` anchor + an
`origin` (which point of the badge sits at the anchor — defaults to the
mirror of `placement` so the badge nests fully outside the host edge).
Use `'center'` for the half-overhanging notification-bubble look.

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [graph/src/layer/types.ts:516](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L516)

***

### decorations?

> `readonly` `optional` **decorations?**: readonly `any`[]

Defined in: [graph/src/layer/types.ts:547](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L547)

Decorations attached to the badge plate. Each entry is a regular
[NodeDecorationSpec](../type-aliases/NodeDecorationSpec.md) — glow, ring, marching-ants, pulse-ring, etc.
Identity / merge rules match [NodeStyle.decorations](NodeStyle.md#decorations) (id-keyed,
`remove: true` drops earlier same-id entries from base under a state
overlay).

***

### effects?

> `readonly` `optional` **effects?**: [`NodeEffects`](NodeEffects.md)

Defined in: [graph/src/layer/types.ts:553](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L553)

Effects modulating the badge plate's transform / style each frame
(`shake`, `breathing`, …). Same surface as [NodeStyle.effects](NodeStyle.md#effects).

***

### fill?

> `readonly` `optional` **fill?**: `number`

Defined in: [graph/src/layer/types.ts:515](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L515)

Solid plate colour — projects to the badge shape's first fill layer.

***

### icon?

> `readonly` `optional` **icon?**: [`NodeIcon`](../type-aliases/NodeIcon.md)

Defined in: [graph/src/layer/types.ts:524](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L524)

Vector inset rendered inside the badge plate (glyph / svg / svg-url).
Projects to an extra fill layer stacked on top of the solid plate.

***

### id?

> `readonly` `optional` **id?**: `string`

Defined in: [graph/src/layer/types.ts:495](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L495)

Stable id within the node, for keyed updates / state-overlay diffing.
When omitted, identity falls back to the badge's position in the
containing `badges[]` array.

***

### labelColor?

> `readonly` `optional` **labelColor?**: `number`

Defined in: [graph/src/layer/types.ts:531](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L531)

***

### labelFontSize?

> `readonly` `optional` **labelFontSize?**: `number`

Defined in: [graph/src/layer/types.ts:532](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L532)

***

### labelText?

> `readonly` `optional` **labelText?**: `string`

Defined in: [graph/src/layer/types.ts:530](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L530)

Optional short text rendered centred on the badge (count "3", "!").
Projects to a `'label'` decoration on the badge.

***

### offsetX?

> `readonly` `optional` **offsetX?**: `number`

Defined in: [graph/src/layer/types.ts:535](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L535)

Pixel offset applied after placement resolution.

***

### offsetY?

> `readonly` `optional` **offsetY?**: `number`

Defined in: [graph/src/layer/types.ts:536](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L536)

***

### origin?

> `readonly` `optional` **origin?**: [`BadgeOrigin`](../type-aliases/BadgeOrigin.md)

Defined in: [graph/src/layer/types.ts:505](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L505)

Which point of the badge's own AABB lands at the host anchor.
Default: mirror of `placement` (badge sits fully outside the host edge).
Use `'center'` for the half-overhanging look.

***

### placement

> `readonly` **placement**: [`BadgePlacement`](../type-aliases/BadgePlacement.md)

Defined in: [graph/src/layer/types.ts:498](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L498)

Anchor point on the host node's AABB, or an explicit world point.

***

### shape

> `readonly` **shape**: [`NodeShapeOptions`](../type-aliases/NodeShapeOptions.md)

Defined in: [graph/src/layer/types.ts:512](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L512)

Pure geometry — any registered [NodeShapeOptions](../type-aliases/NodeShapeOptions.md) kind. Fill /
stroke / alpha come from the flat sugar fields below, mirroring the
`NodeStyle.shape` + `bgFill` split used for node bodies.

***

### strokeColor?

> `readonly` `optional` **strokeColor?**: `number`

Defined in: [graph/src/layer/types.ts:517](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L517)

***

### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`

Defined in: [graph/src/layer/types.ts:518](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L518)

***

### zIndex?

> `readonly` `optional` **zIndex?**: `number`

Defined in: [graph/src/layer/types.ts:538](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L538)
