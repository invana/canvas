# Class: D3SankeyLayout

## Extends

- [`Layout`](../../../canvas/src/classes/Layout.md)\<`GraphLayer`\>

## Constructors

### Constructor

> **new D3SankeyLayout**(`opts?`): `D3SankeyLayout`

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

> `readonly` **kind**: `"d3-sankey-layout"` = `'d3-sankey-layout'`

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

Run the layout against `layer`. Resolves once positions and per-edge
hints have been written. Lifecycle events fire in order:
`start` → `tick` (once) → `end`.

#### Parameters

##### layer

`GraphLayer`

#### Returns

`Promise`\<`void`\>

#### Overrides

[`Layout`](../../../canvas/src/classes/Layout.md).[`apply`](../../../canvas/src/classes/Layout.md#apply)

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

> **setOptions**(`_patch`): `void`

Live-reconfigure. Called by `Canvas.update({ layouts: { id: patch } })`.
Default no-op; iterative layouts (e.g. `D3ForceLayout`) override to merge
the patch and re-heat a running simulation.

#### Parameters

##### \_patch

`unknown`

#### Returns

`void`

#### Inherited from

[`Layout`](../../../canvas/src/classes/Layout.md).[`setOptions`](../../../canvas/src/classes/Layout.md#setoptions)

***

### stop()

> **stop**(): `void`

Cancel a run. The synchronous body of `apply()` rarely yields long
 enough for this to fire, but it keeps the contract symmetric with
 iterative layouts.

#### Returns

`void`
