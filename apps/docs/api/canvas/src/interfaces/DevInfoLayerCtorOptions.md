# Interface: DevInfoLayerCtorOptions

Defined in: [canvas/src/layers/DevInfoLayer.ts:58](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/DevInfoLayer.ts#L58)

## Extends

- [`DevInfoLayerOptions`](DevInfoLayerOptions.md)

## Properties

### accentColor?

> `optional` **accentColor?**: `string`

Defined in: [canvas/src/layers/DevInfoLayer.ts:55](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/DevInfoLayer.ts#L55)

Accent / header color. Default: '#4fc3f7'

#### Inherited from

[`DevInfoLayerOptions`](DevInfoLayerOptions.md).[`accentColor`](DevInfoLayerOptions.md#accentcolor)

***

### backgroundColor?

> `optional` **backgroundColor?**: `string`

Defined in: [canvas/src/layers/DevInfoLayer.ts:51](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/DevInfoLayer.ts#L51)

Overlay background CSS color. Default: 'rgba(10,10,10,0.82)'

#### Inherited from

[`DevInfoLayerOptions`](DevInfoLayerOptions.md).[`backgroundColor`](DevInfoLayerOptions.md#backgroundcolor)

***

### corner?

> `optional` **corner?**: [`DevInfoCorner`](../type-aliases/DevInfoCorner.md)

Defined in: [canvas/src/layers/DevInfoLayer.ts:37](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/DevInfoLayer.ts#L37)

Which corner to anchor the overlay. Default: 'bottom-left'

#### Inherited from

[`DevInfoLayerOptions`](DevInfoLayerOptions.md).[`corner`](DevInfoLayerOptions.md#corner)

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [canvas/src/layers/DevInfoLayer.ts:45](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/DevInfoLayer.ts#L45)

Show the overlay. Can be toggled at runtime via setEnabled(). Default: true

#### Inherited from

[`DevInfoLayerOptions`](DevInfoLayerOptions.md).[`enabled`](DevInfoLayerOptions.md#enabled)

***

### fontSize?

> `optional` **fontSize?**: `number`

Defined in: [canvas/src/layers/DevInfoLayer.ts:47](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/DevInfoLayer.ts#L47)

Font size in px. Default: 11

#### Inherited from

[`DevInfoLayerOptions`](DevInfoLayerOptions.md).[`fontSize`](DevInfoLayerOptions.md#fontsize)

***

### id?

> `optional` **id?**: `string`

Defined in: [canvas/src/layers/DevInfoLayer.ts:60](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/DevInfoLayer.ts#L60)

Layer id. Default: 'dev-info'.

***

### margin?

> `optional` **margin?**: `number` \| \{ `x?`: `number`; `y?`: `number`; \}

Defined in: [canvas/src/layers/DevInfoLayer.ts:43](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/DevInfoLayer.ts#L43)

Inset from the chosen `corner`, in screen pixels. A single number applies to
both axes; `{ x, y }` sets them independently (e.g. bump `y` to clear a top
header bar). Default: 10.

#### Inherited from

[`DevInfoLayerOptions`](DevInfoLayerOptions.md).[`margin`](DevInfoLayerOptions.md#margin)

***

### opacity?

> `optional` **opacity?**: `number`

Defined in: [canvas/src/layers/DevInfoLayer.ts:49](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/DevInfoLayer.ts#L49)

Panel opacity 0–1. Default: 0.92

#### Inherited from

[`DevInfoLayerOptions`](DevInfoLayerOptions.md).[`opacity`](DevInfoLayerOptions.md#opacity)

***

### textColor?

> `optional` **textColor?**: `string`

Defined in: [canvas/src/layers/DevInfoLayer.ts:53](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/DevInfoLayer.ts#L53)

Text color. Default: '#c8d3e0'

#### Inherited from

[`DevInfoLayerOptions`](DevInfoLayerOptions.md).[`textColor`](DevInfoLayerOptions.md#textcolor)

***

### zIndex?

> `optional` **zIndex?**: `number`

Defined in: [canvas/src/layers/DevInfoLayer.ts:62](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/DevInfoLayer.ts#L62)

Pixi z-index inside the screen stage. Default: 9999 (top).
