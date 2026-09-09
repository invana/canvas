# Interface: LabelCollisionOptions

The subset of `LabelCollisionBehaviourOptions` this editor produces — a
serialisable patch. The `prioritise` callback form and the base
`id` / `targetLayerId` / `enabled` / `shortcuts` fields are out of scope. The
engine's nested `groups: { nodes?, edges? }` is flattened to
`groupNodes` / `groupEdges` for the form and re-nested on the way out
(see `mapping.ts`).

## Properties

### flickerGuardMs?

> `optional` **flickerGuardMs?**: `number`

Minimum ms a just-flipped label holds before it can flip back. Default `100`.

***

### groups?

> `optional` **groups?**: `object`

Collision group name assigned to node labels. Default `'nodes'`.

#### edges?

> `optional` **edges?**: `string`

#### nodes?

> `optional` **nodes?**: `string`

***

### prioritise?

> `optional` **prioritise?**: `LabelPriorityMode`

How priority is resolved when sorting. Default `'priority-field'`.

***

### strategy?

> `optional` **strategy?**: `"hide"`

Overlap resolution strategy. Default `'hide'`.
