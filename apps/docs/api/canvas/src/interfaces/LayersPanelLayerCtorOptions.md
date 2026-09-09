# Interface: LayersPanelLayerCtorOptions

## Extends

- [`LayersPanelLayerOptions`](LayersPanelLayerOptions.md)

## Properties

### accentColor?

> `optional` **accentColor?**: `string`

Accent / header color. Default: '#4fc3f7'

#### Inherited from

[`LayersPanelLayerOptions`](LayersPanelLayerOptions.md).[`accentColor`](LayersPanelLayerOptions.md#accentcolor)

***

### backgroundColor?

> `optional` **backgroundColor?**: `string`

Overlay background CSS color. Default: 'rgba(10,10,10,0.82)'

#### Inherited from

[`LayersPanelLayerOptions`](LayersPanelLayerOptions.md).[`backgroundColor`](LayersPanelLayerOptions.md#backgroundcolor)

***

### corner?

> `optional` **corner?**: [`LayersPanelCorner`](../type-aliases/LayersPanelCorner.md)

Which corner to anchor the overlay. Default: 'top-right'

#### Inherited from

[`LayersPanelLayerOptions`](LayersPanelLayerOptions.md).[`corner`](LayersPanelLayerOptions.md#corner)

***

### enabled?

> `optional` **enabled?**: `boolean`

Show the overlay. Toggle at runtime via setEnabled(). Default: true

#### Inherited from

[`LayersPanelLayerOptions`](LayersPanelLayerOptions.md).[`enabled`](LayersPanelLayerOptions.md#enabled)

***

### fontSize?

> `optional` **fontSize?**: `number`

Font size in px. Default: 11

#### Inherited from

[`LayersPanelLayerOptions`](LayersPanelLayerOptions.md).[`fontSize`](LayersPanelLayerOptions.md#fontsize)

***

### hideIds?

> `optional` **hideIds?**: readonly `string`[]

Layer ids to hide from the list. The panel's own id is always hidden
regardless of this option.

#### Inherited from

[`LayersPanelLayerOptions`](LayersPanelLayerOptions.md).[`hideIds`](LayersPanelLayerOptions.md#hideids)

***

### id?

> `optional` **id?**: `string`

Layer id. Default: 'layers-panel'.

***

### opacity?

> `optional` **opacity?**: `number`

Panel opacity 0–1. Default: 0.92

#### Inherited from

[`LayersPanelLayerOptions`](LayersPanelLayerOptions.md).[`opacity`](LayersPanelLayerOptions.md#opacity)

***

### textColor?

> `optional` **textColor?**: `string`

Text color. Default: '#c8d3e0'

#### Inherited from

[`LayersPanelLayerOptions`](LayersPanelLayerOptions.md).[`textColor`](LayersPanelLayerOptions.md#textcolor)

***

### zIndex?

> `optional` **zIndex?**: `number`

Pixi z-index inside the screen stage. Default: 9998 (just below DevInfoLayer).
