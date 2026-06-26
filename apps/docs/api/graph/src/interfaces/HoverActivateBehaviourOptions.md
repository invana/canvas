# Interface: HoverActivateBehaviourOptions

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:57](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L57)

Constructor options for `HoverActivateBehaviour`.

## Extends

- `BehaviourOptions`

## Properties

### degree?

> `optional` **degree?**: `number`

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:96](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L96)

N-hop neighbour radius. `0` = hovered element only; `1` = direct
neighbours + connecting edges; `N` = N-hop. Default `0`.

***

### direction?

> `optional` **direction?**: [`HoverDirection`](../type-aliases/HoverDirection.md)

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:99](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L99)

Direction for neighbour traversal. Default `'both'`.

***

### enable?

> `optional` **enable?**: `boolean` \| ((`element`) => `boolean`)

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:65](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L65)

Per-target enable predicate. `boolean` is a global on/off; a function
runs per pointer-over and may veto activation. Default `true`.

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: canvas/dist/index.d.ts:733

Default `false` — the developer explicitly enables.

#### Inherited from

`BehaviourOptions.enabled`

***

### id

> **id**: `string`

Defined in: canvas/dist/index.d.ts:726

#### Inherited from

`BehaviourOptions.id`

***

### inactiveState?

> `optional` **inactiveState?**: `string`

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:80](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L80)

State name applied to every element *not* in the active set. Leave
`undefined` to skip inactive dimming. Default `undefined`.

***

### onHover?

> `optional` **onHover?**: (`element`) => `void`

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:153](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L153)

Fired when an element first becomes hovered.

#### Parameters

##### element

[`HoverableElement`](HoverableElement.md)

#### Returns

`void`

***

### onHoverEnd?

> `optional` **onHoverEnd?**: (`element`) => `void`

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:155](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L155)

Fired when hover ends on a previously hovered element.

#### Parameters

##### element

[`HoverableElement`](HoverableElement.md)

#### Returns

`void`

***

### raiseActive?

> `optional` **raiseActive?**: `boolean`

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:90](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L90)

Lift the active set (the hovered focal element + its N-hop neighbours)
above the rest within its render layer for the duration of the hover, so
unrelated nodes / edges don't paint over the highlighted data. Edges raise
above other edges (still below all nodes); neighbour nodes raise above
other nodes. Reset when the hover clears. Visual-only — restacking doesn't
affect hit-testing. Default `true`.

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Defined in: canvas/dist/index.d.ts:739

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

`BehaviourOptions.shortcuts`

***

### state?

> `optional` **state?**: `string`

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:74](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L74)

State name applied to the hovered focal element (and its N-hop
neighbours when `degree > 0`). Default `'hovered'` — matches the
canonical state catalogue auto-merged into every `GraphLayer`. Pass
a custom name when the behaviour should write a project-specific
state instead (e.g. `'focal'`).

***

### targetLayerId

> **targetLayerId**: `string`

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:59](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L59)

Required — the `GraphLayer` id this behaviour drives.

#### Overrides

`BehaviourOptions.targetLayerId`

***

### zoomedOutEdgeState?

> `optional` **zoomedOutEdgeState?**: `string`

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:128](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L128)

State name applied to connecting edges when
`camera.scale <= zoomThreshold` AND `degree > 0`. Falls back to `state`
when undefined.

***

### zoomedOutScale?

> `optional` **zoomedOutScale?**: `number`

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:150](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L150)

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

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:121](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L121)

State name applied to the hovered node + N-hop neighbour nodes when
`camera.scale <= zoomThreshold`. Falls back to `state` when undefined
(no node-side zoom swap, but edges may still swap via
`zoomedOutEdgeState`).

***

### zoomThreshold?

> `optional` **zoomThreshold?**: `number`

Defined in: [graph/src/behaviours/HoverActivateBehaviour.ts:113](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverActivateBehaviour.ts#L113)

Camera scale at or below which the behaviour swaps `state` for
`zoomedOutState` (and `zoomedOutEdgeState` for edges). The hovered set
gets re-painted through the swapped state names whenever the camera
crosses this threshold mid-hover. Omit (or leave both zoomed-out names
undefined) and the behaviour is identical to today.

Typical use: at world-level zoom every node collapses to ~1 anti-aliased
pixel, so the normal `active` state is invisible against background
dots. A bigger `active-far` config (size + strokeWidth bumped) makes
the hovered node pop.
