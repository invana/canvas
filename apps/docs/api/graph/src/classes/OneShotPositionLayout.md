# Abstract Class: OneShotPositionLayout\<TOpts\>

Defined in: [graph/src/layout/OneShotPositionLayout.ts:74](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layout/OneShotPositionLayout.ts#L74)

Base class for **one-shot** layouts — those that compute a final position for
every node in a single pass (ELK, d3-hierarchy trees/dendrograms, grid, snake,
circular, radial, …), as opposed to iterative simulations like
`D3ForceLayout` that paint their own per-tick evolution.

It owns the parts every one-shot layout shares, so subclasses don't re-implement
them:

 - the serializable `transition` / `transitionEase` options;
 - **snap-or-tween**: writing the computed positions straight to the store, or
   gliding each node from its current spot to the target via the engine's
   animatePositions helper;
 - **cancellation**: a run-token + in-flight-transition handle so a re-`apply()`
   (or `stop()`) aborts the previous run/transition cleanly and the next run
   starts from wherever the nodes currently are;
 - the uniform `start` / `tick` / `end` lifecycle (so `fitContent`-on-`end`
   fires at the same moment — after the transition settles — for all of them).

Subclasses implement [computeLayout](#computelayout) (produce the target positions) and
may override [onPositionsApplied](#onpositionsapplied) (e.g. write computed edge geometry once
the nodes have landed).

## Extends

- `Layout`\<[`GraphLayer`](GraphLayer.md)\>

## Type Parameters

### TOpts

`TOpts` *extends* [`OneShotLayoutOptions`](../interfaces/OneShotLayoutOptions.md) = [`OneShotLayoutOptions`](../interfaces/OneShotLayoutOptions.md)

## Constructors

### Constructor

> **new OneShotPositionLayout**\<`TOpts`\>(`opts?`): `OneShotPositionLayout`\<`TOpts`\>

Defined in: [graph/src/layout/OneShotPositionLayout.ts:99](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layout/OneShotPositionLayout.ts#L99)

#### Parameters

##### opts?

`TOpts` = `...`

#### Returns

`OneShotPositionLayout`\<`TOpts`\>

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

[`D3ForceLayout`](../../../graph-layout-d3-force/src/classes/D3ForceLayout.md).[`events`](../../../graph-layout-d3-force/src/classes/D3ForceLayout.md#events)

***

### id

> `readonly` **id**: `string`

Defined in: canvas/dist/index.d.ts:1868

Stable id (registry / config key).

#### Inherited from

[`D3ForceLayout`](../../../graph-layout-d3-force/src/classes/D3ForceLayout.md).[`id`](../../../graph-layout-d3-force/src/classes/D3ForceLayout.md#id)

***

### opts

> `protected` **opts**: `TOpts`

Defined in: [graph/src/layout/OneShotPositionLayout.ts:82](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layout/OneShotPositionLayout.ts#L82)

The live options bag. Subclasses read their own fields off this (it's the
merged result of the constructor opts and every [setOptions](#setoptions) patch),
rather than keeping a private copy — so config edits take effect.

***

### running

> `protected` **running**: `boolean` = `false`

Defined in: [graph/src/layout/OneShotPositionLayout.ts:91](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layout/OneShotPositionLayout.ts#L91)

True while a run (compute + transition) is in flight.

***

### targetLayerId?

> `readonly` `optional` **targetLayerId?**: `string`

Defined in: canvas/dist/index.d.ts:1870

The layer this layout targets, if declared at construction.

#### Inherited from

[`D3ForceLayout`](../../../graph-layout-d3-force/src/classes/D3ForceLayout.md).[`targetLayerId`](../../../graph-layout-d3-force/src/classes/D3ForceLayout.md#targetlayerid)

***

### transition

> `protected` **transition**: `number` \| `boolean`

Defined in: [graph/src/layout/OneShotPositionLayout.ts:84](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layout/OneShotPositionLayout.ts#L84)

`false` | `true` (default ms) | explicit ms. See [OneShotLayoutOptions.transition](../interfaces/OneShotLayoutOptions.md#transition).

***

### transitionEase

> `protected` **transitionEase**: `EasingName`

Defined in: [graph/src/layout/OneShotPositionLayout.ts:86](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layout/OneShotPositionLayout.ts#L86)

Easing key for the transition. See [OneShotLayoutOptions.transitionEase](../interfaces/OneShotLayoutOptions.md#transitionease).

## Methods

### apply()

> **apply**(`layer`): `Promise`\<`void`\>

Defined in: [graph/src/layout/OneShotPositionLayout.ts:151](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layout/OneShotPositionLayout.ts#L151)

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

`Layout.apply`

***

### computeLayout()

> `abstract` `protected` **computeLayout**(`layer`): [`LayoutPositions`](../interfaces/LayoutPositions.md)\<`unknown`\> \| `Promise`\<[`LayoutPositions`](../interfaces/LayoutPositions.md)\<`unknown`\>\>

Defined in: [graph/src/layout/OneShotPositionLayout.ts:128](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layout/OneShotPositionLayout.ts#L128)

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

Defined in: [graph/src/layout/OneShotPositionLayout.ts:137](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layout/OneShotPositionLayout.ts#L137)

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

### setOptions()

> **setOptions**(`patch`): `void`

Defined in: [graph/src/layout/OneShotPositionLayout.ts:114](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layout/OneShotPositionLayout.ts#L114)

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

`Layout.setOptions`

***

### shouldTransition()

> `protected` **shouldTransition**(`_layer`): `boolean`

Defined in: [graph/src/layout/OneShotPositionLayout.ts:147](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layout/OneShotPositionLayout.ts#L147)

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

Defined in: [graph/src/layout/OneShotPositionLayout.ts:183](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layout/OneShotPositionLayout.ts#L183)

Cancel an in-flight run. Positions already written stay in the store.

#### Returns

`void`
