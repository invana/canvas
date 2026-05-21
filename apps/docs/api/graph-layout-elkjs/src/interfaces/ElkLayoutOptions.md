# Interface: ElkLayoutOptions

Defined in: [graph-layout-elkjs/src/types.ts:75](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-elkjs/src/types.ts#L75)

`ElkLayout` constructor options. See top-level module doc.

## Properties

### algorithm?

> `optional` **algorithm?**: [`ElkAlgorithmName`](../type-aliases/ElkAlgorithmName.md)

Defined in: [graph-layout-elkjs/src/types.ts:77](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-elkjs/src/types.ts#L77)

`elk.algorithm`. Default: `'layered'`.

***

### defaultNodeSize?

> `optional` **defaultNodeSize?**: [`NodeSize`](NodeSize.md)

Defined in: [graph-layout-elkjs/src/types.ts:99](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-elkjs/src/types.ts#L99)

Fallback bounding box used when [nodeSize](#nodesize) is not provided and
the node has no resolvable `style.shape`. Default `{ width: 40, height: 40 }`.

***

### direction?

> `optional` **direction?**: [`ElkDirection`](../type-aliases/ElkDirection.md)

Defined in: [graph-layout-elkjs/src/types.ts:79](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-elkjs/src/types.ts#L79)

`elk.direction`. Algorithms that respect direction: `layered`, `mrtree`, ...

***

### edgeNodeSpacing?

> `optional` **edgeNodeSpacing?**: `number`

Defined in: [graph-layout-elkjs/src/types.ts:89](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-elkjs/src/types.ts#L89)

`elk.spacing.edgeNode` — gap between an edge and a node.

***

### edgeSpacing?

> `optional` **edgeSpacing?**: `number`

Defined in: [graph-layout-elkjs/src/types.ts:91](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-elkjs/src/types.ts#L91)

`elk.spacing.edgeEdge` — gap between parallel edges.

***

### layerSpacing?

> `optional` **layerSpacing?**: `number`

Defined in: [graph-layout-elkjs/src/types.ts:87](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-elkjs/src/types.ts#L87)

`elk.layered.spacing.nodeNodeBetweenLayers` — gap between consecutive
layers in the `layered` algorithm. Ignored by other algorithms.

***

### layoutOptions?

> `optional` **layoutOptions?**: `Record`\<`string`, `string`\>

Defined in: [graph-layout-elkjs/src/types.ts:118](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-elkjs/src/types.ts#L118)

Free-form ELK property bag, merged into the root graph's
`layoutOptions` after the convenience fields above. Use for any
property the typed surface doesn't cover (`elk.layered.crossingMinimization.strategy`,
`elk.aspectRatio`, etc.). Later keys win.

***

### nodeSize?

> `optional` **nodeSize?**: (`node`) => [`NodeSize`](NodeSize.md)

Defined in: [graph-layout-elkjs/src/types.ts:110](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-elkjs/src/types.ts#L110)

Per-node bounding box override. Called once per node at the start of
`apply()` with the underlying `GraphNode`. When omitted, `ElkLayout`
reads `style.shape` via the layer's `resolveNodeStyle` and falls back
to [defaultNodeSize](#defaultnodesize) when no shape is found.

Return tight bounds — ELK adds spacing on top, so over-sized boxes
blow up the final layout.

#### Parameters

##### node

[`GraphNode`](../../../graph/src/interfaces/GraphNode.md)

#### Returns

[`NodeSize`](NodeSize.md)

***

### nodeSpacing?

> `optional` **nodeSpacing?**: `number`

Defined in: [graph-layout-elkjs/src/types.ts:82](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-elkjs/src/types.ts#L82)

`elk.spacing.nodeNode` — minimum gap between sibling nodes.

***

### padding?

> `optional` **padding?**: [`ElkPadding`](../type-aliases/ElkPadding.md)

Defined in: [graph-layout-elkjs/src/types.ts:93](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-elkjs/src/types.ts#L93)

`elk.padding` — graph-level padding.
