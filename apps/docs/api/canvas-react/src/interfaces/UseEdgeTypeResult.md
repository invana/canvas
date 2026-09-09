# Interface: UseEdgeTypeResult

## Properties

### edgeType

> **edgeType**: `string`

Currently-selected path type key.

***

### edgeTypeOptions

> **edgeTypeOptions**: `Record`\<`string`, `string`\>

Key → label map for a picker.

***

### setEdgeType

> **setEdgeType**: (`type`) => `void`

Switch the path type for **every** edge in the layer and make it the
default for future edges (via `GraphLayer.setEdgeDefaults`).

#### Parameters

##### type

`string`

#### Returns

`void`
