# Interface: NodeSize

Defined in: [graph-layout-elkjs/src/types.ts:69](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-elkjs/src/types.ts#L69)

Resolved node bounding box, in canvas units. ELK needs concrete width +
height for every node to place them — `ElkLayout` derives these from the
resolved node style by default, but you can override per-node via
[ElkLayoutOptions.nodeSize](ElkLayoutOptions.md#nodesize).

## Properties

### height

> **height**: `number`

Defined in: [graph-layout-elkjs/src/types.ts:71](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-elkjs/src/types.ts#L71)

***

### width

> **width**: `number`

Defined in: [graph-layout-elkjs/src/types.ts:70](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-elkjs/src/types.ts#L70)
