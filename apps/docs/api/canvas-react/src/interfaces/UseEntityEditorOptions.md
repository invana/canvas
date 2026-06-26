# Interface: UseEntityEditorOptions

Defined in: [canvas-react/src/hooks/useEntityEditor.ts:16](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useEntityEditor.ts#L16)

## Properties

### inspectId?

> `optional` **inspectId?**: `string`

Defined in: [canvas-react/src/hooks/useEntityEditor.ts:20](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useEntityEditor.ts#L20)

Id of the `ClickInspectBehaviour` the edit target is read from. Default `'click-inspect'`.

***

### layerId?

> `optional` **layerId?**: `string`

Defined in: [canvas-react/src/hooks/useEntityEditor.ts:18](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useEntityEditor.ts#L18)

GraphLayer to read/write. Default `'graph'`.

***

### typeAsLabel?

> `optional` **typeAsLabel?**: `boolean`

Defined in: [canvas-react/src/hooks/useEntityEditor.ts:28](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useEntityEditor.ts#L28)

Modeller mode: edit a single `type` field on **both** nodes and edges whose
value also drives the displayed label (mirrored to `style.labelText`) — in a
modeller the type *is* what's drawn on the element. Off by default, in which
case nodes edit their `label` (`style.labelText`) and edges edit their `type`,
each as a separate field.
