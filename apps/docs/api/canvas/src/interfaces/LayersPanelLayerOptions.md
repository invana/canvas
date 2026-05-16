# Interface: LayersPanelLayerOptions

Defined in: [canvas/src/layers/LayersPanelLayer.ts:36](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/layers/LayersPanelLayer.ts#L36)

## Extended by

- [`LayersPanelLayerCtorOptions`](LayersPanelLayerCtorOptions.md)

## Properties

### accentColor?

> `optional` **accentColor?**: `string`

Defined in: [canvas/src/layers/LayersPanelLayer.ts:50](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/layers/LayersPanelLayer.ts#L50)

Accent / header color. Default: '#4fc3f7'

***

### backgroundColor?

> `optional` **backgroundColor?**: `string`

Defined in: [canvas/src/layers/LayersPanelLayer.ts:46](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/layers/LayersPanelLayer.ts#L46)

Overlay background CSS color. Default: 'rgba(10,10,10,0.82)'

***

### corner?

> `optional` **corner?**: [`LayersPanelCorner`](../type-aliases/LayersPanelCorner.md)

Defined in: [canvas/src/layers/LayersPanelLayer.ts:38](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/layers/LayersPanelLayer.ts#L38)

Which corner to anchor the overlay. Default: 'top-right'

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [canvas/src/layers/LayersPanelLayer.ts:40](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/layers/LayersPanelLayer.ts#L40)

Show the overlay. Toggle at runtime via setEnabled(). Default: true

***

### fontSize?

> `optional` **fontSize?**: `number`

Defined in: [canvas/src/layers/LayersPanelLayer.ts:42](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/layers/LayersPanelLayer.ts#L42)

Font size in px. Default: 11

***

### hideIds?

> `optional` **hideIds?**: readonly `string`[]

Defined in: [canvas/src/layers/LayersPanelLayer.ts:55](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/layers/LayersPanelLayer.ts#L55)

Layer ids to hide from the list. The panel's own id is always hidden
regardless of this option.

***

### opacity?

> `optional` **opacity?**: `number`

Defined in: [canvas/src/layers/LayersPanelLayer.ts:44](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/layers/LayersPanelLayer.ts#L44)

Panel opacity 0–1. Default: 0.92

***

### textColor?

> `optional` **textColor?**: `string`

Defined in: [canvas/src/layers/LayersPanelLayer.ts:48](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/layers/LayersPanelLayer.ts#L48)

Text color. Default: '#c8d3e0'
