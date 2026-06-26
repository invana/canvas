# Interface: NodeSize

Defined in: [graph-layout-elkjs/src/types.ts:70](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-elkjs/src/types.ts#L70)

Resolved node bounding box, in canvas units. ELK needs concrete width +
height for every node to place them — `ElkLayout` derives these from the
resolved node style by default, but you can override per-node via
[ElkLayoutOptions.nodeSize](ElkLayoutOptions.md#nodesize).

## Properties

### height

> **height**: `number`

Defined in: [graph-layout-elkjs/src/types.ts:72](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-elkjs/src/types.ts#L72)

***

### width

> **width**: `number`

Defined in: [graph-layout-elkjs/src/types.ts:71](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-elkjs/src/types.ts#L71)
