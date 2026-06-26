# Class: D3HierarchyLayout

Defined in: [graph-layout-d3-hierarchy/src/D3HierarchyLayout.ts:74](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-hierarchy/src/D3HierarchyLayout.ts#L74)

## Extends

- `OneShotPositionLayout`\<[`D3HierarchyLayoutOptions`](../interfaces/D3HierarchyLayoutOptions.md)\>

## Constructors

### Constructor

> **new D3HierarchyLayout**(`opts?`): `D3HierarchyLayout`

Defined in: graph/dist/index.d.ts:2752

#### Parameters

##### opts?

[`D3HierarchyLayoutOptions`](../interfaces/D3HierarchyLayoutOptions.md)

#### Returns

`D3HierarchyLayout`

#### Inherited from

`OneShotPositionLayout<D3HierarchyLayoutOptions>.constructor`

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

> `protected` **opts**: [`D3HierarchyLayoutOptions`](../interfaces/D3HierarchyLayoutOptions.md)

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

[`ElkLayout`](../../../graph-layout-elkjs/src/classes/ElkLayout.md).[`running`](../../../graph-layout-elkjs/src/classes/ElkLayout.md#running)

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

`false` | `true` (default ms) | explicit ms. See [OneShotLayoutOptions.transition](../interfaces/D3HierarchyLayoutOptions.md#transition).

#### Inherited from

[`ElkLayout`](../../../graph-layout-elkjs/src/classes/ElkLayout.md).[`transition`](../../../graph-layout-elkjs/src/classes/ElkLayout.md#transition)

***

### transitionEase

> `protected` **transitionEase**: `EasingName`

Defined in: graph/dist/index.d.ts:2741

Easing key for the transition. See [OneShotLayoutOptions.transitionEase](../interfaces/D3HierarchyLayoutOptions.md#transitionease).

#### Inherited from

[`ElkLayout`](../../../graph-layout-elkjs/src/classes/ElkLayout.md).[`transitionEase`](../../../graph-layout-elkjs/src/classes/ElkLayout.md#transitionease)

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

> `protected` **computeLayout**(`layer`): `LayoutPositions`\<`HierarchyMeta`\>

Defined in: [graph-layout-d3-hierarchy/src/D3HierarchyLayout.ts:90](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-hierarchy/src/D3HierarchyLayout.ts#L90)

Compute positions for the whole snapshot in one pass. The base writes them
(snap or tween), then calls [onPositionsApplied](#onpositionsapplied) to flush any pack /
sunburst geometry. Lifecycle (`start` → `tick` → `end`) is owned by the base.

#### Parameters

##### layer

`GraphLayer`

#### Returns

`LayoutPositions`\<`HierarchyMeta`\>

#### Overrides

`OneShotPositionLayout.computeLayout`

***

### onPositionsApplied()

> `protected` **onPositionsApplied**(`layer`, `meta`): `void`

Defined in: [graph-layout-d3-hierarchy/src/D3HierarchyLayout.ts:303](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-hierarchy/src/D3HierarchyLayout.ts#L303)

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

> `protected` **shouldTransition**(): `boolean`

Defined in: [graph-layout-d3-hierarchy/src/D3HierarchyLayout.ts:80](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-hierarchy/src/D3HierarchyLayout.ts#L80)

`pack` / `sunburst` replace node *geometry* (circle sizes / arc sectors)
rather than move nodes, so tweening their positions would look wrong — snap
those. Position modes (tree / cluster / radial-*) honour `transition`.

#### Returns

`boolean`

#### Overrides

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
