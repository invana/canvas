# Interface: EdgeSizeLODConfig

Defined in: [graph/src/behaviours/EdgeSizeLODBehaviour.ts:50](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/EdgeSizeLODBehaviour.ts#L50)

Per-`GraphLayer` config — one entry per layer this behaviour rescales.

## Properties

### strokeWidthPx?

> `optional` **strokeWidthPx?**: `NumberOrGetter`

Defined in: [graph/src/behaviours/EdgeSizeLODBehaviour.ts:59](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/EdgeSizeLODBehaviour.ts#L59)

Target stroke width in screen px for edges that don't carry a
per-edge `data.strokeWidth` override. Falls back to the layer's
`edgeDefaults.strokeWidth`. Accepts a static number or a getter
(`() => settings.targetEdgePx`).

***

### targetLayerId

> **targetLayerId**: `string`

Defined in: [graph/src/behaviours/EdgeSizeLODBehaviour.ts:52](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/EdgeSizeLODBehaviour.ts#L52)

Required — the `GraphLayer` whose edges are rescaled.
