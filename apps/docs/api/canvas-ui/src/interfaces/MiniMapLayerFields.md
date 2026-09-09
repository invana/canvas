# Interface: MiniMapLayerFields

Flat form-field shape the `@invana/forms` generator renders. Identical to
[MiniMapLayerOptions](MiniMapLayerOptions.md) except the chrome / mask colours are `#rrggbb`
strings (what the colour swatch emits); `mapping.ts` bridges them to/from the
engine's `0xRRGGBB` numbers.

## Extends

- `Omit`\<[`MiniMapLayerOptions`](MiniMapLayerOptions.md), `"backgroundColor"` \| `"borderColor"` \| `"viewportFill"` \| `"viewportStroke"` \| `"maskColor"`\>

## Properties

### backgroundColor?

> `optional` **backgroundColor?**: `string`

Background fill as `#rrggbb`.

***

### borderColor?

> `optional` **borderColor?**: `string`

Border colour as `#rrggbb`.

***

### borderWidth?

> `optional` **borderWidth?**: `number`

Border stroke width. Default `1`.

#### Inherited from

[`MiniMapLayerOptions`](MiniMapLayerOptions.md).[`borderWidth`](MiniMapLayerOptions.md#borderwidth)

***

### enableDrag?

> `optional` **enableDrag?**: `boolean`

Whether dragging the minimap pans the main camera. Default `true`.

#### Inherited from

[`MiniMapLayerOptions`](MiniMapLayerOptions.md).[`enableDrag`](MiniMapLayerOptions.md#enabledrag)

***

### height?

> `optional` **height?**: `number`

Minimap height in screen px. Default `150`.

#### Inherited from

[`MiniMapLayerOptions`](MiniMapLayerOptions.md).[`height`](MiniMapLayerOptions.md#height)

***

### margin?

> `optional` **margin?**: `number`

Symmetric inset from the chosen corner, in screen px. Default `10`.

#### Inherited from

[`MiniMapLayerOptions`](MiniMapLayerOptions.md).[`margin`](MiniMapLayerOptions.md#margin)

***

### maskAlpha?

> `optional` **maskAlpha?**: `number`

Out-of-viewport mask alpha 0–1. Default `0.5`.

#### Inherited from

[`MiniMapLayerOptions`](MiniMapLayerOptions.md).[`maskAlpha`](MiniMapLayerOptions.md#maskalpha)

***

### maskColor?

> `optional` **maskColor?**: `string`

Out-of-viewport mask overlay colour as `#rrggbb`.

***

### maskEnabled?

> `optional` **maskEnabled?**: `boolean`

Dim everything *outside* the viewport rectangle with a translucent overlay,
 spotlighting the visible region. Default `true`.

#### Inherited from

[`MiniMapLayerOptions`](MiniMapLayerOptions.md).[`maskEnabled`](MiniMapLayerOptions.md#maskenabled)

***

### mode?

> `optional` **mode?**: `MiniMapMode`

How `{ light, dark }` colour variants resolve. Default `'auto'`.

#### Inherited from

[`MiniMapLayerOptions`](MiniMapLayerOptions.md).[`mode`](MiniMapLayerOptions.md#mode)

***

### padding?

> `optional` **padding?**: `number`

World-space padding around node bounds. Default `20`.

#### Inherited from

[`MiniMapLayerOptions`](MiniMapLayerOptions.md).[`padding`](MiniMapLayerOptions.md#padding)

***

### position?

> `optional` **position?**: `MiniMapPosition`

Anchor corner. Default `'bottom-right'`.

#### Inherited from

[`MiniMapLayerOptions`](MiniMapLayerOptions.md).[`position`](MiniMapLayerOptions.md#position)

***

### viewportFill?

> `optional` **viewportFill?**: `string`

Viewport indicator fill as `#rrggbb`.

***

### viewportFillAlpha?

> `optional` **viewportFillAlpha?**: `number`

Viewport indicator fill alpha 0–1. Default `0.3`.

#### Inherited from

[`MiniMapLayerOptions`](MiniMapLayerOptions.md).[`viewportFillAlpha`](MiniMapLayerOptions.md#viewportfillalpha)

***

### viewportStroke?

> `optional` **viewportStroke?**: `string`

Viewport indicator stroke as `#rrggbb`.

***

### viewportStrokeWidth?

> `optional` **viewportStrokeWidth?**: `number`

Viewport indicator stroke width. Default `2`.

#### Inherited from

[`MiniMapLayerOptions`](MiniMapLayerOptions.md).[`viewportStrokeWidth`](MiniMapLayerOptions.md#viewportstrokewidth)

***

### width?

> `optional` **width?**: `number`

Minimap width in screen px. Default `200`.

#### Inherited from

[`MiniMapLayerOptions`](MiniMapLayerOptions.md).[`width`](MiniMapLayerOptions.md#width)
