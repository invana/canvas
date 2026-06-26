# Interface: UseEdgeTypeOptions

Defined in: [canvas-react/src/hooks/useEdgeType.ts:35](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useEdgeType.ts#L35)

## Properties

### initial?

> `optional` **initial?**: `EdgePathType`

Defined in: [canvas-react/src/hooks/useEdgeType.ts:43](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useEdgeType.ts#L43)

Initially-selected path type. When omitted, the hook seeds from the layer's
current `edgeDefaults.shape.pathType` on mount, falling back to the first
entry of `types`.

***

### labels?

> `optional` **labels?**: `Record`\<`string`, `string`\>

Defined in: [canvas-react/src/hooks/useEdgeType.ts:47](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useEdgeType.ts#L47)

Optional key → human label map. Default [DEFAULT\_EDGE\_TYPE\_LABELS](../variables/DEFAULT_EDGE_TYPE_LABELS.md).

***

### layerId?

> `optional` **layerId?**: `string`

Defined in: [canvas-react/src/hooks/useEdgeType.ts:37](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useEdgeType.ts#L37)

Target `GraphLayer` id. Default `'graph'`.

***

### types?

> `optional` **types?**: readonly `EdgePathType`[]

Defined in: [canvas-react/src/hooks/useEdgeType.ts:45](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useEdgeType.ts#L45)

Path types to expose, in order. Default [DEFAULT\_EDGE\_TYPES](../variables/DEFAULT_EDGE_TYPES.md).
