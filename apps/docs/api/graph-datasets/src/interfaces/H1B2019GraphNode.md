# Interface: H1B2019GraphNode

Defined in: [graph-datasets/src/h1b2019.ts:52](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-datasets/src/h1b2019.ts#L52)

A single node in the flat projection. The id is the slash-joined path
from the root (e.g. `H-1B 2019/CA/SAN JOSE/GOOGLE LLC`) so duplicate
employer / city names across states stay distinct.

## Properties

### data

> **data**: `object`

Defined in: [graph-datasets/src/h1b2019.ts:54](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-datasets/src/h1b2019.ts#L54)

#### depth

> **depth**: `number`

Depth from root. Root = 0, state = 1, city = 2, employer = 3.

#### group?

> `optional` **group?**: `string`

Top-level category — the depth-1 ancestor's name (the U.S. state
abbreviation, e.g. `CA`, `NY`, `TX`). Depth-1 nodes carry their own
name here; the root (depth 0) carries `undefined`. Drives categorical
colouring by state for bubble-chart-style renders.

#### isLeaf

> **isLeaf**: `boolean`

True iff this node has no children (i.e. an employer leaf).

#### name

> **name**: `string`

Original `name` field — state abbreviation, city name, or employer.

#### value?

> `optional` **value?**: `number`

Sum of petition counts for this leaf. Inner nodes omit it.

***

### id

> **id**: `string`

Defined in: [graph-datasets/src/h1b2019.ts:53](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-datasets/src/h1b2019.ts#L53)
