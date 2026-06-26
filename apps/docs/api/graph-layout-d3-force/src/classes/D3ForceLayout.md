# Class: D3ForceLayout

Defined in: [graph-layout-d3-force/src/D3ForceLayout.ts:59](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-force/src/D3ForceLayout.ts#L59)

## Extends

- `Layout`\<`GraphLayer`\>

## Constructors

### Constructor

> **new D3ForceLayout**(`opts?`): `D3ForceLayout`

Defined in: [graph-layout-d3-force/src/D3ForceLayout.ts:111](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-force/src/D3ForceLayout.ts#L111)

#### Parameters

##### opts?

[`D3ForceLayoutOptions`](../interfaces/D3ForceLayoutOptions.md) & `LayoutOptions` = `{}`

#### Returns

`D3ForceLayout`

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

Defined in: [graph-layout-d3-force/src/D3ForceLayout.ts:131](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-force/src/D3ForceLayout.ts#L131)

Run the layout against `layer`. Resolves when the simulation settles
naturally OR is cancelled via `stop()` / a second `apply()` call.
Lifecycle events (`start` / `tick` / `end`) fire around the run.

#### Parameters

##### layer

`GraphLayer`

#### Returns

`Promise`\<`void`\>

#### Overrides

`Layout.apply`

***

### setOptions()

> **setOptions**(`patch`): `void`

Defined in: [graph-layout-d3-force/src/D3ForceLayout.ts:121](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-force/src/D3ForceLayout.ts#L121)

Merge a force-options patch (deep, so `{ charge: { strength } }` keeps the
other charge fields) and re-heat the running simulation so the change takes
effect live. Called by `Canvas.update({ layouts: { id: patch } })`.

#### Parameters

##### patch

`Partial`\<[`D3ForceLayoutOptions`](../interfaces/D3ForceLayoutOptions.md)\>

#### Returns

`void`

#### Overrides

`Layout.setOptions`

***

### stop()

> **stop**(): `void`

Defined in: [graph-layout-d3-force/src/D3ForceLayout.ts:445](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-force/src/D3ForceLayout.ts#L445)

Cancel an in-flight run. No-op when idle.

Bumps solveToken so an in-flight `animate: false` worker solve,
when it replies, is recognised as stale and dropped (its positions never
reach the store). The `animate: true` live simulation is stopped directly.
The worker itself is kept alive for reuse.

#### Returns

`void`
