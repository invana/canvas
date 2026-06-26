# Class: ElkLayout

Defined in: [graph-layout-elkjs/src/ElkLayout.ts:65](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-elkjs/src/ElkLayout.ts#L65)

## Extends

- `OneShotPositionLayout`\<[`ElkLayoutOptions`](../interfaces/ElkLayoutOptions.md)\>

## Constructors

### Constructor

> **new ElkLayout**(`opts?`): `ElkLayout`

Defined in: [graph-layout-elkjs/src/ElkLayout.ts:75](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-elkjs/src/ElkLayout.ts#L75)

#### Parameters

##### opts?

[`ElkLayoutOptions`](../interfaces/ElkLayoutOptions.md) = `{}`

#### Returns

`ElkLayout`

#### Overrides

`OneShotPositionLayout<ElkLayoutOptions>.constructor`

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

> `protected` **opts**: [`ElkLayoutOptions`](../interfaces/ElkLayoutOptions.md)

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

> `protected` **computeLayout**(`layer`): `Promise`\<`LayoutPositions`\<`ElkExtendedEdge`[]\>\>

Defined in: [graph-layout-elkjs/src/ElkLayout.ts:119](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-elkjs/src/ElkLayout.ts#L119)

Snapshot the store, run ELK (async), and return centre-converted positions.
The base writes them (snap or glide per `transition`) and then calls
[onPositionsApplied](#onpositionsapplied) with the routed edges. A throw here is surfaced
by the base (emits `end`, rejects the awaited `apply()`); a run superseded
while ELK was in flight is dropped by the base's staleness check.

#### Parameters

##### layer

`GraphLayer`

#### Returns

`Promise`\<`LayoutPositions`\<`ElkExtendedEdge`[]\>\>

#### Overrides

`OneShotPositionLayout.computeLayout`

***

### onPositionsApplied()

> `protected` **onPositionsApplied**(`layer`, `meta`): `void`

Defined in: [graph-layout-elkjs/src/ElkLayout.ts:183](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-elkjs/src/ElkLayout.ts#L183)

When ELK edge routing is on, read back each edge's computed bend points and
write them as `style.shape.waypoints` (pathType 'orth') — once node positions
have settled, in their own flush.

This must NOT share a flush with the position write: a position flush marks
every incident connector dirty and re-routes them via a plain
`updateConnector(id, {})` at flush end; bundling the waypoint write into that
same flush lets that re-route run alongside the waypoint-applying `edge:update`,
and the routed path doesn't stick. A separate flush (no concurrent node moves)
mirrors the hover/`rerenderEdge` path that applies cleanly.

ELK works in the same coordinate frame as the stored centres, and — for
centre-origin shapes (circle, and `composite` via GraphLayer's centre-fit) —
the rendered node occupies exactly ELK's node box, so bend points line up with
the cards without any per-edge offset.

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
