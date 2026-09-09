# Function: effectiveLayoutEndpoint()

> **effectiveLayoutEndpoint**(`layer`, `id`): `string`

Resolve which node an edge endpoint attaches to for layout purposes: the
outermost collapsed group standing in for `id`, or `id` itself when visible.

This mirrors [GraphLayer.effectiveEndpoint](../classes/GraphLayer.md#effectiveendpoint) but iterates **to a
fixpoint**. `collapsedAncestor` returns the *nearest* collapsed ancestor,
which can itself sit inside a higher collapsed group (nested collapse); one
hop would leave the endpoint on a node that is itself invisible. Looping
until the answer stops changing lands on the outermost stand-in — the node
the renderer actually draws.

The loop is bounded by the number of placeable-or-not nodes seen, so a
`parentId` cycle terminates instead of spinning.

## Parameters

### layer

[`GraphLayer`](../classes/GraphLayer.md)

### id

`string`

## Returns

`string`
