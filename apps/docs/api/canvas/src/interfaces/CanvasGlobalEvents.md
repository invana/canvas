# Interface: CanvasGlobalEvents

Defined in: [canvas/src/events/CanvasEventBus.ts:57](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/events/CanvasEventBus.ts#L57)

Default canvas-wide event map. Domain packages or the canvas implementation
can extend it via TypeScript module augmentation; for now we keep it open.

Listed here are events that the canvas itself or its built-in primitives
emit. Additional event names get added as their producers land.

## Extends

- [`EventMap`](../type-aliases/EventMap.md)

## Indexable

> \[`key`: `string`\]: `unknown`

## Properties

### background:click

> **background:click**: `object`

Defined in: [canvas/src/events/CanvasEventBus.ts:69](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/events/CanvasEventBus.ts#L69)

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### behaviour:disabled

> **behaviour:disabled**: `object`

Defined in: [canvas/src/events/CanvasEventBus.ts:66](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/events/CanvasEventBus.ts#L66)

#### id

> **id**: `string`

***

### behaviour:enabled

> **behaviour:enabled**: `object`

Defined in: [canvas/src/events/CanvasEventBus.ts:65](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/events/CanvasEventBus.ts#L65)

#### id

> **id**: `string`

***

### behaviour:registered

> **behaviour:registered**: `object`

Defined in: [canvas/src/events/CanvasEventBus.ts:64](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/events/CanvasEventBus.ts#L64)

#### id

> **id**: `string`

***

### camera:pan

> **camera:pan**: `object`

Defined in: [canvas/src/events/CanvasEventBus.ts:68](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/events/CanvasEventBus.ts#L68)

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### camera:zoom

> **camera:zoom**: `object`

Defined in: [canvas/src/events/CanvasEventBus.ts:67](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/events/CanvasEventBus.ts#L67)

#### centerX

> **centerX**: `number`

#### centerY

> **centerY**: `number`

#### scale

> **scale**: `number`

***

### layer:added

> **layer:added**: `object`

Defined in: [canvas/src/events/CanvasEventBus.ts:62](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/events/CanvasEventBus.ts#L62)

#### id

> **id**: `string`

***

### layer:removed

> **layer:removed**: `object`

Defined in: [canvas/src/events/CanvasEventBus.ts:63](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/events/CanvasEventBus.ts#L63)

#### id

> **id**: `string`

***

### renderer:initialised

> **renderer:initialised**: `object`

Defined in: [canvas/src/events/CanvasEventBus.ts:58](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/events/CanvasEventBus.ts#L58)

#### backend

> **backend**: `"canvas"` \| `"webgpu"` \| `"webgl"`

#### capabilities?

> `optional` **capabilities?**: `Record`\<`string`, `unknown`\>

***

### tap:dropped

> **tap:dropped**: `object`

Defined in: [canvas/src/events/CanvasEventBus.ts:70](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/events/CanvasEventBus.ts#L70)

#### reason

> **reason**: `"excluded"` \| `"sampled"`

#### type

> **type**: `string`
