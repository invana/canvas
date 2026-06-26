# Class: D3SankeyLayout

Defined in: [graph-layout-d3-sankey/src/D3SankeyLayout.ts:67](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-sankey/src/D3SankeyLayout.ts#L67)

## Extends

- `Layout`\<`GraphLayer`\>

## Constructors

### Constructor

> **new D3SankeyLayout**(`opts?`): `D3SankeyLayout`

Defined in: [graph-layout-d3-sankey/src/D3SankeyLayout.ts:72](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-sankey/src/D3SankeyLayout.ts#L72)

#### Parameters

##### opts?

[`D3SankeyLayoutOptions`](../interfaces/D3SankeyLayoutOptions.md) = `{}`

#### Returns

`D3SankeyLayout`

#### Overrides

`Layout<GraphLayer>.constructor`

## Properties

### events

> `readonly` **events**: `EventEmitter`\<`LayoutEvents`\>

Defined in: canvas/dist/index.d.ts:1876

Lifecycle event bus. See class docs for the event vocabulary.
Subclasses with richer telemetry can declare their own typed
emitter on top (`override readonly events = new EventEmitter<MyEvents>()`).

#### Inherited from

`Layout.events`

***

### id

> `readonly` **id**: `string`

Defined in: canvas/dist/index.d.ts:1868

Stable id (registry / config key).

#### Inherited from

`Layout.id`

***

### targetLayerId?

> `readonly` `optional` **targetLayerId?**: `string`

Defined in: canvas/dist/index.d.ts:1870

The layer this layout targets, if declared at construction.

#### Inherited from

`Layout.targetLayerId`

## Methods

### apply()

> **apply**(`layer`): `Promise`\<`void`\>

Defined in: [graph-layout-d3-sankey/src/D3SankeyLayout.ts:84](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-sankey/src/D3SankeyLayout.ts#L84)

Run the layout against `layer`. Resolves once positions and per-edge
hints have been written. Lifecycle events fire in order:
`start` → `tick` (once) → `end`.

#### Parameters

##### layer

`GraphLayer`

#### Returns

`Promise`\<`void`\>

#### Overrides

`Layout.apply`

***

### setOptions()

> **setOptions**(`_patch`): `void`

Defined in: canvas/dist/index.d.ts:1883

Live-reconfigure. Called by `Canvas.update({ layouts: { id: patch } })`.
Default no-op; iterative layouts (e.g. `D3ForceLayout`) override to merge
the patch and re-heat a running simulation.

#### Parameters

##### \_patch

`unknown`

#### Returns

`void`

#### Inherited from

`Layout.setOptions`

***

### stop()

> **stop**(): `void`

Defined in: [graph-layout-d3-sankey/src/D3SankeyLayout.ts:237](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-sankey/src/D3SankeyLayout.ts#L237)

Cancel a run. The synchronous body of `apply()` rarely yields long
 enough for this to fire, but it keeps the contract symmetric with
 iterative layouts.

#### Returns

`void`
