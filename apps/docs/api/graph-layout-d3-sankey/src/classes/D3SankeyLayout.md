# Class: D3SankeyLayout

Defined in: [graph-layout-d3-sankey/src/D3SankeyLayout.ts:60](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph-layout-d3-sankey/src/D3SankeyLayout.ts#L60)

## Extends

- [`Layout`](../../../canvas/src/classes/Layout.md)\<[`GraphLayer`](../../../graph/src/classes/GraphLayer.md)\>

## Constructors

### Constructor

> **new D3SankeyLayout**(`opts?`): `D3SankeyLayout`

Defined in: [graph-layout-d3-sankey/src/D3SankeyLayout.ts:65](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph-layout-d3-sankey/src/D3SankeyLayout.ts#L65)

#### Parameters

##### opts?

[`D3SankeyLayoutOptions`](../interfaces/D3SankeyLayoutOptions.md) = `{}`

#### Returns

`D3SankeyLayout`

#### Overrides

[`Layout`](../../../canvas/src/classes/Layout.md).[`constructor`](../../../canvas/src/classes/Layout.md#constructor)

## Properties

### events

> `readonly` **events**: [`EventEmitter`](../../../canvas/src/classes/EventEmitter.md)\<[`LayoutEvents`](../../../canvas/src/type-aliases/LayoutEvents.md)\>

Defined in: [canvas/src/layouts/Layout.ts:71](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/layouts/Layout.ts#L71)

Lifecycle event bus. See class docs for the event vocabulary.
Subclasses with richer telemetry can declare their own typed
emitter on top (`override readonly events = new EventEmitter<MyEvents>()`).

#### Inherited from

[`Layout`](../../../canvas/src/classes/Layout.md).[`events`](../../../canvas/src/classes/Layout.md#events)

## Methods

### apply()

> **apply**(`layer`): `Promise`\<`void`\>

Defined in: [graph-layout-d3-sankey/src/D3SankeyLayout.ts:75](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph-layout-d3-sankey/src/D3SankeyLayout.ts#L75)

Run the layout against `layer`. Resolves once positions and per-edge
hints have been written. Lifecycle events fire in order:
`start` → `tick` (once) → `end`.

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

Defined in: [graph-layout-d3-sankey/src/D3SankeyLayout.ts:226](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph-layout-d3-sankey/src/D3SankeyLayout.ts#L226)

Cancel a run. The synchronous body of `apply()` rarely yields long
 enough for this to fire, but it keeps the contract symmetric with
 iterative layouts.

#### Returns

`void`
