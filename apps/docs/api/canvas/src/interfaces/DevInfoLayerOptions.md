# Interface: DevInfoLayerOptions

## Extended by

- [`DevInfoLayerCtorOptions`](DevInfoLayerCtorOptions.md)

## Properties

### accentColor?

> `optional` **accentColor?**: `string`

Accent / header color. Default: '#4fc3f7'

***

### backgroundColor?

> `optional` **backgroundColor?**: `string`

Overlay background CSS color. Default: 'rgba(10,10,10,0.82)'

***

### corner?

> `optional` **corner?**: [`DevInfoCorner`](../type-aliases/DevInfoCorner.md)

Which corner to anchor the overlay. Default: 'bottom-left'

***

### enabled?

> `optional` **enabled?**: `boolean`

Show the overlay. Can be toggled at runtime via setEnabled(). Default: true

***

### fontSize?

> `optional` **fontSize?**: `number`

Font size in px. Default: 11

***

### margin?

> `optional` **margin?**: `number` \| \{ `x?`: `number`; `y?`: `number`; \}

Inset from the chosen `corner`, in screen pixels. A single number applies to
both axes; `{ x, y }` sets them independently (e.g. bump `y` to clear a top
header bar). Default: 10.

***

### opacity?

> `optional` **opacity?**: `number`

Panel opacity 0–1. Default: 0.92

***

### textColor?

> `optional` **textColor?**: `string`

Text color. Default: '#c8d3e0'
