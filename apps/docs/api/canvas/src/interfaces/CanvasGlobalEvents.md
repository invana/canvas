# Interface: CanvasGlobalEvents

Defined in: [canvas/src/events/CanvasEventBus.ts:58](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/events/CanvasEventBus.ts#L58)

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

Defined in: [canvas/src/events/CanvasEventBus.ts:88](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/events/CanvasEventBus.ts#L88)

#### worldX

> **worldX**: `number`

#### worldY

> **worldY**: `number`

***

### behaviour:disabled

> **behaviour:disabled**: `object`

Defined in: [canvas/src/events/CanvasEventBus.ts:85](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/events/CanvasEventBus.ts#L85)

#### id

> **id**: `string`

***

### behaviour:enabled

> **behaviour:enabled**: `object`

Defined in: [canvas/src/events/CanvasEventBus.ts:84](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/events/CanvasEventBus.ts#L84)

#### id

> **id**: `string`

***

### behaviour:registered

> **behaviour:registered**: `object`

Defined in: [canvas/src/events/CanvasEventBus.ts:83](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/events/CanvasEventBus.ts#L83)

#### id

> **id**: `string`

***

### camera:pan

> **camera:pan**: `object`

Defined in: [canvas/src/events/CanvasEventBus.ts:87](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/events/CanvasEventBus.ts#L87)

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### camera:zoom

> **camera:zoom**: `object`

Defined in: [canvas/src/events/CanvasEventBus.ts:86](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/events/CanvasEventBus.ts#L86)

#### centerX

> **centerX**: `number`

#### centerY

> **centerY**: `number`

#### scale

> **scale**: `number`

***

### layer:added

> **layer:added**: `object`

Defined in: [canvas/src/events/CanvasEventBus.ts:63](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/events/CanvasEventBus.ts#L63)

#### id

> **id**: `string`

***

### layer:removed

> **layer:removed**: `object`

Defined in: [canvas/src/events/CanvasEventBus.ts:64](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/events/CanvasEventBus.ts#L64)

#### id

> **id**: `string`

***

### layout:added

> **layout:added**: `object`

Defined in: [canvas/src/events/CanvasEventBus.ts:65](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/events/CanvasEventBus.ts#L65)

#### id

> **id**: `string`

***

### layout:removed

> **layout:removed**: `object`

Defined in: [canvas/src/events/CanvasEventBus.ts:66](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/events/CanvasEventBus.ts#L66)

#### id

> **id**: `string`

***

### layout:run:end

> **layout:run:end**: `object`

Defined in: [canvas/src/events/CanvasEventBus.ts:82](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/events/CanvasEventBus.ts#L82)

A layout run ended. `reason` distinguishes a natural settle (`'settled'`)
from an external `stop()` / superseding `apply()` (`'stopped'`) or an
aborted run (`'cancelled'`). Always pairs with a preceding `layout:run:start`.

#### id

> **id**: `string`

#### reason

> **reason**: `"settled"` \| `"stopped"` \| `"cancelled"`

***

### layout:run:start

> **layout:run:start**: `object`

Defined in: [canvas/src/events/CanvasEventBus.ts:76](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/events/CanvasEventBus.ts#L76)

A layout run started. Emitted by `Canvas.runLayout` when it forwards a
registered layout's own `start` lifecycle event onto the canvas bus, so
every canvas-driven run (`runLayout`, `refresh`, the "Run layout" button,
expand re-layouts) surfaces consistently. `animate` reflects whether the
run animates its settle (iterative layouts) or jumps to final positions;
`nodeCount` / `edgeCount` describe the run size. Subscribe for progress
UIs, telemetry, or layout-activity render policies.

#### animate

> **animate**: `boolean`

#### edgeCount

> **edgeCount**: `number`

#### id

> **id**: `string`

#### nodeCount

> **nodeCount**: `number`

***

### message

> **message**: `object`

Defined in: [canvas/src/events/CanvasEventBus.ts:104](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/events/CanvasEventBus.ts#L104)

The shared message channel — anything (a layout's start/end, a behaviour
activating, app code) emits a line for a status surface to display.
`text: null` clears the current message; `timeout` (ms) auto-clears it.
Emit via `Canvas.showMessage` / `ctx.showMessage` rather than by hand.

#### text

> **text**: `string`

#### timeout?

> `optional` **timeout?**: `number`

***

### options:change

> **options:change**: `object`

Defined in: [canvas/src/events/CanvasEventBus.ts:91](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/events/CanvasEventBus.ts#L91)

`Canvas.update()` patched the options; carries the touched ids (serialisable).

#### changedBehaviourIds

> **changedBehaviourIds**: readonly `string`[]

#### changedLayerIds

> **changedLayerIds**: readonly `string`[]

***

### renderer:initialised

> **renderer:initialised**: `object`

Defined in: [canvas/src/events/CanvasEventBus.ts:59](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/events/CanvasEventBus.ts#L59)

#### backend

> **backend**: `"canvas"` \| `"webgpu"` \| `"webgl"`

#### capabilities?

> `optional` **capabilities?**: `Record`\<`string`, `unknown`\>

***

### tap:dropped

> **tap:dropped**: `object`

Defined in: [canvas/src/events/CanvasEventBus.ts:89](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/events/CanvasEventBus.ts#L89)

#### reason

> **reason**: `"excluded"` \| `"sampled"`

#### type

> **type**: `string`

***

### theme:change

> **theme:change**: [`ResolvedTheme`](ResolvedTheme.md)

Defined in: [canvas/src/events/CanvasEventBus.ts:97](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/events/CanvasEventBus.ts#L97)

The active theme was (re)published via `ctx.theme.set(...)`. The single
publisher is the domain `ThemeBehaviour`; theme-aware layers subscribe and
recolour from the resolved palette. Payload is plain-JSON (numbers/strings).
