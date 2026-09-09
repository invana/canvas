# Interface: EdgeScaleLODConfig

Per-`GraphLayer` config — one entry per layer this behaviour rescales.

## Properties

### strokeWidthPx?

> `optional` **strokeWidthPx?**: `NumberOrGetter`

Target stroke width in screen px for edges that don't carry a
per-edge `data.strokeWidth` override. Falls back to the layer's
`edgeDefaults.strokeWidth`. Accepts a static number or a getter
(`() => settings.targetEdgePx`).

***

### targetLayerId

> **targetLayerId**: `string`

Required — the `GraphLayer` whose edges are rescaled.
