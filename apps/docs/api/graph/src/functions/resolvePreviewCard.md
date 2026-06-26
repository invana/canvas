# Function: resolvePreviewCard()

> **resolvePreviewCard**(`spec`, `subject`, `id`, `kind`, `type`): [`ResolvedPreviewCard`](../interfaces/ResolvedPreviewCard.md)

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:382](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L382)

Resolve a [HoverElementPreviewCardSpec](../interfaces/HoverElementPreviewCardSpec.md) against a hovered element into a
flat, render-ready [ResolvedPreviewCard](../interfaces/ResolvedPreviewCard.md). Pure — exported so the React
`HoverElementPreviewCard` (and tests) reuse the exact same field logic the
behaviour emits.

The element's `id` and (when present) `type` are **prepended automatically**
as the first rows — the consumer never adds them to `spec.rows`.

## Parameters

### spec

[`HoverElementPreviewCardSpec`](../interfaces/HoverElementPreviewCardSpec.md)

The serializable card template.

### subject

`unknown`

The store node / edge record to resolve field paths against.

### id

`string`

Element id — auto-added as the first `id` row.

### kind

[`GraphElementKind`](../type-aliases/GraphElementKind.md)

`'node'` | `'edge'`.

### type

`string`

Element `type` tag — auto-added as the `type` row when present.

## Returns

[`ResolvedPreviewCard`](../interfaces/ResolvedPreviewCard.md)
