# Function: ukEnergyFlowAsGraph()

> **ukEnergyFlowAsGraph**(): `object`

Project [ukEnergyFlow](../variables/ukEnergyFlow.md) to `{nodes, edges}` for `GraphLayer.setData`.

The mapping:
 - Numeric link endpoints → string ids (the node `name`).
 - Each node carries `data.category` for colour grouping.
 - Edge ids are `<source>--<target>`; the source dataset has no duplicate
   pairs, so no extra disambiguation is needed.

## Returns

`object`

### edges

> **edges**: `GraphEdge`\<`unknown`\> & `object`[] = `graphEdges`

### nodes

> **nodes**: `GraphNode`\<`unknown`\> & `object`[] = `graphNodes`
