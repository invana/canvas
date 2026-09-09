# Interface: ContextMenuOptions

The serialisable subset of `ContextMenuBehaviourOptions` this editor produces.
The `onContextMenu` **callback** and the base
`targetLayerId` / `enabled` / `shortcuts` are out of scope. `targets` (the
allowed target kinds) and `state` (a transient state name) round-trip;
`targets` is stored structurally as its array here but flattened to three
booleans in the form — see [ContextMenuFields](ContextMenuFields.md).

## Properties

### state?

> `optional` **state?**: `string`

Transient state name applied to the right-clicked node/edge, or `null` to disable.

***

### targets?

> `optional` **targets?**: `ContextMenuTargetType`[]
