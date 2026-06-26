# Interface: BackgroundLayerOptions

Defined in: [canvas/src/layers/BackgroundLayer.ts:61](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/BackgroundLayer.ts#L61)

Construction-time options for `BackgroundLayer`.

## Properties

### alpha?

> `optional` **alpha?**: `number`

Defined in: [canvas/src/layers/BackgroundLayer.ts:78](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/BackgroundLayer.ts#L78)

Pattern alpha 0–1. Default `0.6`.

***

### backgroundColor?

> `optional` **backgroundColor?**: [`BackgroundColor`](../type-aliases/BackgroundColor.md)

Defined in: [canvas/src/layers/BackgroundLayer.ts:72](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/BackgroundLayer.ts#L72)

Solid-fill colour painted behind the pattern. Same accepted forms as `color`.

***

### color?

> `optional` **color?**: [`BackgroundColor`](../type-aliases/BackgroundColor.md)

Defined in: [canvas/src/layers/BackgroundLayer.ts:70](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/BackgroundLayer.ts#L70)

Pattern foreground colour (dot / line / grid colour). Accepts `0xRRGGBB`,
a CSS string, or a `{ light, dark }` pair resolved against `mode`.

***

### followCamera?

> `optional` **followCamera?**: `boolean`

Defined in: [canvas/src/layers/BackgroundLayer.ts:83](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/BackgroundLayer.ts#L83)

`true` (default): pattern shifts + scales with the camera. `false`: pattern
stays fixed to the screen regardless of camera state.

***

### mode?

> `optional` **mode?**: [`BackgroundMode`](../type-aliases/BackgroundMode.md)

Defined in: [canvas/src/layers/BackgroundLayer.ts:89](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/BackgroundLayer.ts#L89)

How `{ light, dark }` colour variants are resolved. `'auto'` (default)
follows the active theme on `ctx.theme`; `'light'` / `'dark'` pin
explicitly. Has no effect when both colours are plain scalars.

***

### patternRole?

> `optional` **patternRole?**: `string`

Defined in: [canvas/src/layers/BackgroundLayer.ts:101](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/BackgroundLayer.ts#L101)

Palette role read for the pattern (dots / grid / lines) colour on
`'theme:change'`. Falls back to `'stroke'` when the role is absent but
`'stroke'` is present; otherwise [color](#color) stands. Default `'divider'`.

***

### patternType?

> `optional` **patternType?**: [`BackgroundPatternType`](../type-aliases/BackgroundPatternType.md)

Defined in: [canvas/src/layers/BackgroundLayer.ts:65](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/BackgroundLayer.ts#L65)

Tile texture kind when `type === 'pattern'`. Default `'dots'`.

***

### size?

> `optional` **size?**: `number`

Defined in: [canvas/src/layers/BackgroundLayer.ts:74](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/BackgroundLayer.ts#L74)

Dot radius / line thickness, in *texture pixels*. Default `1`.

***

### spacing?

> `optional` **spacing?**: `number`

Defined in: [canvas/src/layers/BackgroundLayer.ts:76](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/BackgroundLayer.ts#L76)

Tile cell spacing, in *texture pixels*. Default `12`.

***

### surfaceRole?

> `optional` **surfaceRole?**: `string`

Defined in: [canvas/src/layers/BackgroundLayer.ts:95](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/BackgroundLayer.ts#L95)

Palette role read for the solid backdrop colour on `'theme:change'`. When
the published theme's palette carries this role, it overrides
[backgroundColor](#backgroundcolor); otherwise the option stands. Default `'surface'`.

***

### type?

> `optional` **type?**: [`BackgroundType`](../type-aliases/BackgroundType.md)

Defined in: [canvas/src/layers/BackgroundLayer.ts:63](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/BackgroundLayer.ts#L63)

`'solid'` paints a flat fill; `'pattern'` overlays a tiled texture. Default `'solid'`.
