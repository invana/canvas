# Interface: NodeTypeBinding

Defined in: graph/src/template/types.ts:124

Ties a node *type* to a structure + styling + slot→data bindings.

## Properties

### bindings

> **bindings**: `Record`\<`string`, `string`\>

Defined in: graph/src/template/types.ts:130

Slot name → dotted data path (`'data.name'`, `'type'`).

***

### fields?

> `optional` **fields?**: `object`[]

Defined in: graph/src/template/types.ts:132

Optional host-provided field schema for editor pickers.

#### key

> **key**: `string`

#### label

> **label**: `string`

***

### structure

> **structure**: `string`

Defined in: graph/src/template/types.ts:126

Name of the [NodeStructureTemplate](../type-aliases/NodeStructureTemplate.md) to use.

***

### styling

> **styling**: `string`

Defined in: graph/src/template/types.ts:128

Name of the [NodeStylingTemplate](NodeStylingTemplate.md) to use.
