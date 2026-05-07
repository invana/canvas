# Interface: ShapesRendererEventMap

Defined in: [packages/canvas/src/renderers/types.ts:434](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L434)

Raw, DOM-level events the renderer surfaces. No semantic interpretation —
they describe pointer hits on shapes / connectors and nothing more. Layers
translate them into domain events.

## Extends

- [`EventMap`](../type-aliases/EventMap.md)

## Indexable

> \[`key`: `string`\]: `unknown`

## Properties

### connector:click

> **connector:click**: `object`

Defined in: [packages/canvas/src/renderers/types.ts:444](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L444)

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

Defined in: [packages/canvas/src/renderers/types.ts:442](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L442)

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

Defined in: [packages/canvas/src/renderers/types.ts:441](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L441)

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### connector:pointerover

> **connector:pointerover**: `object`

Defined in: [packages/canvas/src/renderers/types.ts:440](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L440)

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### connector:pointerup

> **connector:pointerup**: `object`

Defined in: [packages/canvas/src/renderers/types.ts:443](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L443)

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

Defined in: [packages/canvas/src/renderers/types.ts:439](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L439)

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

Defined in: [packages/canvas/src/renderers/types.ts:437](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L437)

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

Defined in: [packages/canvas/src/renderers/types.ts:436](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L436)

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### shape:pointerover

> **shape:pointerover**: `object`

Defined in: [packages/canvas/src/renderers/types.ts:435](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L435)

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### shape:pointerup

> **shape:pointerup**: `object`

Defined in: [packages/canvas/src/renderers/types.ts:438](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L438)

#### button

> **button**: `number`

#### id

> **id**: `string`

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`
