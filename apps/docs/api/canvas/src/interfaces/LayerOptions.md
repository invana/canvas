# Interface: LayerOptions\<TOptions\>

Defined in: [packages/canvas/src/layers/Layer.ts:56](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/Layer.ts#L56)

## Type Parameters

### TOptions

`TOptions` = `unknown`

## Properties

### cullable?

> `optional` **cullable?**: `boolean`

Defined in: [packages/canvas/src/layers/Layer.ts:67](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/Layer.ts#L67)

Off-screen culling participation. Default `true`. Set `false` for
full-canvas effect layers (background gradient, overlay) that should
always render regardless of camera visibility.

***

### devtoolsName?

> `optional` **devtoolsName?**: `string`

Defined in: [packages/canvas/src/layers/Layer.ts:69](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/Layer.ts#L69)

Optional: name shown in devtools. Default `'<ClassName>:<id>'`.

***

### hittable?

> `optional` **hittable?**: `boolean`

Defined in: [packages/canvas/src/layers/Layer.ts:60](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/Layer.ts#L60)

***

### id

> **id**: `string`

Defined in: [packages/canvas/src/layers/Layer.ts:57](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/Layer.ts#L57)

***

### options

> **options**: `TOptions`

Defined in: [packages/canvas/src/layers/Layer.ts:58](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/Layer.ts#L58)

***

### visible?

> `optional` **visible?**: `boolean`

Defined in: [packages/canvas/src/layers/Layer.ts:59](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/Layer.ts#L59)

***

### zIndex?

> `optional` **zIndex?**: `number`

Defined in: [packages/canvas/src/layers/Layer.ts:61](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/layers/Layer.ts#L61)
