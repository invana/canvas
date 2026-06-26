# Interface: LayerOptions\<TOptions\>

Defined in: [canvas/src/layers/Layer.ts:59](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L59)

## Type Parameters

### TOptions

`TOptions` = `unknown`

## Properties

### cullable?

> `optional` **cullable?**: `boolean`

Defined in: [canvas/src/layers/Layer.ts:70](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L70)

Off-screen culling participation. Default `true`. Set `false` for
full-canvas effect layers (background gradient, overlay) that should
always render regardless of camera visibility.

***

### devtoolsName?

> `optional` **devtoolsName?**: `string`

Defined in: [canvas/src/layers/Layer.ts:72](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L72)

Optional: name shown in devtools. Default `'<ClassName>:<id>'`.

***

### hittable?

> `optional` **hittable?**: `boolean`

Defined in: [canvas/src/layers/Layer.ts:63](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L63)

***

### id

> **id**: `string`

Defined in: [canvas/src/layers/Layer.ts:60](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L60)

***

### options

> **options**: `TOptions`

Defined in: [canvas/src/layers/Layer.ts:61](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L61)

***

### visible?

> `optional` **visible?**: `boolean`

Defined in: [canvas/src/layers/Layer.ts:62](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L62)

***

### zIndex?

> `optional` **zIndex?**: `number`

Defined in: [canvas/src/layers/Layer.ts:64](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/Layer.ts#L64)
