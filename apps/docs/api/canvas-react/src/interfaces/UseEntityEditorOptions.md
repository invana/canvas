# Interface: UseEntityEditorOptions

## Properties

### inspectId?

> `optional` **inspectId?**: `string`

Id of the `ClickInspectBehaviour` the edit target is read from. Default `'click-inspect'`.

***

### layerId?

> `optional` **layerId?**: `string`

GraphLayer to read/write. Default `'graph'`.

***

### typeAsLabel?

> `optional` **typeAsLabel?**: `boolean`

Modeller mode: edit a single `type` field on **both** nodes and edges whose
value also drives the displayed label (mirrored to `style.labelText`) — in a
modeller the type *is* what's drawn on the element. Off by default, in which
case nodes edit their `label` (`style.labelText`) and edges edit their `type`,
each as a separate field.
