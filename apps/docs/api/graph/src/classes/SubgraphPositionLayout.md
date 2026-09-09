# Abstract Class: SubgraphPositionLayout\<TOpts\>

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

- [`OneShotPositionLayout`](OneShotPositionLayout.md)\<`TOpts`\>

## Type Parameters

### TOpts

`TOpts` *extends* [`SubgraphLayoutOptions`](../interfaces/SubgraphLayoutOptions.md) = [`SubgraphLayoutOptions`](../interfaces/SubgraphLayoutOptions.md)

## Constructors

### Constructor

> **new SubgraphPositionLayout**\<`TOpts`\>(`opts?`): `SubgraphPositionLayout`\<`TOpts`\>

#### Parameters

##### opts?

`TOpts` = `...`

#### Returns

`SubgraphPositionLayout`\<`TOpts`\>

#### Inherited from

[`OneShotPositionLayout`](OneShotPositionLayout.md).[`constructor`](OneShotPositionLayout.md#constructor)

## Properties

### events

> `readonly` **events**: [`EventEmitter`](../../../canvas/src/classes/EventEmitter.md)\<[`LayoutEvents`](../../../canvas/src/type-aliases/LayoutEvents.md)\>

Lifecycle event bus. See class docs for the event vocabulary.
Subclasses with richer telemetry can declare their own typed
emitter on top (`override readonly events = new EventEmitter<MyEvents>()`).

#### Inherited from

[`OneShotPositionLayout`](OneShotPositionLayout.md).[`events`](OneShotPositionLayout.md#events)

***

### id

> `readonly` **id**: `string`

Stable id (registry / config key).

#### Inherited from

[`OneShotPositionLayout`](OneShotPositionLayout.md).[`id`](OneShotPositionLayout.md#id)

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

[`OneShotPositionLayout`](OneShotPositionLayout.md).[`kind`](OneShotPositionLayout.md#kind)

***

### opts

> `protected` **opts**: `TOpts`

The live options bag. Subclasses read their own fields off this (it's the
merged result of the constructor opts and every [setOptions](#setoptions) patch),
rather than keeping a private copy — so config edits take effect.

#### Inherited from

[`OneShotPositionLayout`](OneShotPositionLayout.md).[`opts`](OneShotPositionLayout.md#opts)

***

### running

> `protected` **running**: `boolean` = `false`

True while a run (compute + transition) is in flight.

#### Inherited from

[`OneShotPositionLayout`](OneShotPositionLayout.md).[`running`](OneShotPositionLayout.md#running)

***

### targetLayerId?

> `readonly` `optional` **targetLayerId?**: `string`

The layer this layout targets, if declared at construction.

#### Inherited from

[`OneShotPositionLayout`](OneShotPositionLayout.md).[`targetLayerId`](OneShotPositionLayout.md#targetlayerid)

***

### transition

> `protected` **transition**: `number` \| `boolean`

`false` | `true` (default ms) | explicit ms. See [OneShotLayoutOptions.transition](../interfaces/OneShotLayoutOptions.md#transition).

#### Inherited from

[`OneShotPositionLayout`](OneShotPositionLayout.md).[`transition`](OneShotPositionLayout.md#transition)

***

### transitionEase

> `protected` **transitionEase**: [`EasingName`](../../../canvas/src/type-aliases/EasingName.md)

Easing key for the transition. See [OneShotLayoutOptions.transitionEase](../interfaces/OneShotLayoutOptions.md#transitionease).

#### Inherited from

[`OneShotPositionLayout`](OneShotPositionLayout.md).[`transitionEase`](OneShotPositionLayout.md#transitionease)

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

#### Inherited from

[`OneShotPositionLayout`](OneShotPositionLayout.md).[`apply`](OneShotPositionLayout.md#apply)

***

### canRecurseGroups()

> `protected` **canRecurseGroups**(): `boolean`

Whether this layout can be run recursively over groups **in its current
configuration**. Default `true`.

Override to veto per-mode. Two things make a layout un-recursable: output
that isn't purely positional (a mode that also assigns node *geometry* —
circle-pack radii, sunburst arcs — since the per-run `meta` carrying that
geometry can't be merged across many runs), or a topology contract the
per-group subgraph can't satisfy. Vetoing falls back to one flat run, which
still prunes collapsed members and still lets `autoFit` frames wrap their
members — it just doesn't pack them into boxes.

#### Returns

`boolean`

***

### computeLayout()

> `protected` **computeLayout**(`layer`): `Promise`\<[`LayoutPositions`](../interfaces/LayoutPositions.md)\<`unknown`\>\>

Snapshot the layer and either run the subclass once (flat) or drive the
group recursion. Subclasses normally leave this alone — override only for a
layout that needs the layer itself, and then it probably shouldn't extend
this class.

#### Parameters

##### layer

[`GraphLayer`](GraphLayer.md)

#### Returns

`Promise`\<[`LayoutPositions`](../interfaces/LayoutPositions.md)\<`unknown`\>\>

#### Overrides

[`OneShotPositionLayout`](OneShotPositionLayout.md).[`computeLayout`](OneShotPositionLayout.md#computelayout)

***

### computeSubgraphLayout()

> `abstract` `protected` **computeSubgraphLayout**(`sub`): [`LayoutPositions`](../interfaces/LayoutPositions.md)\<`unknown`\> \| `Promise`\<[`LayoutPositions`](../interfaces/LayoutPositions.md)\<`unknown`\>\>

Place `sub.ids` using `sub.edges`, returning **centre** coordinates.

Called once for a flat run, or once per group plus once for the top level
when [SubgraphLayoutOptions.includeGroups](../interfaces/SubgraphLayoutOptions.md#includegroups) is on. Implementations must
treat the subgraph as the whole world: coordinates are interpreted relative
to whatever container the run belongs to, so absolute placement (centring on
the origin, etc.) is fine and gets translated afterwards.

Return `null` to no-op the run.

#### Parameters

##### sub

[`LayoutSubgraph`](../interfaces/LayoutSubgraph.md)

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

#### Inherited from

[`OneShotPositionLayout`](OneShotPositionLayout.md).[`onPositionsApplied`](OneShotPositionLayout.md#onpositionsapplied)

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

[`OneShotPositionLayout`](OneShotPositionLayout.md).[`serializeDefinition`](OneShotPositionLayout.md#serializedefinition)

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

#### Inherited from

[`OneShotPositionLayout`](OneShotPositionLayout.md).[`setOptions`](OneShotPositionLayout.md#setoptions)

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

#### Inherited from

[`OneShotPositionLayout`](OneShotPositionLayout.md).[`shouldPlaceNode`](OneShotPositionLayout.md#shouldplacenode)

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

#### Inherited from

[`OneShotPositionLayout`](OneShotPositionLayout.md).[`shouldTransition`](OneShotPositionLayout.md#shouldtransition)

***

### stop()

> **stop**(): `void`

Cancel an in-flight run. Positions already written stay in the store.

#### Returns

`void`

#### Inherited from

[`OneShotPositionLayout`](OneShotPositionLayout.md).[`stop`](OneShotPositionLayout.md#stop)
