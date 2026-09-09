# Interface: LayoutOptions

Construction options every layout shares (for the `LayoutRegistry`).

## Extended by

- [`OneShotLayoutOptions`](../../../graph/src/interfaces/OneShotLayoutOptions.md)
- [`D3SankeyLayoutOptions`](../../../graph-layout-d3-sankey/src/interfaces/D3SankeyLayoutOptions.md)

## Properties

### id?

> `optional` **id?**: `string`

Stable id, used to address the layout in a `LayoutRegistry` / config. Default `'layout'`.

***

### targetLayerId?

> `optional` **targetLayerId?**: `string`

The layer this layout is meant to run against. Informational — `apply(layer)` still takes one explicitly.
