# Abstract Class: Layout\<TLayer\>

## Type Parameters

### TLayer

`TLayer` *extends* [`Layer`](Layer.md)\<`any`, `any`, `any`, `any`\> = [`Layer`](Layer.md)\<`any`, `any`, `any`, `any`\>

## Constructors

### Constructor

> **new Layout**\<`TLayer`\>(`opts?`): `Layout`\<`TLayer`\>

#### Parameters

##### opts?

[`LayoutOptions`](../interfaces/LayoutOptions.md) = `{}`

#### Returns

`Layout`\<`TLayer`\>

## Properties

### events

> `readonly` **events**: [`EventEmitter`](EventEmitter.md)\<[`LayoutEvents`](../type-aliases/LayoutEvents.md)\>

Lifecycle event bus. See class docs for the event vocabulary.
Subclasses with richer telemetry can declare their own typed
emitter on top (`override readonly events = new EventEmitter<MyEvents>()`).

***

### id

> `readonly` **id**: `string`

Stable id (registry / config key).

***

### kind?

> `readonly` `optional` **kind?**: `string`

Stable **class kind** — a minification-safe discriminator matching the
`@invana/canvas-ui` settings-editor registry key (e.g. `'d3-force-layout'`,
`'elk-layout'`). Distinct from [id](#id) (the per-instance key): all
`D3ForceLayout` instances share `kind: 'd3-force-layout'`. Concrete layouts
set it as a class field; left `undefined` on any that haven't, so consumers
fall back (e.g. to the class name). Lets domain-free tooling resolve an
instance's editor without an `instanceof` ladder.

***

### targetLayerId?

> `readonly` `optional` **targetLayerId?**: `string`

The layer this layout targets, if declared at construction.

## Methods

### apply()

> `abstract` **apply**(`layer`): `Promise`\<`void`\>

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

### serializeDefinition()

> **serializeDefinition**(): `Record`\<`string`, `unknown`\>

Contribute this layout's serialisable config to a canvas-state snapshot (the
engine's `DefinitionSerializable` contract). The base captures the wiring
`targetLayerId`; iterative layouts holding tunable params (e.g. force
strengths) should override and spread `super.serializeDefinition()` with a
JSON-safe copy of those params.

#### Returns

`Record`\<`string`, `unknown`\>

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
