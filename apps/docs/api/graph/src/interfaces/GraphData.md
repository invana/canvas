# Interface: GraphData

Initial-load shape passed to `graphLayer.setData(data)`.

Carries **input** records — `type` is optional here and the store defaults it
to `UNKNOWN_TYPE` on insert. Read the data back with `store.nodes()` /
`exportData()` to get the stored form, where `type` is always a `string`.

## Properties

### edges

> **edges**: [`GraphEdge`](GraphEdge.md)\<`unknown`\>[]

***

### nodes

> **nodes**: [`GraphNode`](GraphNode.md)\<`unknown`\>[]
