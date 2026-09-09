# Interface: UseEdgeTypeOptions

## Properties

### initial?

> `optional` **initial?**: `EdgePathType`

Initially-selected path type. When omitted, the hook seeds from the layer's
current `edgeDefaults.shape.pathType` on mount, falling back to the first
entry of `types`.

***

### labels?

> `optional` **labels?**: `Record`\<`string`, `string`\>

Optional key → human label map. Default [DEFAULT\_EDGE\_TYPE\_LABELS](../variables/DEFAULT_EDGE_TYPE_LABELS.md).

***

### layerId?

> `optional` **layerId?**: `string`

Target `GraphLayer` id. Default `'graph'`.

***

### types?

> `optional` **types?**: readonly `EdgePathType`[]

Path types to expose, in order. Default [DEFAULT\_EDGE\_TYPES](../variables/DEFAULT_EDGE_TYPES.md).
