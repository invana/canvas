# Interface: ThemedBackgroundTheme

Defined in: [canvas/src/layers/ThemedBackgroundLayer.ts:44](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/layers/ThemedBackgroundLayer.ts#L44)

A named look bundling both a light and dark variant.

## Properties

### dark

> **dark**: [`BackgroundLayerOptions`](BackgroundLayerOptions.md)

Defined in: [canvas/src/layers/ThemedBackgroundLayer.ts:52](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/layers/ThemedBackgroundLayer.ts#L52)

Style applied when the resolved kind is `'dark'`.

***

### id

> **id**: `string`

Defined in: [canvas/src/layers/ThemedBackgroundLayer.ts:46](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/layers/ThemedBackgroundLayer.ts#L46)

Stable identifier — referenced by `setTheme(id)` and `defaultTheme`.

***

### label?

> `optional` **label?**: `string`

Defined in: [canvas/src/layers/ThemedBackgroundLayer.ts:48](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/layers/ThemedBackgroundLayer.ts#L48)

Optional human-friendly label for UIs.

***

### light

> **light**: [`BackgroundLayerOptions`](BackgroundLayerOptions.md)

Defined in: [canvas/src/layers/ThemedBackgroundLayer.ts:50](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/layers/ThemedBackgroundLayer.ts#L50)

Style applied when the resolved kind is `'light'`.
