# Interface: LifeTreeGraphNode

Defined in: [graph-datasets/src/lifeTree.ts:37](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-datasets/src/lifeTree.ts#L37)

A single node in the flat projection.

## Properties

### data

> **data**: `object`

Defined in: [graph-datasets/src/lifeTree.ts:39](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-datasets/src/lifeTree.ts#L39)

#### depth

> **depth**: `number`

Depth from root. Root is 0.

#### isLeaf

> **isLeaf**: `boolean`

True iff this node has no children.

#### kingdom?

> `optional` **kingdom?**: [`LifeTreeKingdom`](../type-aliases/LifeTreeKingdom.md)

Top-level domain of life. Inherited from the nearest ancestor whose name
is `'Bacteria'`, `'Eukaryota'`, or `'Archaea'`. The root and its two
pre-domain wrapper nodes have no kingdom.

#### length?

> `optional` **length?**: `number`

Branch length to parent (substitution rate). `undefined` on the root.

#### name

> **name**: `string`

Original Newick name. Empty for anonymous internal clades.

***

### id

> **id**: `string`

Defined in: [graph-datasets/src/lifeTree.ts:38](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-datasets/src/lifeTree.ts#L38)
