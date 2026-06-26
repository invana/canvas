# Interface: UseEdgeTypeResult

Defined in: [canvas-react/src/hooks/useEdgeType.ts:50](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useEdgeType.ts#L50)

## Properties

### edgeType

> **edgeType**: `string`

Defined in: [canvas-react/src/hooks/useEdgeType.ts:52](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useEdgeType.ts#L52)

Currently-selected path type key.

***

### edgeTypeOptions

> **edgeTypeOptions**: `Record`\<`string`, `string`\>

Defined in: [canvas-react/src/hooks/useEdgeType.ts:54](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useEdgeType.ts#L54)

Key → label map for a picker.

***

### setEdgeType

> **setEdgeType**: (`type`) => `void`

Defined in: [canvas-react/src/hooks/useEdgeType.ts:59](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useEdgeType.ts#L59)

Switch the path type for **every** edge in the layer and make it the
default for future edges (via `GraphLayer.setEdgeDefaults`).

#### Parameters

##### type

`string`

#### Returns

`void`
