# Interface: DevInfoLayerOptions

Defined in: [canvas/src/layers/DevInfoLayer.ts:35](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/DevInfoLayer.ts#L35)

## Extended by

- [`DevInfoLayerCtorOptions`](DevInfoLayerCtorOptions.md)

## Properties

### accentColor?

> `optional` **accentColor?**: `string`

Defined in: [canvas/src/layers/DevInfoLayer.ts:55](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/DevInfoLayer.ts#L55)

Accent / header color. Default: '#4fc3f7'

***

### backgroundColor?

> `optional` **backgroundColor?**: `string`

Defined in: [canvas/src/layers/DevInfoLayer.ts:51](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/DevInfoLayer.ts#L51)

Overlay background CSS color. Default: 'rgba(10,10,10,0.82)'

***

### corner?

> `optional` **corner?**: [`DevInfoCorner`](../type-aliases/DevInfoCorner.md)

Defined in: [canvas/src/layers/DevInfoLayer.ts:37](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/DevInfoLayer.ts#L37)

Which corner to anchor the overlay. Default: 'bottom-left'

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [canvas/src/layers/DevInfoLayer.ts:45](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/DevInfoLayer.ts#L45)

Show the overlay. Can be toggled at runtime via setEnabled(). Default: true

***

### fontSize?

> `optional` **fontSize?**: `number`

Defined in: [canvas/src/layers/DevInfoLayer.ts:47](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/DevInfoLayer.ts#L47)

Font size in px. Default: 11

***

### margin?

> `optional` **margin?**: `number` \| \{ `x?`: `number`; `y?`: `number`; \}

Defined in: [canvas/src/layers/DevInfoLayer.ts:43](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/DevInfoLayer.ts#L43)

Inset from the chosen `corner`, in screen pixels. A single number applies to
both axes; `{ x, y }` sets them independently (e.g. bump `y` to clear a top
header bar). Default: 10.

***

### opacity?

> `optional` **opacity?**: `number`

Defined in: [canvas/src/layers/DevInfoLayer.ts:49](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/DevInfoLayer.ts#L49)

Panel opacity 0–1. Default: 0.92

***

### textColor?

> `optional` **textColor?**: `string`

Defined in: [canvas/src/layers/DevInfoLayer.ts:53](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/DevInfoLayer.ts#L53)

Text color. Default: '#c8d3e0'
