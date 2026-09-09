# Interface: DevInfoLayerCtorOptions

## Extends

- [`DevInfoLayerOptions`](DevInfoLayerOptions.md)

## Properties

### accentColor?

> `optional` **accentColor?**: `string`

Accent / header color. Default: '#4fc3f7'

#### Inherited from

[`DevInfoLayerOptions`](DevInfoLayerOptions.md).[`accentColor`](DevInfoLayerOptions.md#accentcolor)

***

### backgroundColor?

> `optional` **backgroundColor?**: `string`

Overlay background CSS color. Default: 'rgba(10,10,10,0.82)'

#### Inherited from

[`DevInfoLayerOptions`](DevInfoLayerOptions.md).[`backgroundColor`](DevInfoLayerOptions.md#backgroundcolor)

***

### corner?

> `optional` **corner?**: [`DevInfoCorner`](../type-aliases/DevInfoCorner.md)

Which corner to anchor the overlay. Default: 'bottom-left'

#### Inherited from

[`DevInfoLayerOptions`](DevInfoLayerOptions.md).[`corner`](DevInfoLayerOptions.md#corner)

***

### enabled?

> `optional` **enabled?**: `boolean`

Show the overlay. Can be toggled at runtime via setEnabled(). Default: true

#### Inherited from

[`DevInfoLayerOptions`](DevInfoLayerOptions.md).[`enabled`](DevInfoLayerOptions.md#enabled)

***

### fontSize?

> `optional` **fontSize?**: `number`

Font size in px. Default: 11

#### Inherited from

[`DevInfoLayerOptions`](DevInfoLayerOptions.md).[`fontSize`](DevInfoLayerOptions.md#fontsize)

***

### id?

> `optional` **id?**: `string`

Layer id. Default: 'dev-info'.

***

### margin?

> `optional` **margin?**: `number` \| \{ `x?`: `number`; `y?`: `number`; \}

Inset from the chosen `corner`, in screen pixels. A single number applies to
both axes; `{ x, y }` sets them independently (e.g. bump `y` to clear a top
header bar). Default: 10.

#### Inherited from

[`DevInfoLayerOptions`](DevInfoLayerOptions.md).[`margin`](DevInfoLayerOptions.md#margin)

***

### opacity?

> `optional` **opacity?**: `number`

Panel opacity 0–1. Default: 0.92

#### Inherited from

[`DevInfoLayerOptions`](DevInfoLayerOptions.md).[`opacity`](DevInfoLayerOptions.md#opacity)

***

### textColor?

> `optional` **textColor?**: `string`

Text color. Default: '#c8d3e0'

#### Inherited from

[`DevInfoLayerOptions`](DevInfoLayerOptions.md).[`textColor`](DevInfoLayerOptions.md#textcolor)

***

### zIndex?

> `optional` **zIndex?**: `number`

Pixi z-index inside the screen stage. Default: 9999 (top).
