# Interface: NodeRenderHints

Defined in: [graph/src/layer/types.ts:131](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/types.ts#L131)

Render-spec hints a caller may put under `node.data` to control how the
layer renders this node. All fields are optional; defaults below.

Per-node `node.data` uses this **static** form — write concrete values,
not functions. Resolver functions are reserved for the layer-wide
`nodeDefaults` and for `NodeStateConfig`; both are typed as
[ResolvableNodeRenderHints](../type-aliases/ResolvableNodeRenderHints.md), the resolver-aware sibling of this
interface.

**LEGACY** — superseded by [NodeStyle](NodeStyle.md) (v3 G6-aligned shape). Kept
for backward compatibility; the GraphLayer reads both paths and merges.

## Properties

### alpha?

> `optional` **alpha?**: `number`

Defined in: [graph/src/layer/types.ts:162](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/types.ts#L162)

Alpha 0–1. Default 1.

***

### cornerRadius?

> `optional` **cornerRadius?**: `number`

Defined in: [graph/src/layer/types.ts:139](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/types.ts#L139)

Rect corner radius. Default 4.

***

### endAngle?

> `optional` **endAngle?**: `number`

Defined in: [graph/src/layer/types.ts:154](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/types.ts#L154)

Arc-only — end angle in radians. Required when `shape === 'arc'`.

***

### fill?

> `optional` **fill?**: `number` \| `false`

Defined in: [graph/src/layer/types.ts:156](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/types.ts#L156)

Fill color (0xRRGGBB) or `false` for no fill. Default `0x3b82f6`.

***

### height?

> `optional` **height?**: `number`

Defined in: [graph/src/layer/types.ts:137](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/types.ts#L137)

Height (rect only). Defaults to `size` for square rects.

***

### innerR?

> `optional` **innerR?**: `number`

Defined in: [graph/src/layer/types.ts:145](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/types.ts#L145)

Arc-only — inner radius of the annular sector. Required when
`shape === 'arc'`; ignored for other shapes. Pair with `outerR`,
`startAngle`, `endAngle`. The node's `position` is the arc's centre.

***

### label?

> `optional` **label?**: [`NodeLabelHint`](../type-aliases/NodeLabelHint.md)

Defined in: [graph/src/layer/types.ts:171](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/types.ts#L171)

Optional text label attached to the node. Pass a string for the simple
case (defaults to plain text below the node) or a `ShapeLabelStyle`
payload for full control (placement, wrap, background pill, html-text).

Resolves to a canvas `'label'` decoration on the rendered shape.

#### See

[NodeLabelHint](../type-aliases/NodeLabelHint.md)

***

### outerR?

> `optional` **outerR?**: `number`

Defined in: [graph/src/layer/types.ts:147](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/types.ts#L147)

Arc-only — outer radius. Required when `shape === 'arc'`.

***

### shape?

> `optional` **shape?**: [`NodeShapeKind`](../type-aliases/NodeShapeKind.md)

Defined in: [graph/src/layer/types.ts:133](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/types.ts#L133)

Shape kind. Default `'circle'`.

***

### size?

> `optional` **size?**: `number`

Defined in: [graph/src/layer/types.ts:135](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/types.ts#L135)

Diameter (circle) or width (rect). Default 32.

***

### startAngle?

> `optional` **startAngle?**: `number`

Defined in: [graph/src/layer/types.ts:152](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/types.ts#L152)

Arc-only — start angle in radians (`0` = 3 o'clock, increasing sweeps
clockwise on screen). Required when `shape === 'arc'`.

***

### stroke?

> `optional` **stroke?**: `number` \| `false`

Defined in: [graph/src/layer/types.ts:158](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/types.ts#L158)

Stroke color (0xRRGGBB) or `false` for no stroke. Default `0x1d4ed8`.

***

### strokeWidth?

> `optional` **strokeWidth?**: `number`

Defined in: [graph/src/layer/types.ts:160](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/types.ts#L160)

Stroke width. Default 1.
