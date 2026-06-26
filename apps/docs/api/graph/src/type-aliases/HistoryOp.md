# Type Alias: HistoryOp

> **HistoryOp** = \{ `kind`: `"addNode"`; `node`: [`GraphNode`](../interfaces/GraphNode.md); \} \| \{ `edges`: [`GraphEdge`](../interfaces/GraphEdge.md)[]; `kind`: `"removeNode"`; `node`: [`GraphNode`](../interfaces/GraphNode.md); \} \| \{ `after`: `Partial`\<[`GraphNode`](../interfaces/GraphNode.md)\>; `before`: `Partial`\<[`GraphNode`](../interfaces/GraphNode.md)\>; `id`: `string`; `kind`: `"updateNode"`; \} \| \{ `after`: [`Vec2`](../interfaces/Vec2.md); `before`: [`Vec2`](../interfaces/Vec2.md); `id`: `string`; `kind`: `"moveNode"`; \} \| \{ `edge`: [`GraphEdge`](../interfaces/GraphEdge.md); `kind`: `"addEdge"`; \} \| \{ `edge`: [`GraphEdge`](../interfaces/GraphEdge.md); `kind`: `"removeEdge"`; \} \| \{ `after`: `Partial`\<[`GraphEdge`](../interfaces/GraphEdge.md)\>; `before`: `Partial`\<[`GraphEdge`](../interfaces/GraphEdge.md)\>; `id`: `string`; `kind`: `"updateEdge"`; \}

Defined in: [graph/src/history/types.ts:24](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/history/types.ts#L24)

A single invertible store mutation. `removeNode` carries the cascade-removed
incident `edges` so undo can restore them alongside the node. `update*` ops
carry both `before` (for undo) and `after` (for redo) partial states.
