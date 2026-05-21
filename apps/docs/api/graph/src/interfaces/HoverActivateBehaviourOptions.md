# Interface: HoverActivateBehaviourOptions

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:57](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L57)

Constructor options for `HoverActivateBehaviour`.

## Extends

- [`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md)

## Properties

### degree?

> `optional` **degree?**: `number`

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:86](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L86)

N-hop neighbour radius. `0` = hovered element only; `1` = direct
neighbours + connecting edges; `N` = N-hop. Default `0`.

***

### direction?

> `optional` **direction?**: [`HoverDirection`](../type-aliases/HoverDirection.md)

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:89](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L89)

Direction for neighbour traversal. Default `'both'`.

***

### enable?

> `optional` **enable?**: `boolean` \| ((`element`) => `boolean`)

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:65](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L65)

Per-target enable predicate. `boolean` is a global on/off; a function
runs per pointer-over and may veto activation. Default `true`.

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [canvas/src/behaviours/Behaviour.ts:43](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/Behaviour.ts#L43)

Default `false` — the developer explicitly enables.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`enabled`](../../../canvas/src/interfaces/BehaviourOptions.md#enabled)

***

### id

> **id**: `string`

Defined in: [canvas/src/behaviours/Behaviour.ts:36](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/Behaviour.ts#L36)

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`id`](../../../canvas/src/interfaces/BehaviourOptions.md#id)

***

### inactiveState?

> `optional` **inactiveState?**: `string`

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:80](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L80)

State name applied to every element *not* in the active set. Leave
`undefined` to skip inactive dimming. Default `undefined`.

***

### layerId

> **layerId**: `string`

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:59](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L59)

Required — the `GraphLayer` id this behaviour drives.

#### Overrides

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`layerId`](../../../canvas/src/interfaces/BehaviourOptions.md#layerid)

***

### onHover?

> `optional` **onHover?**: (`element`) => `void`

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:143](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L143)

Fired when an element first becomes hovered.

#### Parameters

##### element

[`HoverableElement`](HoverableElement.md)

#### Returns

`void`

***

### onHoverEnd?

> `optional` **onHoverEnd?**: (`element`) => `void`

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:145](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L145)

Fired when hover ends on a previously hovered element.

#### Parameters

##### element

[`HoverableElement`](HoverableElement.md)

#### Returns

`void`

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Defined in: [canvas/src/behaviours/Behaviour.ts:49](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/behaviours/Behaviour.ts#L49)

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`shortcuts`](../../../canvas/src/interfaces/BehaviourOptions.md#shortcuts)

***

### state?

> `optional` **state?**: `string`

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:74](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L74)

State name applied to the hovered focal element (and its N-hop
neighbours when `degree > 0`). Default `'hovered'` — matches the
canonical state catalogue auto-merged into every `GraphLayer`. Pass
a custom name when the behaviour should write a project-specific
state instead (e.g. `'focal'`).

***

### zoomedOutEdgeState?

> `optional` **zoomedOutEdgeState?**: `string`

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:118](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L118)

State name applied to connecting edges when
`camera.scale <= zoomThreshold` AND `degree > 0`. Falls back to `state`
when undefined.

***

### zoomedOutScale?

> `optional` **zoomedOutScale?**: `number`

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:140](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L140)

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

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:111](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L111)

State name applied to the hovered node + N-hop neighbour nodes when
`camera.scale <= zoomThreshold`. Falls back to `state` when undefined
(no node-side zoom swap, but edges may still swap via
`zoomedOutEdgeState`).

***

### zoomThreshold?

> `optional` **zoomThreshold?**: `number`

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:103](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L103)

Camera scale at or below which the behaviour swaps `state` for
`zoomedOutState` (and `zoomedOutEdgeState` for edges). The hovered set
gets re-painted through the swapped state names whenever the camera
crosses this threshold mid-hover. Omit (or leave both zoomed-out names
undefined) and the behaviour is identical to today.

Typical use: at world-level zoom every node collapses to ~1 anti-aliased
pixel, so the normal `active` state is invisible against background
dots. A bigger `active-far` config (size + strokeWidth bumped) makes
the hovered node pop.
