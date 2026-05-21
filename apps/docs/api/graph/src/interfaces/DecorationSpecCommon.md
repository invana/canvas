# Interface: DecorationSpecCommon

Defined in: [graph/src/layer/types.ts:658](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L658)

Common fields on every entry in a `decorations[]` array. The `id` gives
stable diff identity (state overlays can re-declare the same id to
override, or set `remove: true` to drop a base-level decoration while a
state is active). When `id` is absent, identity falls back to `kind + array index`.

## Properties

### id?

> `readonly` `optional` **id?**: `string`

Defined in: [graph/src/layer/types.ts:660](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L660)

Stable id for diffing. Optional — falls back to `kind#<index>` when absent.

***

### remove?

> `readonly` `optional` **remove?**: `boolean`

Defined in: [graph/src/layer/types.ts:666](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L666)

When `true`, this entry instructs the resolver to drop any earlier-
precedence decoration with the same `id`. Use it in a state overlay to
temporarily remove a base-level decoration while the state is active.
