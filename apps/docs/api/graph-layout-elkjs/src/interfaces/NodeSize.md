# Interface: NodeSize

Resolved node bounding box, in canvas units. ELK needs concrete width +
height for every node to place them — `ElkLayout` derives these from the
resolved node style by default, but you can override per-node via
[ElkLayoutOptions.nodeSize](ElkLayoutOptions.md#nodesize).

## Properties

### height

> **height**: `number`

***

### width

> **width**: `number`
