# Class: GeometricLayout

Defined in: [graph-layout-geometric/src/GeometricLayout.ts:25](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-geometric/src/GeometricLayout.ts#L25)

## Extends

- `OneShotPositionLayout`\<[`GeometricLayoutOptions`](../interfaces/GeometricLayoutOptions.md)\>

## Constructors

### Constructor

> **new GeometricLayout**(`opts?`): `GeometricLayout`

Defined in: graph/dist/index.d.ts:2752

#### Parameters

##### opts?

[`GeometricLayoutOptions`](../interfaces/GeometricLayoutOptions.md)

#### Returns

`GeometricLayout`

#### Inherited from

`OneShotPositionLayout<GeometricLayoutOptions>.constructor`

## Properties

### events

> `readonly` **events**: `EventEmitter`\<`LayoutEvents`\>

Defined in: canvas/dist/index.d.ts:1876

Lifecycle event bus. See class docs for the event vocabulary.
Subclasses with richer telemetry can declare their own typed
emitter on top (`override readonly events = new EventEmitter<MyEvents>()`).

#### Inherited from

`OneShotPositionLayout.events`

***

### id

> `readonly` **id**: `string`

Defined in: canvas/dist/index.d.ts:1868

Stable id (registry / config key).

#### Inherited from

`OneShotPositionLayout.id`

***

### opts

> `protected` **opts**: [`GeometricLayoutOptions`](../interfaces/GeometricLayoutOptions.md)

Defined in: graph/dist/index.d.ts:2737

The live options bag. Subclasses read their own fields off this (it's the
merged result of the constructor opts and every [setOptions](#setoptions) patch),
rather than keeping a private copy — so config edits take effect.

#### Inherited from

`OneShotPositionLayout.opts`

***

### running

> `protected` **running**: `boolean`

Defined in: graph/dist/index.d.ts:2745

True while a run (compute + transition) is in flight.

#### Inherited from

`OneShotPositionLayout.running`

***

### targetLayerId?

> `readonly` `optional` **targetLayerId?**: `string`

Defined in: canvas/dist/index.d.ts:1870

The layer this layout targets, if declared at construction.

#### Inherited from

`OneShotPositionLayout.targetLayerId`

***

### transition

> `protected` **transition**: `number` \| `boolean`

Defined in: graph/dist/index.d.ts:2739

`false` | `true` (default ms) | explicit ms. See [OneShotLayoutOptions.transition](../../../graph-layout-d3-hierarchy/src/interfaces/D3HierarchyLayoutOptions.md#transition).

#### Inherited from

`OneShotPositionLayout.transition`

***

### transitionEase

> `protected` **transitionEase**: `EasingName`

Defined in: graph/dist/index.d.ts:2741

Easing key for the transition. See [OneShotLayoutOptions.transitionEase](../../../graph-layout-d3-hierarchy/src/interfaces/D3HierarchyLayoutOptions.md#transitionease).

#### Inherited from

`OneShotPositionLayout.transitionEase`

## Methods

### apply()

> **apply**(`layer`): `Promise`\<`void`\>

Defined in: graph/dist/index.d.ts:2785

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

`OneShotPositionLayout.apply`

***

### computeLayout()

> `protected` **computeLayout**(`layer`): `LayoutPositions`\<`unknown`\>

Defined in: [graph-layout-geometric/src/GeometricLayout.ts:26](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-geometric/src/GeometricLayout.ts#L26)

Compute the target position for every node this layout places. Called once
per `apply()`. May be async (e.g. ELK). Return `null` / empty `ids` to no-op.

Implementations only compute — the base writes the result (snap or tween),
manages cancellation, and fires the lifecycle.

#### Parameters

##### layer

`GraphLayer`

#### Returns

`LayoutPositions`\<`unknown`\>

#### Overrides

`OneShotPositionLayout.computeLayout`

***

### onPositionsApplied()

> `protected` **onPositionsApplied**(`_layer`, `_meta`): `void`

Defined in: graph/dist/index.d.ts:2777

Hook run once the node positions have settled (immediately when snapping,
or after the transition completes), before `tick` / `end`. `meta` is the
payload [computeLayout](#computelayout) returned for this run. Override to write
derived geometry that depends on final positions — e.g. ELK edge routing,
pack sizes, sunburst arcs. Default no-op.

#### Parameters

##### \_layer

`GraphLayer`

##### \_meta

`unknown`

#### Returns

`void`

#### Inherited from

`OneShotPositionLayout.onPositionsApplied`

***

### setOptions()

> **setOptions**(`patch`): `void`

Defined in: graph/dist/index.d.ts:2761

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

`OneShotPositionLayout.setOptions`

***

### shouldTransition()

> `protected` **shouldTransition**(`_layer`): `boolean`

Defined in: graph/dist/index.d.ts:2784

Whether this run should animate (vs snap), on top of the `transition`
option. Defaults to `true`. Override to veto for runs whose output isn't a
pure position move — e.g. a mode that replaces node *geometry* (circle-pack
sizes, sunburst arcs) where tweening the positions would look wrong.

#### Parameters

##### \_layer

`GraphLayer`

#### Returns

`boolean`

#### Inherited from

`OneShotPositionLayout.shouldTransition`

***

### stop()

> **stop**(): `void`

Defined in: graph/dist/index.d.ts:2787

Cancel an in-flight run. Positions already written stay in the store.

#### Returns

`void`

#### Inherited from

`OneShotPositionLayout.stop`
