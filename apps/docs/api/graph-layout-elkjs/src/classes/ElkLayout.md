# Class: ElkLayout

## Extends

- `OneShotPositionLayout`\<[`ElkLayoutOptions`](../interfaces/ElkLayoutOptions.md)\>

## Constructors

### Constructor

> **new ElkLayout**(`opts?`): `ElkLayout`

#### Parameters

##### opts?

[`ElkLayoutOptions`](../interfaces/ElkLayoutOptions.md) = `{}`

#### Returns

`ElkLayout`

#### Overrides

`OneShotPositionLayout<ElkLayoutOptions>.constructor`

## Properties

### events

> `readonly` **events**: [`EventEmitter`](../../../canvas/src/classes/EventEmitter.md)\<[`LayoutEvents`](../../../canvas/src/type-aliases/LayoutEvents.md)\>

Lifecycle event bus. See class docs for the event vocabulary.
Subclasses with richer telemetry can declare their own typed
emitter on top (`override readonly events = new EventEmitter<MyEvents>()`).

#### Inherited from

`OneShotPositionLayout.events`

***

### id

> `readonly` **id**: `string`

Stable id (registry / config key).

#### Inherited from

`OneShotPositionLayout.id`

***

### kind

> `readonly` **kind**: `"elk-layout"` = `'elk-layout'`

Stable **class kind** — a minification-safe discriminator matching the
`@invana/canvas-ui` settings-editor registry key (e.g. `'d3-force-layout'`,
`'elk-layout'`). Distinct from [id](../../../graph-layout-geometric/src/classes/GeometricLayout.md#id) (the per-instance key): all
`D3ForceLayout` instances share `kind: 'd3-force-layout'`. Concrete layouts
set it as a class field; left `undefined` on any that haven't, so consumers
fall back (e.g. to the class name). Lets domain-free tooling resolve an
instance's editor without an `instanceof` ladder.

#### Overrides

`OneShotPositionLayout.kind`

***

### opts

> `protected` **opts**: [`ElkLayoutOptions`](../interfaces/ElkLayoutOptions.md)

The live options bag. Subclasses read their own fields off this (it's the
merged result of the constructor opts and every [setOptions](#setoptions) patch),
rather than keeping a private copy — so config edits take effect.

#### Inherited from

`OneShotPositionLayout.opts`

***

### running

> `protected` **running**: `boolean`

True while a run (compute + transition) is in flight.

#### Inherited from

`OneShotPositionLayout.running`

***

### targetLayerId?

> `readonly` `optional` **targetLayerId?**: `string`

The layer this layout targets, if declared at construction.

#### Inherited from

`OneShotPositionLayout.targetLayerId`

***

### transition

> `protected` **transition**: `number` \| `boolean`

`false` | `true` (default ms) | explicit ms. See [OneShotLayoutOptions.transition](../../../graph-layout-d3-hierarchy/src/interfaces/D3HierarchyLayoutOptions.md#transition).

#### Inherited from

`OneShotPositionLayout.transition`

***

### transitionEase

> `protected` **transitionEase**: [`EasingName`](../../../canvas/src/type-aliases/EasingName.md)

Easing key for the transition. See [OneShotLayoutOptions.transitionEase](../../../graph-layout-d3-hierarchy/src/interfaces/D3HierarchyLayoutOptions.md#transitionease).

#### Inherited from

`OneShotPositionLayout.transitionEase`

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

`OneShotPositionLayout.apply`

***

### computeLayout()

> `protected` **computeLayout**(`layer`): `Promise`\<`LayoutPositions`\<`ElkExtendedEdge`[]\>\>

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

`OneShotPositionLayout.serializeDefinition`

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

`OneShotPositionLayout.setOptions`

***

### shouldPlaceNode()

> `protected` **shouldPlaceNode**(`node`): `boolean`

Whether a node should be placed by this run. Excludes explicitly-hidden
nodes unless [OneShotLayoutOptions.includeHidden](../../../graph-layout-d3-hierarchy/src/interfaces/D3HierarchyLayoutOptions.md#includehidden) is set. Subclasses
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

`OneShotPositionLayout.shouldPlaceNode`

***

### shouldTransition()

> `protected` **shouldTransition**(`_layer`): `boolean`

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

Cancel an in-flight run. Positions already written stay in the store.

#### Returns

`void`

#### Inherited from

`OneShotPositionLayout.stop`
