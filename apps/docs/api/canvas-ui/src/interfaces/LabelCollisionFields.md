# Interface: LabelCollisionFields

Flat form-field shape the `@invana/forms` generator renders. The engine's
nested `groups` object is split into two flat text fields (`groupNodes` /
`groupEdges`) — a single field can't edit a nested object (see `mapping.ts`).

## Properties

### flickerGuardMs?

> `optional` **flickerGuardMs?**: `number`

***

### groupEdges?

> `optional` **groupEdges?**: `string`

Flattened `groups.edges`.

***

### groupNodes?

> `optional` **groupNodes?**: `string`

Flattened `groups.nodes`.

***

### prioritise?

> `optional` **prioritise?**: `LabelPriorityMode`

***

### strategy?

> `optional` **strategy?**: `"hide"`
