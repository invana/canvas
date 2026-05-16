# Interface: DevInfoLayerCtorOptions

Defined in: [canvas/src/layers/DevInfoLayer.ts:52](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/DevInfoLayer.ts#L52)

## Extends

- [`DevInfoLayerOptions`](DevInfoLayerOptions.md)

## Properties

### accentColor?

> `optional` **accentColor?**: `string`

Defined in: [canvas/src/layers/DevInfoLayer.ts:49](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/DevInfoLayer.ts#L49)

Accent / header color. Default: '#4fc3f7'

#### Inherited from

[`DevInfoLayerOptions`](DevInfoLayerOptions.md).[`accentColor`](DevInfoLayerOptions.md#accentcolor)

***

### backgroundColor?

> `optional` **backgroundColor?**: `string`

Defined in: [canvas/src/layers/DevInfoLayer.ts:45](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/DevInfoLayer.ts#L45)

Overlay background CSS color. Default: 'rgba(10,10,10,0.82)'

#### Inherited from

[`DevInfoLayerOptions`](DevInfoLayerOptions.md).[`backgroundColor`](DevInfoLayerOptions.md#backgroundcolor)

***

### corner?

> `optional` **corner?**: [`DevInfoCorner`](../type-aliases/DevInfoCorner.md)

Defined in: [canvas/src/layers/DevInfoLayer.ts:37](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/DevInfoLayer.ts#L37)

Which corner to anchor the overlay. Default: 'bottom-left'

#### Inherited from

[`DevInfoLayerOptions`](DevInfoLayerOptions.md).[`corner`](DevInfoLayerOptions.md#corner)

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [canvas/src/layers/DevInfoLayer.ts:39](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/DevInfoLayer.ts#L39)

Show the overlay. Can be toggled at runtime via setEnabled(). Default: true

#### Inherited from

[`DevInfoLayerOptions`](DevInfoLayerOptions.md).[`enabled`](DevInfoLayerOptions.md#enabled)

***

### fontSize?

> `optional` **fontSize?**: `number`

Defined in: [canvas/src/layers/DevInfoLayer.ts:41](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/DevInfoLayer.ts#L41)

Font size in px. Default: 11

#### Inherited from

[`DevInfoLayerOptions`](DevInfoLayerOptions.md).[`fontSize`](DevInfoLayerOptions.md#fontsize)

***

### id?

> `optional` **id?**: `string`

Defined in: [canvas/src/layers/DevInfoLayer.ts:54](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/DevInfoLayer.ts#L54)

Layer id. Default: 'dev-info'.

***

### opacity?

> `optional` **opacity?**: `number`

Defined in: [canvas/src/layers/DevInfoLayer.ts:43](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/DevInfoLayer.ts#L43)

Panel opacity 0–1. Default: 0.92

#### Inherited from

[`DevInfoLayerOptions`](DevInfoLayerOptions.md).[`opacity`](DevInfoLayerOptions.md#opacity)

***

### textColor?

> `optional` **textColor?**: `string`

Defined in: [canvas/src/layers/DevInfoLayer.ts:47](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/DevInfoLayer.ts#L47)

Text color. Default: '#c8d3e0'

#### Inherited from

[`DevInfoLayerOptions`](DevInfoLayerOptions.md).[`textColor`](DevInfoLayerOptions.md#textcolor)

***

### zIndex?

> `optional` **zIndex?**: `number`

Defined in: [canvas/src/layers/DevInfoLayer.ts:56](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/layers/DevInfoLayer.ts#L56)

Pixi z-index inside the screen stage. Default: 9999 (top).
