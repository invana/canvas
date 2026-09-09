# Interface: BackgroundLayerOptions

Construction-time options for `BackgroundLayer`.

## Properties

### alpha?

> `optional` **alpha?**: `number`

Pattern alpha 0–1. Default `0.6`.

***

### backgroundColor?

> `optional` **backgroundColor?**: [`BackgroundColor`](../type-aliases/BackgroundColor.md)

Solid-fill colour painted behind the pattern. Same accepted forms as `color`.

***

### color?

> `optional` **color?**: [`BackgroundColor`](../type-aliases/BackgroundColor.md)

Pattern foreground colour (dot / line / grid colour). Accepts `0xRRGGBB`,
a CSS string, or a `{ light, dark }` pair resolved against `mode`.

***

### followCamera?

> `optional` **followCamera?**: `boolean`

`true` (default): pattern shifts + scales with the camera. `false`: pattern
stays fixed to the screen regardless of camera state.

***

### hidePatternBelowZoom?

> `optional` **hidePatternBelowZoom?**: `number`

Hide the tiled pattern once the camera scale drops below this value — zoomed
far out the tiles collapse into visual noise, so the backdrop reads better
on its own. Set `0` to disable the cutoff and always show the pattern.

Only affects `type: 'pattern'`; the solid backdrop always paints. Applies to
*any* camera change (wheel / pinch / keyboard / programmatic), since it's
evaluated from the cached camera scale rather than in a zoom behaviour.

Default `0.5` (hidden below 50% zoom).

***

### mode?

> `optional` **mode?**: [`BackgroundMode`](../type-aliases/BackgroundMode.md)

How `{ light, dark }` colour variants are resolved. `'auto'` (default)
follows the active theme on `ctx.theme`; `'light'` / `'dark'` pin
explicitly. Has no effect when both colours are plain scalars.

***

### patternRole?

> `optional` **patternRole?**: `string`

Palette role read for the pattern (dots / grid / lines) colour on
`'theme:change'`. Falls back to `'stroke'` when the role is absent but
`'stroke'` is present; otherwise [color](#color) stands. Default `'divider'`.

***

### patternType?

> `optional` **patternType?**: [`BackgroundPatternType`](../type-aliases/BackgroundPatternType.md)

Tile texture kind when `type === 'pattern'`. Default `'dots'`.

***

### size?

> `optional` **size?**: `number`

Dot radius / line thickness, in *texture pixels*. Default `1`.

***

### spacing?

> `optional` **spacing?**: `number`

Tile cell spacing, in *texture pixels*. Default `12`.

***

### surfaceRole?

> `optional` **surfaceRole?**: `string`

Palette role read for the solid backdrop colour on `'theme:change'`. When
the published theme's palette carries this role, it overrides
[backgroundColor](#backgroundcolor); otherwise the option stands. Default `'surface'`.

***

### type?

> `optional` **type?**: [`BackgroundType`](../type-aliases/BackgroundType.md)

`'solid'` paints a flat fill; `'pattern'` overlays a tiled texture. Default `'solid'`.
