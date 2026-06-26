# Interface: D3HierarchyLayoutOptions

Defined in: [graph-layout-d3-hierarchy/src/types.ts:67](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-hierarchy/src/types.ts#L67)

`D3HierarchyLayout` options.

**All options default to `undefined`.** Only `mode` has an internal default
(`'radial-tree'`). Anything you omit falls through to d3-hierarchy's own
defaults — no setter is called when you don't provide a value.

Extends OneShotLayoutOptions, so it also accepts `id` / `targetLayerId`
(for registry / `config.activeLayout` wiring) and `transition` /
`transitionEase` (glide nodes to the computed layout instead of snapping —
vetoed for `pack` / `sunburst`, which replace node geometry rather than move it).

## Extends

- `OneShotLayoutOptions`

## Properties

### center?

> `optional` **center?**: `object`

Defined in: [graph-layout-d3-hierarchy/src/types.ts:114](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-hierarchy/src/types.ts#L114)

Translate the projected coordinates by `(x, y)` after layout. Default
`{ x: 0, y: 0 }`. Useful for centring the cluster around the world
origin in radial modes (the default already does this).

#### x?

> `optional` **x?**: `number`

#### y?

> `optional` **y?**: `number`

***

### id?

> `optional` **id?**: `string`

Defined in: canvas/dist/index.d.ts:1862

Stable id, used to address the layout in a `LayoutRegistry` / config. Default `'layout'`.

#### Inherited from

`OneShotLayoutOptions.id`

***

### mode?

> `optional` **mode?**: [`D3HierarchyLayoutMode`](../type-aliases/D3HierarchyLayoutMode.md)

Defined in: [graph-layout-d3-hierarchy/src/types.ts:69](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-hierarchy/src/types.ts#L69)

Layout mode. Default `'radial-tree'`.

***

### nodeSize?

> `optional` **nodeSize?**: \[`number`, `number`\]

Defined in: [graph-layout-d3-hierarchy/src/types.ts:92](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-hierarchy/src/types.ts#L92)

`tree.nodeSize([dx, dy])` / `cluster.nodeSize([dx, dy])`. Mutually
exclusive with `size`.

***

### orientation?

> `optional` **orientation?**: [`CartesianOrientation`](../type-aliases/CartesianOrientation.md)

Defined in: [graph-layout-d3-hierarchy/src/types.ts:104](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-hierarchy/src/types.ts#L104)

Cartesian orientation. Default `'vertical'`. See [CartesianOrientation](../type-aliases/CartesianOrientation.md).
Ignored in `radial-*` modes.

***

### padding?

> `optional` **padding?**: `number`

Defined in: [graph-layout-d3-hierarchy/src/types.ts:122](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-hierarchy/src/types.ts#L122)

Pack-only: padding between sibling circles, in world units. Default `0`
(d3's default). Ignored in non-pack modes.

***

### radius?

> `optional` **radius?**: `number`

Defined in: [graph-layout-d3-hierarchy/src/types.ts:98](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-hierarchy/src/types.ts#L98)

Polar radius for `radial-*` modes. Default `400`. Ignored for Cartesian
modes.

***

### rootId?

> `optional` **rootId?**: `string`

Defined in: [graph-layout-d3-hierarchy/src/types.ts:76](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-hierarchy/src/types.ts#L76)

Explicit root node id. If omitted, the layout auto-detects the root as
the unique node with no incoming edge in the snapshot. Throws if there
is none or more than one.

***

### separation?

> `optional` **separation?**: [`SeparationFn`](../type-aliases/SeparationFn.md)

Defined in: [graph-layout-d3-hierarchy/src/types.ts:107](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-hierarchy/src/types.ts#L107)

Custom separation function. See d3-hierarchy `tree.separation`.

***

### size?

> `optional` **size?**: \[`number`, `number`\]

Defined in: [graph-layout-d3-hierarchy/src/types.ts:86](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-hierarchy/src/types.ts#L86)

`tree.size([w, h])` / `cluster.size([w, h])`. Cartesian modes default
to `[640, 480]` if neither `size` nor `nodeSize` is provided.

For radial modes, the underlying d3 layout uses `[2π, radius]` —
configure the polar layout with `radius` (and optionally `nodeSize` for
per-node angular spacing) instead.

***

### sort?

> `optional` **sort?**: (`a`, `b`) => `number`

Defined in: [graph-layout-d3-hierarchy/src/types.ts:139](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-hierarchy/src/types.ts#L139)

Pack-only: sibling sort comparator. Defaults to `(a, b) => b.value - a.value`
(descending by value, which gives a tighter pack). Set to `null` to
leave d3's input order. Ignored in non-pack modes.

#### Parameters

##### a

###### value?

`number`

##### b

###### value?

`number`

#### Returns

`number`

***

### targetLayerId?

> `optional` **targetLayerId?**: `string`

Defined in: canvas/dist/index.d.ts:1864

The layer this layout is meant to run against. Informational — `apply(layer)` still takes one explicitly.

#### Inherited from

`OneShotLayoutOptions.targetLayerId`

***

### transition?

> `optional` **transition?**: `number` \| `boolean`

Defined in: graph/dist/index.d.ts:2701

Animate nodes from their current positions to the computed layout instead
of snapping. `true` uses DEFAULT\_POSITION\_TRANSITION\_MS; a number is
an explicit duration in ms; `false` snaps. Default `true`.

Serializable (boolean | number) so it rides the canvas config bag and binds
straight to a lil-gui control.

#### Inherited from

`OneShotLayoutOptions.transition`

***

### transitionEase?

> `optional` **transitionEase?**: `EasingName`

Defined in: graph/dist/index.d.ts:2706

Easing curve for the transition, as a serializable EasingName key.
Default `'easeOutCubic'`. Ignored when `transition` is `false`.

#### Inherited from

`OneShotLayoutOptions.transitionEase`

***

### value?

> `optional` **value?**: (`node`) => `number`

Defined in: [graph-layout-d3-hierarchy/src/types.ts:132](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-hierarchy/src/types.ts#L132)

Pack-only: per-node value accessor used by `hierarchy.sum()`. Defaults
to reading `node.data.value` (treats missing as `1`). The accumulated
sum drives each circle's radius. Ignored in non-pack modes.

Note: the input is the raw `GraphNode<unknown>`, not the d3 hierarchy
node. Cast `data` if you know its shape.

#### Parameters

##### node

###### data?

`unknown`

###### id

`string`

#### Returns

`number`
