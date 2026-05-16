# Function: ukEnergyFlowAsGraph()

> **ukEnergyFlowAsGraph**(): [`UkEnergyFlowGraphData`](../interfaces/UkEnergyFlowGraphData.md)

Defined in: [graph-datasets/src/uk-energy-flow.ts:92](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph-datasets/src/uk-energy-flow.ts#L92)

Project [ukEnergyFlow](../variables/ukEnergyFlow.md) to `{nodes, edges}` for `GraphLayer.setData`.

The mapping:
 - Numeric link endpoints → string ids (the node `name`).
 - Each node carries `data.category` for colour grouping.
 - Edge ids are `<source>--<target>`; the source dataset has no duplicate
   pairs, so no extra disambiguation is needed.

## Returns

[`UkEnergyFlowGraphData`](../interfaces/UkEnergyFlowGraphData.md)
