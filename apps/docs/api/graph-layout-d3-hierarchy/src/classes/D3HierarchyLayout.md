# Class: D3HierarchyLayout

## Extends

- `SubgraphPositionLayout`\<[`D3HierarchyLayoutOptions`](../interfaces/D3HierarchyLayoutOptions.md)\>

## Constructors

### Constructor

> **new D3HierarchyLayout**(`opts?`): `D3HierarchyLayout`

#### Parameters

##### opts?

[`D3HierarchyLayoutOptions`](../interfaces/D3HierarchyLayoutOptions.md)

#### Returns

`D3HierarchyLayout`

#### Inherited from

`SubgraphPositionLayout<D3HierarchyLayoutOptions>.constructor`

## Properties

### events

> `readonly` **events**: [`EventEmitter`](../../../canvas/src/classes/EventEmitter.md)\<[`LayoutEvents`](../../../canvas/src/type-aliases/LayoutEvents.md)\>

Lifecycle event bus. See class docs for the event vocabulary.
Subclasses with richer telemetry can declare their own typed
emitter on top (`override readonly events = new EventEmitter<MyEvents>()`).

#### Inherited from

`SubgraphPositionLayout.events`

***

### id

> `readonly` **id**: `string`

Stable id (registry / config key).

#### Inherited from

`SubgraphPositionLayout.id`

***

### kind

> `readonly` **kind**: `"d3-hierarchy-layout"` = `'d3-hierarchy-layout'`

Stable **class kind** — a minification-safe discriminator matching the
`@invana/canvas-ui` settings-editor registry key (e.g. `'d3-force-layout'`,
`'elk-layout'`). Distinct from [id](../../../graph-layout-geometric/src/classes/GeometricLayout.md#id) (the per-instance key): all
`D3ForceLayout` instances share `kind: 'd3-force-layout'`. Concrete layouts
set it as a class field; left `undefined` on any that haven't, so consumers
fall back (e.g. to the class name). Lets domain-free tooling resolve an
instance's editor without an `instanceof` ladder.

#### Overrides

`SubgraphPositionLayout.kind`

***

### opts

> `protected` **opts**: [`D3HierarchyLayoutOptions`](../interfaces/D3HierarchyLayoutOptions.md)

The live options bag. Subclasses read their own fields off this (it's the
merged result of the constructor opts and every [setOptions](#setoptions) patch),
rather than keeping a private copy — so config edits take effect.

#### Inherited from

`SubgraphPositionLayout.opts`

***

### running

> `protected` **running**: `boolean`

True while a run (compute + transition) is in flight.

#### Inherited from

[`ElkLayout`](../../../graph-layout-elkjs/src/classes/ElkLayout.md).[`running`](../../../graph-layout-elkjs/src/classes/ElkLayout.md#running)

***

### targetLayerId?

> `readonly` `optional` **targetLayerId?**: `string`

The layer this layout targets, if declared at construction.

#### Inherited from

`SubgraphPositionLayout.targetLayerId`

***

### transition

> `protected` **transition**: `number` \| `boolean`

`false` | `true` (default ms) | explicit ms. See [OneShotLayoutOptions.transition](../interfaces/D3HierarchyLayoutOptions.md#transition).

#### Inherited from

[`ElkLayout`](../../../graph-layout-elkjs/src/classes/ElkLayout.md).[`transition`](../../../graph-layout-elkjs/src/classes/ElkLayout.md#transition)

***

### transitionEase

> `protected` **transitionEase**: [`EasingName`](../../../canvas/src/type-aliases/EasingName.md)

Easing key for the transition. See [OneShotLayoutOptions.transitionEase](../interfaces/D3HierarchyLayoutOptions.md#transitionease).

#### Inherited from

[`ElkLayout`](../../../graph-layout-elkjs/src/classes/ElkLayout.md).[`transitionEase`](../../../graph-layout-elkjs/src/classes/ElkLayout.md#transitionease)

## Methods

### apply()

> **apply**(`layer`): `Promise`\<`void`\>

Run the layout against `layer`. Resolves when the run terminates
(either a natural settle or an external `stop()`).

Calling `apply()` again on the same instance must cancel any in-flight
run first.

#### Parameters

##### layer

`GraphLayer`

#### Returns

`Promise`\<`void`\>

#### Inherited from

`SubgraphPositionLayout.apply`

***

### canRecurseGroups()

> `protected` **canRecurseGroups**(): `boolean`

`pack` / `sunburst` can't be run per group: their real output is the
per-node geometry threaded through the run's `meta` (circle radii, arc
sectors), and there is no meaningful way to merge that across one run per
group. They fall back to a single flat run — an `autoFit` frame still wraps
whatever its members occupy, it just isn't packed into a box.

#### Returns

`boolean`

#### Overrides

`SubgraphPositionLayout.canRecurseGroups`

***

### computeLayout()

> `protected` **computeLayout**(`layer`): `Promise`\<`LayoutPositions`\<`unknown`\>\>

Snapshot the layer and either run the subclass once (flat) or drive the
group recursion. Subclasses normally leave this alone — override only for a
layout that needs the layer itself, and then it probably shouldn't extend
this class.

#### Parameters

##### layer

`GraphLayer`

#### Returns

`Promise`\<`LayoutPositions`\<`unknown`\>\>

#### Inherited from

`SubgraphPositionLayout.computeLayout`

***

### computeSubgraphLayout()

> `protected` **computeSubgraphLayout**(`sub`): `LayoutPositions`\<`HierarchyMeta`\>

Compute positions for one subgraph — the whole graph for a flat run, or a
single group's members when `includeGroups` nests them. The base writes the
result (snap or tween), then calls [onPositionsApplied](#onpositionsapplied) to flush any
pack / sunburst geometry. Lifecycle (`start` → `tick` → `end`) is the base's.

#### Parameters

##### sub

`LayoutSubgraph`

#### Returns

`LayoutPositions`\<`HierarchyMeta`\>

#### Overrides

`SubgraphPositionLayout.computeSubgraphLayout`

***

### onPositionsApplied()

> `protected` **onPositionsApplied**(`layer`, `meta`): `void`

Flush pack circle sizes / sunburst arc geometry onto `style.shape` once the
node positions have settled. Each in its own store batch so the renderer
sees a single coalesced flush. No-op for the position-only modes.

#### Parameters

##### layer

`GraphLayer`

##### meta

`unknown`

#### Returns

`void`

#### Overrides

`SubgraphPositionLayout.onPositionsApplied`

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

`SubgraphPositionLayout.serializeDefinition`

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

`SubgraphPositionLayout.setOptions`

***

### shouldPlaceNode()

> `protected` **shouldPlaceNode**(`node`): `boolean`

Whether a node should be placed by this run. Excludes explicitly-hidden
nodes unless [OneShotLayoutOptions.includeHidden](../interfaces/D3HierarchyLayoutOptions.md#includehidden) is set. Subclasses
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

`SubgraphPositionLayout.shouldPlaceNode`

***

### shouldTransition()

> `protected` **shouldTransition**(): `boolean`

`pack` / `sunburst` replace node *geometry* (circle sizes / arc sectors)
rather than move nodes, so tweening their positions would look wrong — snap
those. Position modes (tree / cluster / radial-*) honour `transition`.

#### Returns

`boolean`

#### Overrides

`SubgraphPositionLayout.shouldTransition`

***

### stop()

> **stop**(): `void`

Cancel an in-flight run. Positions already written stay in the store.

#### Returns

`void`

#### Inherited from

`SubgraphPositionLayout.stop`
