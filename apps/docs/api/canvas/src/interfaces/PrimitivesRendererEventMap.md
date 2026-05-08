# Interface: PrimitivesRendererEventMap

Defined in: packages/canvas/src/primitives/types.ts:442

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

Defined in: packages/canvas/src/primitives/types.ts:452

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

Defined in: packages/canvas/src/primitives/types.ts:450

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

Defined in: packages/canvas/src/primitives/types.ts:449

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### connector:pointerover

> **connector:pointerover**: `object`

Defined in: packages/canvas/src/primitives/types.ts:448

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### connector:pointerup

> **connector:pointerup**: `object`

Defined in: packages/canvas/src/primitives/types.ts:451

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

Defined in: packages/canvas/src/primitives/types.ts:447

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

Defined in: packages/canvas/src/primitives/types.ts:445

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

Defined in: packages/canvas/src/primitives/types.ts:444

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### shape:pointerover

> **shape:pointerover**: `object`

Defined in: packages/canvas/src/primitives/types.ts:443

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### shape:pointerup

> **shape:pointerup**: `object`

Defined in: packages/canvas/src/primitives/types.ts:446

#### button

> **button**: `number`

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`
