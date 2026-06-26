# Type Alias: ErasedElement

> **ErasedElement** = \{ `edges`: [`GraphEdge`](../interfaces/GraphEdge.md)[]; `kind`: `"node"`; `node`: [`GraphNode`](../interfaces/GraphNode.md); \} \| \{ `edge`: [`GraphEdge`](../interfaces/GraphEdge.md); `kind`: `"edge"`; \}

Defined in: [graph/src/behaviours/EraseBehaviour.ts:34](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/EraseBehaviour.ts#L34)

Payload describing what [EraseBehaviour](../classes/EraseBehaviour.md) just removed. Carries the full
pre-removal element(s) so a consumer can rebuild them (undo). A removed node
carries its cascade-removed incident `edges`.
