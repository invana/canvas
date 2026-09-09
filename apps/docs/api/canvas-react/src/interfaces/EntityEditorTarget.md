# Interface: EntityEditorTarget

The single selected node/edge, its current label + data, and a commit action.

## Properties

### commit

> **commit**: (`values`) => `void`

Write the editor's values back to the store, undoable as one entry when a
`<GraphHistoryProvider>` is present (a direct mutation otherwise). Replaces
`data` wholesale. A **node** also overwrites `style.labelText` (spreading the
prior style); an **edge** writes its `type` instead — edges have no label.

#### Parameters

##### values

`PropertiesEditorValues`

#### Returns

`void`

***

### data

> **data**: `Record`\<`string`, `string`\>

Current `data` as a flat string map (non-string values are stringified).

***

### id

> **id**: `string`

***

### kind

> **kind**: `"node"` \| `"edge"`

***

### label

> **label**: `string`

Effective (resolved) label text. Empty for edges (they have no label field).

***

### reverse?

> `optional` **reverse?**: () => `void`

Swap an edge's `source`/`target` (reverse its direction). Present only for
edges; undoable as one entry when a `<GraphHistoryProvider>` is present.

#### Returns

`void`

***

### type?

> `optional` **type?**: `string`

The element's free-form `type` tag. Present for edges (`'' ` when unset).
