# Interface: DecorationSpecCommon

Common fields on every entry in a `decorations[]` array. The `id` gives
stable diff identity (state overlays can re-declare the same id to
override, or set `remove: true` to drop a base-level decoration while a
state is active). When `id` is absent, identity falls back to `kind + array index`.

## Properties

### id?

> `readonly` `optional` **id?**: `string`

Stable id for diffing. Optional — falls back to `kind#<index>` when absent.

***

### remove?

> `readonly` `optional` **remove?**: `boolean`

When `true`, this entry instructs the resolver to drop any earlier-
precedence decoration with the same `id`. Use it in a state overlay to
temporarily remove a base-level decoration while the state is active.
