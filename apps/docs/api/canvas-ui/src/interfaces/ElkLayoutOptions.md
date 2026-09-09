# Interface: ElkLayoutOptions

The subset of `ElkLayoutOptions` this editor produces — a serialisable patch.
`padding` is modelled as a single symmetric number (the per-side object form
is out of scope); `defaultNodeSize` is flattened into `defaultNodeWidth` /
`defaultNodeHeight`. Function options (`nodeSize`, `workerFactory`), the
free-form `layoutOptions` bag, and registry wiring (`id` / `targetLayerId`)
are out of scope; the tunable scalars round-trip. `transition` /
`transitionEase` come from the shared one-shot layout base.

## Properties

### algorithm?

> `optional` **algorithm?**: `ElkAlgorithm`

***

### defaultNodeSize?

> `optional` **defaultNodeSize?**: `object`

#### height?

> `optional` **height?**: `number`

#### width?

> `optional` **width?**: `number`

***

### direction?

> `optional` **direction?**: `ElkDirection`

***

### edgeNodeSpacing?

> `optional` **edgeNodeSpacing?**: `number`

***

### edgeRouting?

> `optional` **edgeRouting?**: `ElkEdgeRouting`

***

### edgeSpacing?

> `optional` **edgeSpacing?**: `number`

***

### includeGroups?

> `optional` **includeGroups?**: `boolean`

Lay out `parentId` groups as nested containers (compound layout).

***

### layerSpacing?

> `optional` **layerSpacing?**: `number`

***

### nodeSpacing?

> `optional` **nodeSpacing?**: `number`

***

### padding?

> `optional` **padding?**: `number`

`elk.padding` — symmetric graph padding (per-side object form omitted).

***

### transition?

> `optional` **transition?**: `boolean`

***

### transitionEase?

> `optional` **transitionEase?**: `string`
