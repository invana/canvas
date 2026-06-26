# Abstract Class: Layout\<TLayer\>

Defined in: [canvas/src/layouts/Layout.ts:84](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layouts/Layout.ts#L84)

## Type Parameters

### TLayer

`TLayer` *extends* [`Layer`](Layer.md)\<`any`, `any`, `any`, `any`\> = [`Layer`](Layer.md)\<`any`, `any`, `any`, `any`\>

## Constructors

### Constructor

> **new Layout**\<`TLayer`\>(`opts?`): `Layout`\<`TLayer`\>

Defined in: [canvas/src/layouts/Layout.ts:97](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layouts/Layout.ts#L97)

#### Parameters

##### opts?

[`LayoutOptions`](../interfaces/LayoutOptions.md) = `{}`

#### Returns

`Layout`\<`TLayer`\>

## Properties

### events

> `readonly` **events**: [`EventEmitter`](EventEmitter.md)\<[`LayoutEvents`](../type-aliases/LayoutEvents.md)\>

Defined in: [canvas/src/layouts/Layout.ts:95](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layouts/Layout.ts#L95)

Lifecycle event bus. See class docs for the event vocabulary.
Subclasses with richer telemetry can declare their own typed
emitter on top (`override readonly events = new EventEmitter<MyEvents>()`).

***

### id

> `readonly` **id**: `string`

Defined in: [canvas/src/layouts/Layout.ts:86](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layouts/Layout.ts#L86)

Stable id (registry / config key).

***

### targetLayerId?

> `readonly` `optional` **targetLayerId?**: `string`

Defined in: [canvas/src/layouts/Layout.ts:88](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layouts/Layout.ts#L88)

The layer this layout targets, if declared at construction.

## Methods

### apply()

> `abstract` **apply**(`layer`): `Promise`\<`void`\>

Defined in: [canvas/src/layouts/Layout.ts:118](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layouts/Layout.ts#L118)

Run the layout against `layer`. Resolves when the run terminates
(either a natural settle or an external `stop()`).

Calling `apply()` again on the same instance must cancel any in-flight
run first.

#### Parameters

##### layer

`TLayer`

#### Returns

`Promise`\<`void`\>

***

### setOptions()

> **setOptions**(`_patch`): `void`

Defined in: [canvas/src/layouts/Layout.ts:107](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layouts/Layout.ts#L107)

Live-reconfigure. Called by `Canvas.update({ layouts: { id: patch } })`.
Default no-op; iterative layouts (e.g. `D3ForceLayout`) override to merge
the patch and re-heat a running simulation.

#### Parameters

##### \_patch

`unknown`

#### Returns

`void`
