# Interface: EdgeSizeLODConfig

Defined in: [graph/src/behaviours/EdgeSizeLODBehaviour.ts:50](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/behaviours/EdgeSizeLODBehaviour.ts#L50)

Per-`GraphLayer` config — one entry per layer this behaviour rescales.

## Properties

### layerId

> **layerId**: `string`

Defined in: [graph/src/behaviours/EdgeSizeLODBehaviour.ts:52](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/behaviours/EdgeSizeLODBehaviour.ts#L52)

Required — the `GraphLayer` whose edges are rescaled.

***

### strokeWidthPx?

> `optional` **strokeWidthPx?**: [`NumberOrGetter`](../../../canvas/src/type-aliases/NumberOrGetter.md)

Defined in: [graph/src/behaviours/EdgeSizeLODBehaviour.ts:59](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/behaviours/EdgeSizeLODBehaviour.ts#L59)

Target stroke width in screen px for edges that don't carry a
per-edge `data.strokeWidth` override. Falls back to the layer's
`edgeDefaults.strokeWidth`. Accepts a static number or a getter
(`() => settings.targetEdgePx`).
