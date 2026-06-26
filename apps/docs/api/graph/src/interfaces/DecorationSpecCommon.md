# Interface: DecorationSpecCommon

Defined in: [graph/src/layer/types.ts:688](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L688)

Common fields on every entry in a `decorations[]` array. The `id` gives
stable diff identity (state overlays can re-declare the same id to
override, or set `remove: true` to drop a base-level decoration while a
state is active). When `id` is absent, identity falls back to `kind + array index`.

## Properties

### id?

> `readonly` `optional` **id?**: `string`

Defined in: [graph/src/layer/types.ts:690](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L690)

Stable id for diffing. Optional — falls back to `kind#<index>` when absent.

***

### remove?

> `readonly` `optional` **remove?**: `boolean`

Defined in: [graph/src/layer/types.ts:696](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L696)

When `true`, this entry instructs the resolver to drop any earlier-
precedence decoration with the same `id`. Use it in a state overlay to
temporarily remove a base-level decoration while the state is active.
