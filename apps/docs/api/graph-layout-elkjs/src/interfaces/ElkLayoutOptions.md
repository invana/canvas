# Interface: ElkLayoutOptions

`ElkLayout` constructor options. See top-level module doc.

Extends OneShotLayoutOptions, so it also accepts `id` / `targetLayerId`
(registry + `config.activeLayout` wiring) and `transition` / `transitionEase`
(glide nodes to the ELK result instead of snapping — owned by the shared
`OneShotPositionLayout` base).

## Extends

- `OneShotLayoutOptions`

## Properties

### algorithm?

> `optional` **algorithm?**: [`ElkAlgorithmName`](../type-aliases/ElkAlgorithmName.md)

`elk.algorithm`. Default: `'layered'`.

***

### defaultNodeSize?

> `optional` **defaultNodeSize?**: [`NodeSize`](NodeSize.md)

Fallback bounding box used when [nodeSize](#nodesize) is not provided and
the node has no resolvable `style.shape`. Default `{ width: 40, height: 40 }`.

***

### direction?

> `optional` **direction?**: [`ElkDirection`](../type-aliases/ElkDirection.md)

`elk.direction`. Algorithms that respect direction: `layered`, `mrtree`, ...

***

### edgeNodeSpacing?

> `optional` **edgeNodeSpacing?**: `number`

`elk.spacing.edgeNode` — gap between an edge and a node.

***

### edgeRouting?

> `optional` **edgeRouting?**: `"ORTHOGONAL"` \| `"POLYLINE"` \| `"SPLINES"`

`elk.edgeRouting`. When set, ELK computes node-avoiding edge geometry and
`ElkLayout` writes the resulting bend points back as each edge's
`style.shape.waypoints` (with `pathType: 'orth'`). Leaving it unset keeps
the previous behaviour — only node positions are written, no edge geometry.

`'ORTHOGONAL'` is the intended value for `layered` graphs. Routing assumes
nodes whose `node.position` is their CENTRE (circle natively; the
`composite` shape via `GraphLayer`'s centre-fit). Top-left-origin shapes
(e.g. `rect`) would render offset from the computed routes.

***

### edgeSpacing?

> `optional` **edgeSpacing?**: `number`

`elk.spacing.edgeEdge` — gap between parallel edges.

***

### id?

> `optional` **id?**: `string`

Stable id, used to address the layout in a `LayoutRegistry` / config. Default `'layout'`.

#### Inherited from

`OneShotLayoutOptions.id`

***

### includeGroups?

> `optional` **includeGroups?**: `boolean`

Lay **groups** out as true nested containers — a compound layout. Each
group's members are nested under it in the ELK graph and ELK packs them
*inside* the group box, sized from the group's own `padding` /
`headerHeight`, so the group renders as one crisp contained cluster.

A "group" here means what it means everywhere else in the engine: a node
whose resolved style carries `group` (`GraphLayer.isGroupNode`). A plain
`parentId` **tree** is *not* a group and lays out flat — `parentId` is the
shared hierarchy field, so nesting on it alone would box up ordinary trees.
A **collapsed** group is laid out as the single node the renderer draws in
its members' place; the members themselves keep their frozen positions.

Default `true`. It costs nothing on a graph without groups — the compound
builder degenerates to exactly the flat graph — so pass `false` only to
force group members to be placed as ordinary free-floating nodes.

Note that `elk.hierarchyHandling: INCLUDE_CHILDREN` (edges routed across
container boundaries) is applied only for algorithms that honour it —
`layered` today. Other algorithms still nest, but solve each container
separately.

***

### includeHidden?

> `optional` **includeHidden?**: `boolean`

Include explicitly-hidden nodes in the layout. Default `false` — hidden
nodes are excluded from placement so they don't perturb the visible graph,
and their last positions are left frozen (the layout never writes them).

#### Inherited from

`OneShotLayoutOptions.includeHidden`

***

### layerSpacing?

> `optional` **layerSpacing?**: `number`

`elk.layered.spacing.nodeNodeBetweenLayers` — gap between consecutive
layers in the `layered` algorithm. Ignored by other algorithms.

***

### layoutOptions?

> `optional` **layoutOptions?**: `Record`\<`string`, `string`\>

Free-form ELK property bag, merged into the root graph's
`layoutOptions` after the convenience fields above. Use for any
property the typed surface doesn't cover (`elk.layered.crossingMinimization.strategy`,
`elk.aspectRatio`, etc.). Later keys win.

***

### nodeSize?

> `optional` **nodeSize?**: (`node`) => [`NodeSize`](NodeSize.md)

Per-node bounding box override. Called once per node at the start of
`apply()` with the underlying `GraphNode`. When omitted, `ElkLayout`
reads `style.shape` via the layer's `resolveNodeStyle` and falls back
to [defaultNodeSize](#defaultnodesize) when no shape is found.

Return tight bounds — ELK adds spacing on top, so over-sized boxes
blow up the final layout.

#### Parameters

##### node

`GraphNode`

#### Returns

[`NodeSize`](NodeSize.md)

***

### nodeSpacing?

> `optional` **nodeSpacing?**: `number`

`elk.spacing.nodeNode` — minimum gap between sibling nodes.

***

### padding?

> `optional` **padding?**: [`ElkPadding`](../type-aliases/ElkPadding.md)

`elk.padding` — graph-level padding.

***

### targetLayerId?

> `optional` **targetLayerId?**: `string`

The layer this layout is meant to run against. Informational — `apply(layer)` still takes one explicitly.

#### Inherited from

`OneShotLayoutOptions.targetLayerId`

***

### transition?

> `optional` **transition?**: `number` \| `boolean`

Animate nodes from their current positions to the computed layout instead
of snapping. `true` uses DEFAULT\_POSITION\_TRANSITION\_MS; a number is
an explicit duration in ms; `false` snaps. Default `true`.

Serializable (boolean | number) so it rides the canvas config bag and binds
straight to a lil-gui control.

#### Inherited from

`OneShotLayoutOptions.transition`

***

### transitionEase?

> `optional` **transitionEase?**: [`EasingName`](../../../canvas/src/type-aliases/EasingName.md)

Easing curve for the transition, as a serializable [EasingName](../../../canvas/src/type-aliases/EasingName.md) key.
Default `'easeOutCubic'`. Ignored when `transition` is `false`.

#### Inherited from

`OneShotLayoutOptions.transitionEase`

***

### workerFactory?

> `optional` **workerFactory?**: (`url?`) => `Worker`

Factory for the Web Worker that runs the ELK solver off the main thread.

`ElkLayout` runs ELK in a worker by default — the solve is CPU-heavy and
super-linear in graph size, so running it on the main thread freezes the
UI (no paint, no input) for the whole computation. That is especially
visible when a one-shot algorithm re-runs on every streaming update. The
worker keeps the main thread responsive while ELK works.

The default factory does
`new Worker(new URL('elkjs/lib/elk-worker.min.js', import.meta.url), { type: 'classic' })`,
which modern bundlers (Vite, webpack 5, Rollup) resolve and bundle as a
worker asset. Override this when your bundler needs a different idiom to
locate the worker (e.g. Vite's `new ElkWorker()` from a `?worker` import).

When no `Worker` global exists (Node, SSR, test runners) or worker
construction throws, `ElkLayout` falls back to the synchronous
`elkjs/lib/elk.bundled.js` build — correct, but main-thread-blocking.

#### Parameters

##### url?

`string`

#### Returns

`Worker`
