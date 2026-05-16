# Interface: LandTopology

Defined in: [graph-datasets/src/air-routes/index.ts:43](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph-datasets/src/air-routes/index.ts#L43)

Loose TopoJSON shape — the world-50m land outline used by the d3
notebook. Typed structurally (no `topojson-specification` dep) since
consumers either pass this straight to `topojson-client.feature(...)`
or pluck `.objects.land` directly.

## Properties

### arcs

> **arcs**: `number`[][][]

Defined in: [graph-datasets/src/air-routes/index.ts:47](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph-datasets/src/air-routes/index.ts#L47)

***

### bbox?

> `optional` **bbox?**: \[`number`, `number`, `number`, `number`\]

Defined in: [graph-datasets/src/air-routes/index.ts:45](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph-datasets/src/air-routes/index.ts#L45)

***

### objects

> **objects**: `object`

Defined in: [graph-datasets/src/air-routes/index.ts:48](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph-datasets/src/air-routes/index.ts#L48)

#### land

> **land**: `object`

##### land.arcs?

> `optional` **arcs?**: `unknown`

##### land.geometries?

> `optional` **geometries?**: `unknown`[]

##### land.type

> **type**: `"MultiPolygon"` \| `"GeometryCollection"`

***

### transform?

> `optional` **transform?**: `object`

Defined in: [graph-datasets/src/air-routes/index.ts:46](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph-datasets/src/air-routes/index.ts#L46)

#### scale

> **scale**: \[`number`, `number`\]

#### translate

> **translate**: \[`number`, `number`\]

***

### type

> **type**: `"Topology"`

Defined in: [graph-datasets/src/air-routes/index.ts:44](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph-datasets/src/air-routes/index.ts#L44)
