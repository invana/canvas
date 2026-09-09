# Class: D3ForceLayout

## Extends

- [`Layout`](../../../canvas/src/classes/Layout.md)\<`GraphLayer`\>

## Constructors

### Constructor

> **new D3ForceLayout**(`opts?`): `D3ForceLayout`

#### Parameters

##### opts?

[`D3ForceLayoutOptions`](../interfaces/D3ForceLayoutOptions.md) & [`LayoutOptions`](../../../canvas/src/interfaces/LayoutOptions.md) = `{}`

#### Returns

`D3ForceLayout`

#### Overrides

[`Layout`](../../../canvas/src/classes/Layout.md).[`constructor`](../../../canvas/src/classes/Layout.md#constructor)

## Properties

### events

> `readonly` **events**: [`EventEmitter`](../../../canvas/src/classes/EventEmitter.md)\<[`LayoutEvents`](../../../canvas/src/type-aliases/LayoutEvents.md)\>

Lifecycle event bus. See class docs for the event vocabulary.
Subclasses with richer telemetry can declare their own typed
emitter on top (`override readonly events = new EventEmitter<MyEvents>()`).

#### Inherited from

[`Layout`](../../../canvas/src/classes/Layout.md).[`events`](../../../canvas/src/classes/Layout.md#events)

***

### id

> `readonly` **id**: `string`

Stable id (registry / config key).

#### Inherited from

[`Layout`](../../../canvas/src/classes/Layout.md).[`id`](../../../canvas/src/classes/Layout.md#id)

***

### kind

> `readonly` **kind**: `"d3-force-layout"` = `'d3-force-layout'`

Stable **class kind** — a minification-safe discriminator matching the
`@invana/canvas-ui` settings-editor registry key (e.g. `'d3-force-layout'`,
`'elk-layout'`). Distinct from [id](../../../graph-layout-geometric/src/classes/GeometricLayout.md#id) (the per-instance key): all
`D3ForceLayout` instances share `kind: 'd3-force-layout'`. Concrete layouts
set it as a class field; left `undefined` on any that haven't, so consumers
fall back (e.g. to the class name). Lets domain-free tooling resolve an
instance's editor without an `instanceof` ladder.

#### Overrides

[`Layout`](../../../canvas/src/classes/Layout.md).[`kind`](../../../canvas/src/classes/Layout.md#kind)

***

### targetLayerId?

> `readonly` `optional` **targetLayerId?**: `string`

The layer this layout targets, if declared at construction.

#### Inherited from

[`Layout`](../../../canvas/src/classes/Layout.md).[`targetLayerId`](../../../canvas/src/classes/Layout.md#targetlayerid)

## Methods

### apply()

> **apply**(`layer`): `Promise`\<`void`\>

Run the layout against `layer`. Resolves when the simulation settles
naturally OR is cancelled via `stop()` / a second `apply()` call.
Lifecycle events (`start` / `tick` / `end`) fire around the run.

#### Parameters

##### layer

`GraphLayer`

#### Returns

`Promise`\<`void`\>

#### Overrides

[`Layout`](../../../canvas/src/classes/Layout.md).[`apply`](../../../canvas/src/classes/Layout.md#apply)

***

### getOptions()

> **getOptions**(): `Readonly`\<[`D3ForceLayoutOptions`](../interfaces/D3ForceLayoutOptions.md)\>

Snapshot of the current (merged) force options — seeds a settings editor.

#### Returns

`Readonly`\<[`D3ForceLayoutOptions`](../interfaces/D3ForceLayoutOptions.md)\>

***

### serializeDefinition()

> **serializeDefinition**(): `Record`\<`string`, `unknown`\>

Contribute this layout's serialisable config to a canvas-state snapshot (the
engine's `DefinitionSerializable` contract). The base captures the wiring
`targetLayerId`; iterative layouts holding tunable params (e.g. force
strengths) should override and spread `super.serializeDefinition()` with a
JSON-safe copy of those params.

#### Returns

`Record`\<`string`, `unknown`\>

#### Inherited from

[`Layout`](../../../canvas/src/classes/Layout.md).[`serializeDefinition`](../../../canvas/src/classes/Layout.md#serializedefinition)

***

### setOptions()

> **setOptions**(`patch`): `void`

Merge a force-options patch (deep, so `{ charge: { strength } }` keeps the
other charge fields) and re-run the simulation so the change takes effect
live — including a switch of `animate` (live ⇄ static) or a re-heat while the
graph sits idle after its first settle. Re-applies whenever the layout has a
layer to run against (`lastLayer`), matching the one-shot layouts; before the
first `apply()` there's nothing to re-run, so it just stores the patch.
Called by `Canvas.update({ layouts: { id: patch } })`.

#### Parameters

##### patch

`Partial`\<[`D3ForceLayoutOptions`](../interfaces/D3ForceLayoutOptions.md)\>

#### Returns

`void`

#### Overrides

[`Layout`](../../../canvas/src/classes/Layout.md).[`setOptions`](../../../canvas/src/classes/Layout.md#setoptions)

***

### stop()

> **stop**(): `void`

Cancel an in-flight run. No-op when idle.

Bumps solveToken so an in-flight `animate: false` worker solve,
when it replies, is recognised as stale and dropped (its positions never
reach the store). The `animate: true` live simulation is stopped directly.
The worker itself is kept alive for reuse.

#### Returns

`void`
