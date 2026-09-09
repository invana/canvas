# Interface: LayoutOptions

Construction options every layout shares (for the `LayoutRegistry`).

## Properties

### id?

> `optional` **id?**: `string`

Stable id, used to address the layout in a `LayoutRegistry` / config. Default `'layout'`.

***

### targetLayerId?

> `optional` **targetLayerId?**: `string`

The layer this layout is meant to run against. Informational — `apply(layer)` still takes one explicitly.
