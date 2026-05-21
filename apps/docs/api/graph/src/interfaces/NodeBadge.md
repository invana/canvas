# Interface: NodeBadge

Defined in: [graph/src/layer/types.ts:459](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L459)

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

Defined in: [graph/src/layer/types.ts:486](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L486)

***

### decorations?

> `readonly` `optional` **decorations?**: readonly `any`[]

Defined in: [graph/src/layer/types.ts:517](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L517)

Decorations attached to the badge plate. Each entry is a regular
[NodeDecorationSpec](../type-aliases/NodeDecorationSpec.md) — glow, ring, marching-ants, pulse-ring, etc.
Identity / merge rules match [NodeStyle.decorations](NodeStyle.md#decorations) (id-keyed,
`remove: true` drops earlier same-id entries from base under a state
overlay).

***

### effects?

> `readonly` `optional` **effects?**: [`NodeEffects`](NodeEffects.md)

Defined in: [graph/src/layer/types.ts:523](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L523)

Effects modulating the badge plate's transform / style each frame
(`shake`, `breathing`, …). Same surface as [NodeStyle.effects](NodeStyle.md#effects).

***

### fill?

> `readonly` `optional` **fill?**: `number`

Defined in: [graph/src/layer/types.ts:485](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L485)

Solid plate colour — projects to the badge shape's first fill layer.

***

### icon?

> `readonly` `optional` **icon?**: [`NodeIcon`](../type-aliases/NodeIcon.md)

Defined in: [graph/src/layer/types.ts:494](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L494)

Vector inset rendered inside the badge plate (glyph / svg / svg-url).
Projects to an extra fill layer stacked on top of the solid plate.

***

### id?

> `readonly` `optional` **id?**: `string`

Defined in: [graph/src/layer/types.ts:465](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L465)

Stable id within the node, for keyed updates / state-overlay diffing.
When omitted, identity falls back to the badge's position in the
containing `badges[]` array.

***

### labelColor?

> `readonly` `optional` **labelColor?**: `number`

Defined in: [graph/src/layer/types.ts:501](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L501)

***

### labelFontSize?

> `readonly` `optional` **labelFontSize?**: `number`

Defined in: [graph/src/layer/types.ts:502](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L502)

***

### labelText?

> `readonly` `optional` **labelText?**: `string`

Defined in: [graph/src/layer/types.ts:500](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L500)

Optional short text rendered centred on the badge (count "3", "!").
Projects to a `'label'` decoration on the badge.

***

### offsetX?

> `readonly` `optional` **offsetX?**: `number`

Defined in: [graph/src/layer/types.ts:505](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L505)

Pixel offset applied after placement resolution.

***

### offsetY?

> `readonly` `optional` **offsetY?**: `number`

Defined in: [graph/src/layer/types.ts:506](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L506)

***

### origin?

> `readonly` `optional` **origin?**: [`BadgeOrigin`](../type-aliases/BadgeOrigin.md)

Defined in: [graph/src/layer/types.ts:475](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L475)

Which point of the badge's own AABB lands at the host anchor.
Default: mirror of `placement` (badge sits fully outside the host edge).
Use `'center'` for the half-overhanging look.

***

### placement

> `readonly` **placement**: [`BadgePlacement`](../type-aliases/BadgePlacement.md)

Defined in: [graph/src/layer/types.ts:468](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L468)

Anchor point on the host node's AABB, or an explicit world point.

***

### shape

> `readonly` **shape**: [`NodeShapeOptions`](../type-aliases/NodeShapeOptions.md)

Defined in: [graph/src/layer/types.ts:482](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L482)

Pure geometry — any registered [NodeShapeOptions](../type-aliases/NodeShapeOptions.md) kind. Fill /
stroke / alpha come from the flat sugar fields below, mirroring the
`NodeStyle.shape` + `bgFill` split used for node bodies.

***

### strokeColor?

> `readonly` `optional` **strokeColor?**: `number`

Defined in: [graph/src/layer/types.ts:487](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L487)

***

### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`

Defined in: [graph/src/layer/types.ts:488](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L488)

***

### zIndex?

> `readonly` `optional` **zIndex?**: `number`

Defined in: [graph/src/layer/types.ts:508](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L508)
