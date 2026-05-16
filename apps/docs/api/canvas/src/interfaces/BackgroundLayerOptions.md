# Interface: BackgroundLayerOptions

Defined in: [canvas/src/layers/BackgroundLayer.ts:58](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/BackgroundLayer.ts#L58)

Construction-time options for `BackgroundLayer`.

## Properties

### alpha?

> `optional` **alpha?**: `number`

Defined in: [canvas/src/layers/BackgroundLayer.ts:75](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/BackgroundLayer.ts#L75)

Pattern alpha 0–1. Default `0.6`.

***

### backgroundColor?

> `optional` **backgroundColor?**: `BackgroundColor`

Defined in: [canvas/src/layers/BackgroundLayer.ts:69](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/BackgroundLayer.ts#L69)

Solid-fill colour painted behind the pattern. Same accepted forms as `color`.

***

### color?

> `optional` **color?**: `BackgroundColor`

Defined in: [canvas/src/layers/BackgroundLayer.ts:67](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/BackgroundLayer.ts#L67)

Pattern foreground colour (dot / line / grid colour). Accepts `0xRRGGBB`,
a CSS string, or a `{ light, dark }` pair resolved against `mode`.

***

### followCamera?

> `optional` **followCamera?**: `boolean`

Defined in: [canvas/src/layers/BackgroundLayer.ts:80](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/BackgroundLayer.ts#L80)

`true` (default): pattern shifts + scales with the camera. `false`: pattern
stays fixed to the screen regardless of camera state.

***

### mode?

> `optional` **mode?**: `BackgroundMode`

Defined in: [canvas/src/layers/BackgroundLayer.ts:86](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/BackgroundLayer.ts#L86)

How `{ light, dark }` colour variants are resolved. `'auto'` (default)
follows `prefers-color-scheme`; `'light'` / `'dark'` pin explicitly. Has
no effect when both colours are plain scalars.

***

### patternType?

> `optional` **patternType?**: [`BackgroundPatternType`](../type-aliases/BackgroundPatternType.md)

Defined in: [canvas/src/layers/BackgroundLayer.ts:62](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/BackgroundLayer.ts#L62)

Tile texture kind when `type === 'pattern'`. Default `'dots'`.

***

### size?

> `optional` **size?**: `number`

Defined in: [canvas/src/layers/BackgroundLayer.ts:71](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/BackgroundLayer.ts#L71)

Dot radius / line thickness, in *texture pixels*. Default `1.5`.

***

### spacing?

> `optional` **spacing?**: `number`

Defined in: [canvas/src/layers/BackgroundLayer.ts:73](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/BackgroundLayer.ts#L73)

Tile cell spacing, in *texture pixels*. Default `30`.

***

### type?

> `optional` **type?**: [`BackgroundType`](../type-aliases/BackgroundType.md)

Defined in: [canvas/src/layers/BackgroundLayer.ts:60](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/BackgroundLayer.ts#L60)

`'solid'` paints a flat fill; `'pattern'` overlays a tiled texture. Default `'solid'`.
