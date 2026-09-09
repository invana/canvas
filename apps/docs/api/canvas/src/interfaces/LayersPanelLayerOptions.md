# Interface: LayersPanelLayerOptions

## Extended by

- [`LayersPanelLayerCtorOptions`](LayersPanelLayerCtorOptions.md)

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

> `optional` **corner?**: [`LayersPanelCorner`](../type-aliases/LayersPanelCorner.md)

Which corner to anchor the overlay. Default: 'top-right'

***

### enabled?

> `optional` **enabled?**: `boolean`

Show the overlay. Toggle at runtime via setEnabled(). Default: true

***

### fontSize?

> `optional` **fontSize?**: `number`

Font size in px. Default: 11

***

### hideIds?

> `optional` **hideIds?**: readonly `string`[]

Layer ids to hide from the list. The panel's own id is always hidden
regardless of this option.

***

### opacity?

> `optional` **opacity?**: `number`

Panel opacity 0–1. Default: 0.92

***

### textColor?

> `optional` **textColor?**: `string`

Text color. Default: '#c8d3e0'
