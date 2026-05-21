# Interface: PrimitivesRendererEventMap

Defined in: [canvas/src/primitives/types.ts:1084](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1084)

Raw, DOM-level events the `PrimitivesRenderer` surfaces. No semantic
interpretation — they describe pointer hits on shapes / connectors and
nothing more. Layers translate them into domain events.

## Extends

- [`EventMap`](../type-aliases/EventMap.md)

## Indexable

> \[`key`: `string`\]: `unknown`

## Properties

### connector:click

> **connector:click**: `object`

Defined in: [canvas/src/primitives/types.ts:1098](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1098)

Left-button click. Right-button → `connector:contextmenu`.

#### button

> **button**: `number`

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### connector:contextmenu

> **connector:contextmenu**: `object`

Defined in: [canvas/src/primitives/types.ts:1100](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1100)

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### connector:doubleclick

> **connector:doubleclick**: `object`

Defined in: [canvas/src/primitives/types.ts:1099](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1099)

#### button

> **button**: `number`

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### connector:pointerdown

> **connector:pointerdown**: `object`

Defined in: [canvas/src/primitives/types.ts:1095](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1095)

#### button

> **button**: `number`

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### connector:pointerout

> **connector:pointerout**: `object`

Defined in: [canvas/src/primitives/types.ts:1094](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1094)

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### connector:pointerover

> **connector:pointerover**: `object`

Defined in: [canvas/src/primitives/types.ts:1093](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1093)

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### connector:pointerup

> **connector:pointerup**: `object`

Defined in: [canvas/src/primitives/types.ts:1096](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1096)

#### button

> **button**: `number`

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### shape:click

> **shape:click**: `object`

Defined in: [canvas/src/primitives/types.ts:1090](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1090)

Left-button click. Right-button → `shape:contextmenu`.

#### button

> **button**: `number`

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### shape:contextmenu

> **shape:contextmenu**: `object`

Defined in: [canvas/src/primitives/types.ts:1092](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1092)

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### shape:doubleclick

> **shape:doubleclick**: `object`

Defined in: [canvas/src/primitives/types.ts:1091](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1091)

#### button

> **button**: `number`

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### shape:pointerdown

> **shape:pointerdown**: `object`

Defined in: [canvas/src/primitives/types.ts:1087](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1087)

#### button

> **button**: `number`

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### shape:pointerout

> **shape:pointerout**: `object`

Defined in: [canvas/src/primitives/types.ts:1086](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1086)

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### shape:pointerover

> **shape:pointerover**: `object`

Defined in: [canvas/src/primitives/types.ts:1085](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1085)

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### shape:pointerup

> **shape:pointerup**: `object`

Defined in: [canvas/src/primitives/types.ts:1088](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1088)

#### button

> **button**: `number`

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`
