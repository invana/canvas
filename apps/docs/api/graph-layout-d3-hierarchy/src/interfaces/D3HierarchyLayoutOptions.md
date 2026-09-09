# Interface: D3HierarchyLayoutOptions

`D3HierarchyLayout` options.

**All options default to `undefined`.** Only `mode` has an internal default
(`'radial-tree'`). Anything you omit falls through to d3-hierarchy's own
defaults — no setter is called when you don't provide a value.

Extends OneShotLayoutOptions, so it also accepts `id` / `targetLayerId`
(for registry / `config.activeLayout` wiring) and `transition` /
`transitionEase` (glide nodes to the computed layout instead of snapping —
vetoed for `pack` / `sunburst`, which replace node geometry rather than move it).

## Extends

- `SubgraphLayoutOptions`

## Properties

### center?

> `optional` **center?**: `object`

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

Stable id, used to address the layout in a `LayoutRegistry` / config. Default `'layout'`.

#### Inherited from

`SubgraphLayoutOptions.id`

***

### includeGroups?

> `optional` **includeGroups?**: `boolean`

Lay `parentId` **groups** out as containers — each group's members are
placed among themselves, then the whole group is placed as one box at its
parent's level. Only nodes whose resolved style carries `group` count as
containers; a plain `parentId` tree is unaffected.

Default `false`. Containment is exact, but a group's interior is solved
without sight of its external edges — see the class docs. Prefer
`ElkLayout` when edge routing across group boundaries matters.

#### Inherited from

`SubgraphLayoutOptions.includeGroups`

***

### includeHidden?

> `optional` **includeHidden?**: `boolean`

Include explicitly-hidden nodes in the layout. Default `false` — hidden
nodes are excluded from placement so they don't perturb the visible graph,
and their last positions are left frozen (the layout never writes them).

#### Inherited from

`SubgraphLayoutOptions.includeHidden`

***

### mode?

> `optional` **mode?**: [`D3HierarchyLayoutMode`](../type-aliases/D3HierarchyLayoutMode.md)

Layout mode. Default `'radial-tree'`.

***

### nodeSize?

> `optional` **nodeSize?**: \[`number`, `number`\]

`tree.nodeSize([dx, dy])` / `cluster.nodeSize([dx, dy])`. Mutually
exclusive with `size`.

***

### orientation?

> `optional` **orientation?**: [`CartesianOrientation`](../type-aliases/CartesianOrientation.md)

Cartesian orientation. Default `'vertical'`. See [CartesianOrientation](../type-aliases/CartesianOrientation.md).
Ignored in `radial-*` modes.

***

### padding?

> `optional` **padding?**: `number`

Pack-only: padding between sibling circles, in world units. Default `0`
(d3's default). Ignored in non-pack modes.

***

### radius?

> `optional` **radius?**: `number`

Polar radius for `radial-*` modes. Default `400`. Ignored for Cartesian
modes.

***

### rootId?

> `optional` **rootId?**: `string`

Explicit root node id. If omitted, the layout auto-detects the root as
the unique node with no incoming edge in the snapshot. Throws if there
is none or more than one.

***

### separation?

> `optional` **separation?**: [`SeparationFn`](../type-aliases/SeparationFn.md)

Custom separation function. See d3-hierarchy `tree.separation`.

***

### size?

> `optional` **size?**: \[`number`, `number`\]

`tree.size([w, h])` / `cluster.size([w, h])`. Cartesian modes default
to `[640, 480]` if neither `size` nor `nodeSize` is provided.

For radial modes, the underlying d3 layout uses `[2π, radius]` —
configure the polar layout with `radius` (and optionally `nodeSize` for
per-node angular spacing) instead.

***

### sort?

> `optional` **sort?**: (`a`, `b`) => `number`

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

The layer this layout is meant to run against. Informational — `apply(layer)` still takes one explicitly.

#### Inherited from

`SubgraphLayoutOptions.targetLayerId`

***

### transition?

> `optional` **transition?**: `number` \| `boolean`

Animate nodes from their current positions to the computed layout instead
of snapping. `true` uses DEFAULT\_POSITION\_TRANSITION\_MS; a number is
an explicit duration in ms; `false` snaps. Default `true`.

Serializable (boolean | number) so it rides the canvas config bag and binds
straight to a lil-gui control.

#### Inherited from

`SubgraphLayoutOptions.transition`

***

### transitionEase?

> `optional` **transitionEase?**: [`EasingName`](../../../canvas/src/type-aliases/EasingName.md)

Easing curve for the transition, as a serializable [EasingName](../../../canvas/src/type-aliases/EasingName.md) key.
Default `'easeOutCubic'`. Ignored when `transition` is `false`.

#### Inherited from

`SubgraphLayoutOptions.transitionEase`

***

### value?

> `optional` **value?**: (`node`) => `number`

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
