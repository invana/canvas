# Interface: NodeSizeLODConfig

Defined in: [graph/src/behaviours/NodeSizeLODBehaviour.ts:75](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/behaviours/NodeSizeLODBehaviour.ts#L75)

Per-`GraphLayer` config — one entry per layer this behaviour rescales.

## Properties

### layerId

> **layerId**: `string`

Defined in: [graph/src/behaviours/NodeSizeLODBehaviour.ts:77](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/behaviours/NodeSizeLODBehaviour.ts#L77)

Required — the `GraphLayer` whose nodes are rescaled.

***

### sizePx?

> `optional` **sizePx?**: [`NumberOrGetter`](../../../canvas/src/type-aliases/NumberOrGetter.md)

Defined in: [graph/src/behaviours/NodeSizeLODBehaviour.ts:84](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/behaviours/NodeSizeLODBehaviour.ts#L84)

Target body size in screen px for nodes that don't carry a per-node
`data.size` override. Falls back to the layer's `nodeDefaults.size`
when omitted. Accepts a static number or a getter — getters re-read
on every reflow so GUI sliders update live.

***

### strokeWidthPx?

> `optional` **strokeWidthPx?**: [`NumberOrGetter`](../../../canvas/src/type-aliases/NumberOrGetter.md)

Defined in: [graph/src/behaviours/NodeSizeLODBehaviour.ts:93](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/behaviours/NodeSizeLODBehaviour.ts#L93)

Target outline width in screen px. When omitted, the layer's
`nodeDefaults.strokeWidth` (or each node's `data.strokeWidth`) is
reinterpreted as the implicit pixel target — the transform-scale
fast path always pins both body and stroke together, so the stroke
is pixel-constant even without an explicit value here. Setting an
explicit value just changes what that pixel target is.
