# Interface: LayoutOptions

Defined in: [canvas/src/layouts/Layout.ts:76](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layouts/Layout.ts#L76)

Construction options every layout shares (for the `LayoutRegistry`).

## Properties

### id?

> `optional` **id?**: `string`

Defined in: [canvas/src/layouts/Layout.ts:78](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layouts/Layout.ts#L78)

Stable id, used to address the layout in a `LayoutRegistry` / config. Default `'layout'`.

***

### targetLayerId?

> `optional` **targetLayerId?**: `string`

Defined in: [canvas/src/layouts/Layout.ts:80](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layouts/Layout.ts#L80)

The layer this layout is meant to run against. Informational — `apply(layer)` still takes one explicitly.
