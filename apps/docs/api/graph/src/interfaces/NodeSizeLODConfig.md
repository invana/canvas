# Interface: NodeSizeLODConfig

Defined in: [graph/src/behaviours/NodeSizeLODBehaviour.ts:74](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/NodeSizeLODBehaviour.ts#L74)

Per-`GraphLayer` config — one entry per layer this behaviour rescales.

## Properties

### sizePx?

> `optional` **sizePx?**: `NumberOrGetter`

Defined in: [graph/src/behaviours/NodeSizeLODBehaviour.ts:83](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/NodeSizeLODBehaviour.ts#L83)

Target body size in screen px for nodes that don't carry a per-node
`data.size` override. Falls back to the layer's `nodeDefaults.size`
when omitted. Accepts a static number or a getter — getters re-read
on every reflow so GUI sliders update live.

***

### strokeWidthPx?

> `optional` **strokeWidthPx?**: `NumberOrGetter`

Defined in: [graph/src/behaviours/NodeSizeLODBehaviour.ts:92](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/NodeSizeLODBehaviour.ts#L92)

Target outline width in screen px. When omitted, the layer's
`nodeDefaults.strokeWidth` (or each node's `data.strokeWidth`) is
reinterpreted as the implicit pixel target — the transform-scale
fast path always pins both body and stroke together, so the stroke
is pixel-constant even without an explicit value here. Setting an
explicit value just changes what that pixel target is.

***

### targetLayerId

> **targetLayerId**: `string`

Defined in: [graph/src/behaviours/NodeSizeLODBehaviour.ts:76](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/NodeSizeLODBehaviour.ts#L76)

Required — the `GraphLayer` whose nodes are rescaled.
