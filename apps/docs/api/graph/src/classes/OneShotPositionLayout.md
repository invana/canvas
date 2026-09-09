# Abstract Class: OneShotPositionLayout\<TOpts\>

Base class for **one-shot** layouts — those that compute a final position for
every node in a single pass (ELK, d3-hierarchy trees/dendrograms, grid, snake,
circular, radial, …), as opposed to iterative simulations like
`D3ForceLayout` that paint their own per-tick evolution.

It owns the parts every one-shot layout shares, so subclasses don't re-implement
them:

 - the serializable `transition` / `transitionEase` options;
 - **snap-or-tween**: writing the computed positions straight to the store, or
   gliding each node from its current spot to the target via the engine's
   [animatePositions](../../../canvas/src/functions/animatePositions.md) helper;
 - **cancellation**: a run-token + in-flight-transition handle so a re-`apply()`
   (or `stop()`) aborts the previous run/transition cleanly and the next run
   starts from wherever the nodes currently are;
 - the uniform `start` / `tick` / `end` lifecycle (so `fitContent`-on-`end`
   fires at the same moment — after the transition settles — for all of them).

Subclasses implement [computeLayout](#computelayout) (produce the target positions) and
may override [onPositionsApplied](#onpositionsapplied) (e.g. write computed edge geometry once
the nodes have landed).

## Extends

- [`Layout`](../../../canvas/src/classes/Layout.md)\<[`GraphLayer`](GraphLayer.md)\>

## Extended by

- [`SubgraphPositionLayout`](SubgraphPositionLayout.md)

## Type Parameters

### TOpts

`TOpts` *extends* [`OneShotLayoutOptions`](../interfaces/OneShotLayoutOptions.md) = [`OneShotLayoutOptions`](../interfaces/OneShotLayoutOptions.md)

## Constructors

### Constructor

> **new OneShotPositionLayout**\<`TOpts`\>(`opts?`): `OneShotPositionLayout`\<`TOpts`\>

#### Parameters

##### opts?

`TOpts` = `...`

#### Returns

`OneShotPositionLayout`\<`TOpts`\>

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

### kind?

> `readonly` `optional` **kind?**: `string`

Stable **class kind** — a minification-safe discriminator matching the
`@invana/canvas-ui` settings-editor registry key (e.g. `'d3-force-layout'`,
`'elk-layout'`). Distinct from [id](../../../graph-layout-geometric/src/classes/GeometricLayout.md#id) (the per-instance key): all
`D3ForceLayout` instances share `kind: 'd3-force-layout'`. Concrete layouts
set it as a class field; left `undefined` on any that haven't, so consumers
fall back (e.g. to the class name). Lets domain-free tooling resolve an
instance's editor without an `instanceof` ladder.

#### Inherited from

[`Layout`](../../../canvas/src/classes/Layout.md).[`kind`](../../../canvas/src/classes/Layout.md#kind)

***

### opts

> `protected` **opts**: `TOpts`

The live options bag. Subclasses read their own fields off this (it's the
merged result of the constructor opts and every [setOptions](#setoptions) patch),
rather than keeping a private copy — so config edits take effect.

***

### running

> `protected` **running**: `boolean` = `false`

True while a run (compute + transition) is in flight.

***

### targetLayerId?

> `readonly` `optional` **targetLayerId?**: `string`

The layer this layout targets, if declared at construction.

#### Inherited from

[`Layout`](../../../canvas/src/classes/Layout.md).[`targetLayerId`](../../../canvas/src/classes/Layout.md#targetlayerid)

***

### transition

> `protected` **transition**: `number` \| `boolean`

`false` | `true` (default ms) | explicit ms. See [OneShotLayoutOptions.transition](../interfaces/OneShotLayoutOptions.md#transition).

***

### transitionEase

> `protected` **transitionEase**: [`EasingName`](../../../canvas/src/type-aliases/EasingName.md)

Easing key for the transition. See [OneShotLayoutOptions.transitionEase](../interfaces/OneShotLayoutOptions.md#transitionease).

## Methods

### apply()

> **apply**(`layer`): `Promise`\<`void`\>

Run the layout against `layer`. Resolves when the run terminates
(either a natural settle or an external `stop()`).

Calling `apply()` again on the same instance must cancel any in-flight
run first.

#### Parameters

##### layer

[`GraphLayer`](GraphLayer.md)

#### Returns

`Promise`\<`void`\>

#### Overrides

[`Layout`](../../../canvas/src/classes/Layout.md).[`apply`](../../../canvas/src/classes/Layout.md#apply)

***

### computeLayout()

> `abstract` `protected` **computeLayout**(`layer`): [`LayoutPositions`](../interfaces/LayoutPositions.md)\<`unknown`\> \| `Promise`\<[`LayoutPositions`](../interfaces/LayoutPositions.md)\<`unknown`\>\>

Compute the target position for every node this layout places. Called once
per `apply()`. May be async (e.g. ELK). Return `null` / empty `ids` to no-op.

Implementations only compute — the base writes the result (snap or tween),
manages cancellation, and fires the lifecycle.

#### Parameters

##### layer

[`GraphLayer`](GraphLayer.md)

#### Returns

[`LayoutPositions`](../interfaces/LayoutPositions.md)\<`unknown`\> \| `Promise`\<[`LayoutPositions`](../interfaces/LayoutPositions.md)\<`unknown`\>\>

***

### onPositionsApplied()

> `protected` **onPositionsApplied**(`_layer`, `_meta`): `void`

Hook run once the node positions have settled (immediately when snapping,
or after the transition completes), before `tick` / `end`. `meta` is the
payload [computeLayout](#computelayout) returned for this run. Override to write
derived geometry that depends on final positions — e.g. ELK edge routing,
pack sizes, sunburst arcs. Default no-op.

#### Parameters

##### \_layer

[`GraphLayer`](GraphLayer.md)

##### \_meta

`unknown`

#### Returns

`void`

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

Live-reconfigure. Called by `Canvas.update({ layouts: { id: patch } })` (and
once at init with the `config.layouts[id]` slice). Merges the patch into
[opts](#opts), re-derives the transition settings, and — if the layout has
already run against a layer — re-applies so the change shows immediately
(the one-shot analog of `D3ForceLayout` re-heating its simulation). Before
the first `apply()` it just records the options (no premature run).

#### Parameters

##### patch

`Partial`\<`TOpts`\>

#### Returns

`void`

#### Overrides

[`Layout`](../../../canvas/src/classes/Layout.md).[`setOptions`](../../../canvas/src/classes/Layout.md#setoptions)

***

### shouldPlaceNode()

> `protected` **shouldPlaceNode**(`node`): `boolean`

Whether a node should be placed by this run. Excludes explicitly-hidden
nodes unless [OneShotLayoutOptions.includeHidden](../interfaces/OneShotLayoutOptions.md#includehidden) is set. Subclasses
call this while snapshotting `layer.store.nodes()` so hidden nodes stay
frozen at their last positions. Edges incident to a skipped node should be
dropped from the layout graph too (both endpoints must be placeable).

#### Parameters

##### node

###### hidden?

`boolean`

#### Returns

`boolean`

***

### shouldTransition()

> `protected` **shouldTransition**(`_layer`): `boolean`

Whether this run should animate (vs snap), on top of the `transition`
option. Defaults to `true`. Override to veto for runs whose output isn't a
pure position move — e.g. a mode that replaces node *geometry* (circle-pack
sizes, sunburst arcs) where tweening the positions would look wrong.

#### Parameters

##### \_layer

[`GraphLayer`](GraphLayer.md)

#### Returns

`boolean`

***

### stop()

> **stop**(): `void`

Cancel an in-flight run. Positions already written stay in the store.

#### Returns

`void`
