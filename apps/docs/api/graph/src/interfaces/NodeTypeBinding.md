# Interface: NodeTypeBinding

Ties a node *type* to a structure + styling + slot→data bindings.

## Properties

### bindings

> **bindings**: `Record`\<`string`, `string`\>

Slot name → dotted data path (`'data.name'`, `'type'`).

***

### fields?

> `optional` **fields?**: `object`[]

Optional host-provided field schema for editor pickers.

#### key

> **key**: `string`

#### label

> **label**: `string`

***

### structure

> **structure**: `string`

Name of the [NodeStructureTemplate](../type-aliases/NodeStructureTemplate.md) to use.

***

### styling

> **styling**: `string`

Name of the [NodeStylingTemplate](NodeStylingTemplate.md) to use.
