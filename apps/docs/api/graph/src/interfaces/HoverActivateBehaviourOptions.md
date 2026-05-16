# Interface: HoverActivateBehaviourOptions

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:53](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L53)

Constructor options for `HoverActivateBehaviour`.

## Extends

- [`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md)

## Properties

### degree?

> `optional` **degree?**: `number`

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:76](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L76)

N-hop neighbour radius. `0` = hovered element only; `1` = direct
neighbours + connecting edges; `N` = N-hop. Default `0`.

***

### direction?

> `optional` **direction?**: [`HoverDirection`](../type-aliases/HoverDirection.md)

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:79](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L79)

Direction for neighbour traversal. Default `'both'`.

***

### enable?

> `optional` **enable?**: `boolean` \| ((`element`) => `boolean`)

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:61](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L61)

Per-target enable predicate. `boolean` is a global on/off; a function
runs per pointer-over and may veto activation. Default `true`.

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:43](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/behaviours/Behaviour.ts#L43)

Default `false` — the developer explicitly enables.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`enabled`](../../../canvas/src/interfaces/BehaviourOptions.md#enabled)

***

### id

> **id**: `string`

Defined in: [canvas/src/behaviours/Behaviour.ts:36](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/behaviours/Behaviour.ts#L36)

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`id`](../../../canvas/src/interfaces/BehaviourOptions.md#id)

***

### inactiveState?

> `optional` **inactiveState?**: `string`

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:70](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L70)

State name applied to every element *not* in the active set. Leave
`undefined` to skip inactive dimming. Default `undefined`.

***

### layerId

> **layerId**: `string`

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:55](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L55)

Required — the `GraphLayer` id this behaviour drives.

#### Overrides

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`layerId`](../../../canvas/src/interfaces/BehaviourOptions.md#layerid)

***

### onHover?

> `optional` **onHover?**: (`element`) => `void`

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:133](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L133)

Fired when an element first becomes hovered.

#### Parameters

##### element

[`HoverableElement`](HoverableElement.md)

#### Returns

`void`

***

### onHoverEnd?

> `optional` **onHoverEnd?**: (`element`) => `void`

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:135](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L135)

Fired when hover ends on a previously hovered element.

#### Parameters

##### element

[`HoverableElement`](HoverableElement.md)

#### Returns

`void`

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Defined in: [canvas/src/behaviours/Behaviour.ts:49](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/behaviours/Behaviour.ts#L49)

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`shortcuts`](../../../canvas/src/interfaces/BehaviourOptions.md#shortcuts)

***

### state?

> `optional` **state?**: `string`

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:64](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L64)

Active-state name (configured on the layer). Default `'active'`.

***

### zoomedOutEdgeState?

> `optional` **zoomedOutEdgeState?**: `string`

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:108](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L108)

State name applied to connecting edges when
`camera.scale <= zoomThreshold` AND `degree > 0`. Falls back to `state`
when undefined.

***

### zoomedOutScale?

> `optional` **zoomedOutScale?**: `number`

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:130](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L130)

Gfx-transform scale multiplier applied to each hovered node (and the
N-hop neighbour nodes) when `camera.scale <= zoomThreshold`. Pure
transform write via PrimitivesRenderer.scaleShape — no geometry
rebuild, no styling change. Use this when you want the hovered node to
just *grow visually* at low zoom (so it stands out against ~1 px
background dots) while keeping its original colour, stroke, and label.

Multiplies the existing `gfx.scale`, so if `NodeSizeLODBehaviour` is
also active it will overwrite the multiplier on the next zoom frame —
prefer `zoomedOutState` with a bigger `size` in that case. For stories
without an LOD behaviour, this is the cleanest "scale on hover" knob.

Only nodes are scaled — connectors don't compose cleanly with
`gfx.scale` (the polyline would shift, not just thicken). The hovered
node's outgoing edges still anchor to its geometric position, which
sits inside the now-bigger silhouette — visually acceptable.

`undefined` (default) and `1` both disable the multiplier.

***

### zoomedOutState?

> `optional` **zoomedOutState?**: `string`

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:101](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L101)

State name applied to the hovered node + N-hop neighbour nodes when
`camera.scale <= zoomThreshold`. Falls back to `state` when undefined
(no node-side zoom swap, but edges may still swap via
`zoomedOutEdgeState`).

***

### zoomThreshold?

> `optional` **zoomThreshold?**: `number`

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:93](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L93)

Camera scale at or below which the behaviour swaps `state` for
`zoomedOutState` (and `zoomedOutEdgeState` for edges). The hovered set
gets re-painted through the swapped state names whenever the camera
crosses this threshold mid-hover. Omit (or leave both zoomed-out names
undefined) and the behaviour is identical to today.

Typical use: at world-level zoom every node collapses to ~1 anti-aliased
pixel, so the normal `active` state is invisible against background
dots. A bigger `active-far` config (size + strokeWidth bumped) makes
the hovered node pop.
