# Interface: PrimitivesRendererEventMap

Defined in: [packages/canvas/src/primitives/types.ts:729](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L729)

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

Defined in: [packages/canvas/src/primitives/types.ts:739](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L739)

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

Defined in: [packages/canvas/src/primitives/types.ts:737](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L737)

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

Defined in: [packages/canvas/src/primitives/types.ts:736](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L736)

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### connector:pointerover

> **connector:pointerover**: `object`

Defined in: [packages/canvas/src/primitives/types.ts:735](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L735)

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### connector:pointerup

> **connector:pointerup**: `object`

Defined in: [packages/canvas/src/primitives/types.ts:738](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L738)

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

Defined in: [packages/canvas/src/primitives/types.ts:734](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L734)

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

Defined in: [packages/canvas/src/primitives/types.ts:732](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L732)

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

Defined in: [packages/canvas/src/primitives/types.ts:731](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L731)

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### shape:pointerover

> **shape:pointerover**: `object`

Defined in: [packages/canvas/src/primitives/types.ts:730](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L730)

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### shape:pointerup

> **shape:pointerup**: `object`

Defined in: [packages/canvas/src/primitives/types.ts:733](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L733)

#### button

> **button**: `number`

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`
