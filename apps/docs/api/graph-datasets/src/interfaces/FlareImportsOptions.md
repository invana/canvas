# Interface: FlareImportsOptions

Defined in: [graph-datasets/src/flare-imports.ts:51](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-datasets/src/flare-imports.ts#L51)

Options for [flareImportsAsGraph](../functions/flareImportsAsGraph.md).

## Properties

### intraGroupBias?

> `readonly` `optional` **intraGroupBias?**: `number`

Defined in: [graph-datasets/src/flare-imports.ts:62](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-datasets/src/flare-imports.ts#L62)

Probability that a generated import targets a leaf in the same depth-1
package as its source (vs a leaf in any other package). Default `0.7`
— produces a dense-intra-package + sparse-cross-package mix that
bundles cleanly through the hierarchy.

***

### maxImportsPerLeaf?

> `readonly` `optional` **maxImportsPerLeaf?**: `number`

Defined in: [graph-datasets/src/flare-imports.ts:55](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-datasets/src/flare-imports.ts#L55)

Maximum import out-degree per leaf. Default `5`.

***

### minImportsPerLeaf?

> `readonly` `optional` **minImportsPerLeaf?**: `number`

Defined in: [graph-datasets/src/flare-imports.ts:53](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-datasets/src/flare-imports.ts#L53)

Minimum import out-degree per leaf. Default `1`.
