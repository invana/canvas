# Interface: D3HierarchyLayoutOptions

The subset of `D3HierarchyLayoutOptions` this editor produces — a
serialisable patch. `size` / `nodeSize` are flattened into their two scalar
components (`sizeWidth`/`sizeHeight`, `nodeSizeX`/`nodeSizeY`); `center` is
kept nested. Function options (`separation`, `value`, `sort`) and registry
wiring (`id` / `targetLayerId`) are out of scope; the tunable scalars
round-trip. `transition` / `transitionEase` come from the shared one-shot
layout base (vetoed at runtime for `pack` / `sunburst`).

## Properties

### center?

> `optional` **center?**: `object`

Translate the projected coordinates by `(x, y)` after layout.

#### x?

> `optional` **x?**: `number`

#### y?

> `optional` **y?**: `number`

***

### includeGroups?

> `optional` **includeGroups?**: `boolean`

***

### mode?

> `optional` **mode?**: `D3HierarchyLayoutMode`

***

### nodeSize?

> `optional` **nodeSize?**: \[`number`, `number`\]

`tree.nodeSize([dx, dy])`. Mutually exclusive with `size`.

***

### orientation?

> `optional` **orientation?**: `CartesianOrientation`

Cartesian orientation. Default `'vertical'`.

***

### padding?

> `optional` **padding?**: `number`

Pack-only: padding between sibling circles.

***

### radius?

> `optional` **radius?**: `number`

Polar radius for `radial-*` modes. Default `400`.

***

### rootId?

> `optional` **rootId?**: `string`

***

### size?

> `optional` **size?**: \[`number`, `number`\]

`tree.size([w, h])` / `cluster.size([w, h])`. Cartesian modes.

***

### transition?

> `optional` **transition?**: `boolean`

***

### transitionEase?

> `optional` **transitionEase?**: `string`
