# Type Alias: PreviewFieldPath

> **PreviewFieldPath** = `string`

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:88](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L88)

A dotted field path into the hovered element record — e.g. `'data.name'`,
`'type'`, `'id'`, or (for edges) `'source'` / `'target'`. Resolved against
the store's node / edge object.
