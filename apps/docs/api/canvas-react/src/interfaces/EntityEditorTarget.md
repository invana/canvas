# Interface: EntityEditorTarget

Defined in: [canvas-react/src/hooks/useEntityEditor.ts:32](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useEntityEditor.ts#L32)

The single selected node/edge, its current label + data, and a commit action.

## Properties

### commit

> **commit**: (`values`) => `void`

Defined in: [canvas-react/src/hooks/useEntityEditor.ts:47](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useEntityEditor.ts#L47)

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

Defined in: [canvas-react/src/hooks/useEntityEditor.ts:40](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useEntityEditor.ts#L40)

Current `data` as a flat string map (non-string values are stringified).

***

### id

> **id**: `string`

Defined in: [canvas-react/src/hooks/useEntityEditor.ts:34](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useEntityEditor.ts#L34)

***

### kind

> **kind**: `"node"` \| `"edge"`

Defined in: [canvas-react/src/hooks/useEntityEditor.ts:33](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useEntityEditor.ts#L33)

***

### label

> **label**: `string`

Defined in: [canvas-react/src/hooks/useEntityEditor.ts:36](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useEntityEditor.ts#L36)

Effective (resolved) label text. Empty for edges (they have no label field).

***

### reverse?

> `optional` **reverse?**: () => `void`

Defined in: [canvas-react/src/hooks/useEntityEditor.ts:52](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useEntityEditor.ts#L52)

Swap an edge's `source`/`target` (reverse its direction). Present only for
edges; undoable as one entry when a `<GraphHistoryProvider>` is present.

#### Returns

`void`

***

### type?

> `optional` **type?**: `string`

Defined in: [canvas-react/src/hooks/useEntityEditor.ts:38](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useEntityEditor.ts#L38)

The element's free-form `type` tag. Present for edges (`'' ` when unset).
