# Type Alias: ErasedElement

> **ErasedElement** = \{ `edges`: [`GraphEdge`](../interfaces/GraphEdge.md)[]; `kind`: `"node"`; `node`: [`GraphNode`](../interfaces/GraphNode.md); \} \| \{ `edge`: [`GraphEdge`](../interfaces/GraphEdge.md); `kind`: `"edge"`; \}

Payload describing what [EraseBehaviour](../classes/EraseBehaviour.md) just removed. Carries the full
pre-removal element(s) so a consumer can rebuild them (undo). A removed node
carries its cascade-removed incident `edges`.
