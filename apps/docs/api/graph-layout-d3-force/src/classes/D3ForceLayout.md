# Class: D3ForceLayout

Defined in: [graph-layout-d3-force/src/D3ForceLayout.ts:52](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layout-d3-force/src/D3ForceLayout.ts#L52)

## Extends

- [`Layout`](../../../canvas/src/classes/Layout.md)\<[`GraphLayer`](../../../graph/src/classes/GraphLayer.md)\>

## Constructors

### Constructor

> **new D3ForceLayout**(`opts?`): `D3ForceLayout`

Defined in: [graph-layout-d3-force/src/D3ForceLayout.ts:75](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layout-d3-force/src/D3ForceLayout.ts#L75)

#### Parameters

##### opts?

[`D3ForceLayoutOptions`](../interfaces/D3ForceLayoutOptions.md) = `{}`

#### Returns

`D3ForceLayout`

#### Overrides

[`Layout`](../../../canvas/src/classes/Layout.md).[`constructor`](../../../canvas/src/classes/Layout.md#constructor)

## Properties

### events

> `readonly` **events**: [`EventEmitter`](../../../canvas/src/classes/EventEmitter.md)\<[`LayoutEvents`](../../../canvas/src/type-aliases/LayoutEvents.md)\>

Defined in: [canvas/src/layouts/Layout.ts:71](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/layouts/Layout.ts#L71)

Lifecycle event bus. See class docs for the event vocabulary.
Subclasses with richer telemetry can declare their own typed
emitter on top (`override readonly events = new EventEmitter<MyEvents>()`).

#### Inherited from

[`Layout`](../../../canvas/src/classes/Layout.md).[`events`](../../../canvas/src/classes/Layout.md#events)

## Methods

### apply()

> **apply**(`layer`): `Promise`\<`void`\>

Defined in: [graph-layout-d3-force/src/D3ForceLayout.ts:85](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layout-d3-force/src/D3ForceLayout.ts#L85)

Run the layout against `layer`. Resolves when the simulation settles
naturally OR is cancelled via `stop()` / a second `apply()` call.
Lifecycle events (`start` / `tick` / `end`) fire around the run.

#### Parameters

##### layer

[`GraphLayer`](../../../graph/src/classes/GraphLayer.md)

#### Returns

`Promise`\<`void`\>

#### Overrides

[`Layout`](../../../canvas/src/classes/Layout.md).[`apply`](../../../canvas/src/classes/Layout.md#apply)

***

### stop()

> **stop**(): `void`

Defined in: [graph-layout-d3-force/src/D3ForceLayout.ts:181](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layout-d3-force/src/D3ForceLayout.ts#L181)

Cancel an in-flight run. Positions stay in the store. No-op when idle.

#### Returns

`void`
