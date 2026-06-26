# Interface: FlareImportsGraphData

Defined in: [graph-datasets/src/flare-imports.ts:42](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-datasets/src/flare-imports.ts#L42)

Output of [flareImportsAsGraph](../functions/flareImportsAsGraph.md).

## Properties

### importEdges

> **importEdges**: [`FlareImportEdge`](FlareImportEdge.md)[]

Defined in: [graph-datasets/src/flare-imports.ts:47](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-datasets/src/flare-imports.ts#L47)

Synthetic leaf→leaf import edges. Render these as bundled curves.

***

### nodes

> **nodes**: [`FlareGraphNode`](FlareGraphNode.md)[]

Defined in: [graph-datasets/src/flare-imports.ts:43](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-datasets/src/flare-imports.ts#L43)

***

### treeEdges

> **treeEdges**: [`FlareGraphEdge`](FlareGraphEdge.md)[]

Defined in: [graph-datasets/src/flare-imports.ts:45](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-datasets/src/flare-imports.ts#L45)

Parent→child edges from the flare hierarchy. Feed these to the layout.
