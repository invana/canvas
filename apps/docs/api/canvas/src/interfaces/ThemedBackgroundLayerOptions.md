# Interface: ThemedBackgroundLayerOptions

Defined in: [canvas/src/layers/ThemedBackgroundLayer.ts:56](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/ThemedBackgroundLayer.ts#L56)

Construction-time options for `ThemedBackgroundLayer`.

## Properties

### defaultTheme?

> `optional` **defaultTheme?**: `string`

Defined in: [canvas/src/layers/ThemedBackgroundLayer.ts:60](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/ThemedBackgroundLayer.ts#L60)

Id of the theme to start with. Defaults to `themes[0].id`.

***

### mode?

> `optional` **mode?**: [`ThemedBackgroundMode`](../type-aliases/ThemedBackgroundMode.md)

Defined in: [canvas/src/layers/ThemedBackgroundLayer.ts:62](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/ThemedBackgroundLayer.ts#L62)

Initial mode. Defaults to `'auto'`.

***

### themes

> **themes**: [`ThemedBackgroundTheme`](ThemedBackgroundTheme.md)[]

Defined in: [canvas/src/layers/ThemedBackgroundLayer.ts:58](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/layers/ThemedBackgroundLayer.ts#L58)

Named themes. Must contain at least one entry.
