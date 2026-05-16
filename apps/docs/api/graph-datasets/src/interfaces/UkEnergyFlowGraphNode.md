# Interface: UkEnergyFlowGraphNode

Defined in: [graph-datasets/src/uk-energy-flow.ts:49](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph-datasets/src/uk-energy-flow.ts#L49)

Node in the flat `{nodes, edges}` projection.

## Properties

### data

> **data**: `object`

Defined in: [graph-datasets/src/uk-energy-flow.ts:51](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph-datasets/src/uk-energy-flow.ts#L51)

#### category

> **category**: `string`

Categorical bucket derived from the node name's first whitespace-
separated word (`'Solar PV'` becomes `'Solar'`, `'Coal reserves'`
becomes `'Coal'`). Mirrors the d3 example's first-word replace key
so a 10-colour ordinal scale produces the same grouping as the
canonical Observable port.

#### name

> **name**: `string`

Original `name` field — used by Sankey labels.

***

### id

> **id**: `string`

Defined in: [graph-datasets/src/uk-energy-flow.ts:50](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph-datasets/src/uk-energy-flow.ts#L50)
