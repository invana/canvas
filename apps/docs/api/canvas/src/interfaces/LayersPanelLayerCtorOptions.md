# Interface: LayersPanelLayerCtorOptions

Defined in: [canvas/src/layers/LayersPanelLayer.ts:58](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/LayersPanelLayer.ts#L58)

## Extends

- [`LayersPanelLayerOptions`](LayersPanelLayerOptions.md)

## Properties

### accentColor?

> `optional` **accentColor?**: `string`

Defined in: [canvas/src/layers/LayersPanelLayer.ts:50](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/LayersPanelLayer.ts#L50)

Accent / header color. Default: '#4fc3f7'

#### Inherited from

[`LayersPanelLayerOptions`](LayersPanelLayerOptions.md).[`accentColor`](LayersPanelLayerOptions.md#accentcolor)

***

### backgroundColor?

> `optional` **backgroundColor?**: `string`

Defined in: [canvas/src/layers/LayersPanelLayer.ts:46](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/LayersPanelLayer.ts#L46)

Overlay background CSS color. Default: 'rgba(10,10,10,0.82)'

#### Inherited from

[`LayersPanelLayerOptions`](LayersPanelLayerOptions.md).[`backgroundColor`](LayersPanelLayerOptions.md#backgroundcolor)

***

### corner?

> `optional` **corner?**: [`LayersPanelCorner`](../type-aliases/LayersPanelCorner.md)

Defined in: [canvas/src/layers/LayersPanelLayer.ts:38](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/LayersPanelLayer.ts#L38)

Which corner to anchor the overlay. Default: 'top-right'

#### Inherited from

[`LayersPanelLayerOptions`](LayersPanelLayerOptions.md).[`corner`](LayersPanelLayerOptions.md#corner)

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [canvas/src/layers/LayersPanelLayer.ts:40](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/LayersPanelLayer.ts#L40)

Show the overlay. Toggle at runtime via setEnabled(). Default: true

#### Inherited from

[`LayersPanelLayerOptions`](LayersPanelLayerOptions.md).[`enabled`](LayersPanelLayerOptions.md#enabled)

***

### fontSize?

> `optional` **fontSize?**: `number`

Defined in: [canvas/src/layers/LayersPanelLayer.ts:42](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/LayersPanelLayer.ts#L42)

Font size in px. Default: 11

#### Inherited from

[`LayersPanelLayerOptions`](LayersPanelLayerOptions.md).[`fontSize`](LayersPanelLayerOptions.md#fontsize)

***

### hideIds?

> `optional` **hideIds?**: readonly `string`[]

Defined in: [canvas/src/layers/LayersPanelLayer.ts:55](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/LayersPanelLayer.ts#L55)

Layer ids to hide from the list. The panel's own id is always hidden
regardless of this option.

#### Inherited from

[`LayersPanelLayerOptions`](LayersPanelLayerOptions.md).[`hideIds`](LayersPanelLayerOptions.md#hideids)

***

### id?

> `optional` **id?**: `string`

Defined in: [canvas/src/layers/LayersPanelLayer.ts:60](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/LayersPanelLayer.ts#L60)

Layer id. Default: 'layers-panel'.

***

### opacity?

> `optional` **opacity?**: `number`

Defined in: [canvas/src/layers/LayersPanelLayer.ts:44](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/LayersPanelLayer.ts#L44)

Panel opacity 0–1. Default: 0.92

#### Inherited from

[`LayersPanelLayerOptions`](LayersPanelLayerOptions.md).[`opacity`](LayersPanelLayerOptions.md#opacity)

***

### textColor?

> `optional` **textColor?**: `string`

Defined in: [canvas/src/layers/LayersPanelLayer.ts:48](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/LayersPanelLayer.ts#L48)

Text color. Default: '#c8d3e0'

#### Inherited from

[`LayersPanelLayerOptions`](LayersPanelLayerOptions.md).[`textColor`](LayersPanelLayerOptions.md#textcolor)

***

### zIndex?

> `optional` **zIndex?**: `number`

Defined in: [canvas/src/layers/LayersPanelLayer.ts:62](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/LayersPanelLayer.ts#L62)

Pixi z-index inside the screen stage. Default: 9998 (just below DevInfoLayer).
