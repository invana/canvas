# Interface: LayerOptions\<TOptions\>

## Type Parameters

### TOptions

`TOptions` = `unknown`

## Properties

### cullable?

> `optional` **cullable?**: `boolean`

Off-screen culling participation. Default `true`. Set `false` for
full-canvas effect layers (background gradient, overlay) that should
always render regardless of camera visibility.

***

### hittable?

> `optional` **hittable?**: `boolean`

***

### id

> **id**: `string`

***

### options

> **options**: `TOptions`

***

### visible?

> `optional` **visible?**: `boolean`

***

### zIndex?

> `optional` **zIndex?**: `number`
