# Interface: OldFaithfulNodeData

Defined in: [graph-datasets/src/oldFaithful.ts:33](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph-datasets/src/oldFaithful.ts#L33)

Old Faithful geyser eruptions — 272 measurements.

Each record pairs an eruption's duration in minutes (`eruptions`, 1.5–5.1)
with the time in minutes until the next eruption (`waiting`, 43–96). The
dataset is famously bimodal — two distinct (short, short-wait) and
(long, long-wait) clusters — which makes it a canonical demo for 2D
density estimators. This is the source dataset behind the Observable
[`@d3/density-contours`](https://observablehq.com/@d3/density-contours)
example.

Source: W. Härdle (1991), *Smoothing Techniques with Implementation in S*,
New York: Springer. Public domain; bundled with R as `datasets::faithful`.

The exported `oldFaithful` is a nodes-only `GraphData` ready for
`GraphLayer.setData()` — each point becomes a node positioned at
`(waiting, eruptions * 20)` so that the two axes have comparable spread in
world units (waiting ≈ 53 units of range, scaled eruptions ≈ 72 units).
No edges.

## Example

```ts
import { oldFaithful } from '@invana/graph-datasets';
graph.setData(oldFaithful);
```

## Extends

- [`OldFaithfulPoint`](OldFaithfulPoint.md)

## Properties

### cluster

> **cluster**: `"short"` \| `"long"`

Defined in: [graph-datasets/src/oldFaithful.ts:40](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph-datasets/src/oldFaithful.ts#L40)

Bimodal cluster the point most likely belongs to — `'short'` for the
brief eruption / short-wait cluster, `'long'` for the long-duration /
long-wait cluster. Determined by a 3-minute split on `eruptions`.
Useful for colour-by-cluster stories.

***

### eruptions

> **eruptions**: `number`

Defined in: [graph-datasets/src/oldFaithful.ts:28](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph-datasets/src/oldFaithful.ts#L28)

Eruption duration in minutes.

#### Inherited from

[`OldFaithfulPoint`](OldFaithfulPoint.md).[`eruptions`](OldFaithfulPoint.md#eruptions)

***

### waiting

> **waiting**: `number`

Defined in: [graph-datasets/src/oldFaithful.ts:30](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph-datasets/src/oldFaithful.ts#L30)

Minutes elapsed before the next eruption.

#### Inherited from

[`OldFaithfulPoint`](OldFaithfulPoint.md).[`waiting`](OldFaithfulPoint.md#waiting)
