# Interface: LifeTreeNode

Defined in: [graph-datasets/src/lifeTree.ts:27](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-datasets/src/lifeTree.ts#L27)

Node shape in the parsed Newick hierarchy.

## Properties

### children?

> `optional` **children?**: `LifeTreeNode`[]

Defined in: [graph-datasets/src/lifeTree.ts:33](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-datasets/src/lifeTree.ts#L33)

Child clades. Leaves omit this field.

***

### length?

> `optional` **length?**: `number`

Defined in: [graph-datasets/src/lifeTree.ts:31](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-datasets/src/lifeTree.ts#L31)

Branch length to parent (substitution rate). `undefined` on the root.

***

### name

> **name**: `string`

Defined in: [graph-datasets/src/lifeTree.ts:29](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-datasets/src/lifeTree.ts#L29)

Clade or species name. May be empty for anonymous internal nodes.
