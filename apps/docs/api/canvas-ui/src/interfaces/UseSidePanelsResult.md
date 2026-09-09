# Interface: UseSidePanelsResult

## Properties

### items

> **items**: [`ToolbarToggleItem`](ToolbarToggleItem.md)[]

Toolbar toggle items — spread into a **single** shared `<ToolbarItems>`.

***

### open

> **open**: (`id`) => `void`

Open a specific panel, or `null` to close whatever's open.

#### Parameters

##### id

`string`

#### Returns

`void`

***

### openId

> **openId**: `string`

The currently-open panel id, or `null`.

***

### region

> **region**: `any`

The open panel's region config for `GraphCanvasApp`'s `right` (or `bottom`); `undefined` when none is open.

***

### toggle

> **toggle**: (`id`) => `void`

Toggle a panel — opens it, or closes it if it's already the open one.

#### Parameters

##### id

`string`

#### Returns

`void`
