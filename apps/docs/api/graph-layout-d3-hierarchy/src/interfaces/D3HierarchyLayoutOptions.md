# Interface: D3HierarchyLayoutOptions

Defined in: [graph-layout-d3-hierarchy/src/types.ts:61](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph-layout-d3-hierarchy/src/types.ts#L61)

`D3HierarchyLayout` options.

**All options default to `undefined`.** Only `mode` has an internal default
(`'radial-tree'`). Anything you omit falls through to d3-hierarchy's own
defaults — no setter is called when you don't provide a value.

## Properties

### center?

> `optional` **center?**: `object`

Defined in: [graph-layout-d3-hierarchy/src/types.ts:108](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph-layout-d3-hierarchy/src/types.ts#L108)

Translate the projected coordinates by `(x, y)` after layout. Default
`{ x: 0, y: 0 }`. Useful for centring the cluster around the world
origin in radial modes (the default already does this).

#### x?

> `optional` **x?**: `number`

#### y?

> `optional` **y?**: `number`

***

### mode?

> `optional` **mode?**: [`D3HierarchyLayoutMode`](../type-aliases/D3HierarchyLayoutMode.md)

Defined in: [graph-layout-d3-hierarchy/src/types.ts:63](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph-layout-d3-hierarchy/src/types.ts#L63)

Layout mode. Default `'radial-tree'`.

***

### nodeSize?

> `optional` **nodeSize?**: \[`number`, `number`\]

Defined in: [graph-layout-d3-hierarchy/src/types.ts:86](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph-layout-d3-hierarchy/src/types.ts#L86)

`tree.nodeSize([dx, dy])` / `cluster.nodeSize([dx, dy])`. Mutually
exclusive with `size`.

***

### orientation?

> `optional` **orientation?**: [`CartesianOrientation`](../type-aliases/CartesianOrientation.md)

Defined in: [graph-layout-d3-hierarchy/src/types.ts:98](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph-layout-d3-hierarchy/src/types.ts#L98)

Cartesian orientation. Default `'vertical'`. See [CartesianOrientation](../type-aliases/CartesianOrientation.md).
Ignored in `radial-*` modes.

***

### padding?

> `optional` **padding?**: `number`

Defined in: [graph-layout-d3-hierarchy/src/types.ts:116](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph-layout-d3-hierarchy/src/types.ts#L116)

Pack-only: padding between sibling circles, in world units. Default `0`
(d3's default). Ignored in non-pack modes.

***

### radius?

> `optional` **radius?**: `number`

Defined in: [graph-layout-d3-hierarchy/src/types.ts:92](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph-layout-d3-hierarchy/src/types.ts#L92)

Polar radius for `radial-*` modes. Default `400`. Ignored for Cartesian
modes.

***

### rootId?

> `optional` **rootId?**: `string`

Defined in: [graph-layout-d3-hierarchy/src/types.ts:70](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph-layout-d3-hierarchy/src/types.ts#L70)

Explicit root node id. If omitted, the layout auto-detects the root as
the unique node with no incoming edge in the snapshot. Throws if there
is none or more than one.

***

### separation?

> `optional` **separation?**: [`SeparationFn`](../type-aliases/SeparationFn.md)

Defined in: [graph-layout-d3-hierarchy/src/types.ts:101](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph-layout-d3-hierarchy/src/types.ts#L101)

Custom separation function. See d3-hierarchy `tree.separation`.

***

### size?

> `optional` **size?**: \[`number`, `number`\]

Defined in: [graph-layout-d3-hierarchy/src/types.ts:80](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph-layout-d3-hierarchy/src/types.ts#L80)

`tree.size([w, h])` / `cluster.size([w, h])`. Cartesian modes default
to `[640, 480]` if neither `size` nor `nodeSize` is provided.

For radial modes, the underlying d3 layout uses `[2π, radius]` —
configure the polar layout with `radius` (and optionally `nodeSize` for
per-node angular spacing) instead.

***

### sort?

> `optional` **sort?**: (`a`, `b`) => `number`

Defined in: [graph-layout-d3-hierarchy/src/types.ts:133](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph-layout-d3-hierarchy/src/types.ts#L133)

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

### value?

> `optional` **value?**: (`node`) => `number`

Defined in: [graph-layout-d3-hierarchy/src/types.ts:126](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph-layout-d3-hierarchy/src/types.ts#L126)

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
