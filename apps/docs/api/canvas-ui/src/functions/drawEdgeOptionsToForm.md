# Function: drawEdgeOptionsToForm()

> **drawEdgeOptionsToForm**(`o?`): [`DrawEdgeFields`](../interfaces/DrawEdgeFields.md)

Map a `DrawEdgeBehaviourOptions`-shaped patch to the flat [DrawEdgeFields](../interfaces/DrawEdgeFields.md)
the `@invana/forms` generator renders. The nested `draftStyle` group is
flattened to `draft`-prefixed scalars; the `0xRRGGBB` number colour becomes a
`#rrggbb` hex string, and the `[dash, gap]` tuple splits into two numbers.

## Parameters

### o?

[`DrawEdgeOptions`](../interfaces/DrawEdgeOptions.md) = `{}`

## Returns

[`DrawEdgeFields`](../interfaces/DrawEdgeFields.md)
