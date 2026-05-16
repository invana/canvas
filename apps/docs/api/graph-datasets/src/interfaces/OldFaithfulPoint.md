# Interface: OldFaithfulPoint

Defined in: [graph-datasets/src/oldFaithful.ts:26](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph-datasets/src/oldFaithful.ts#L26)

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

## Extended by

- [`OldFaithfulNodeData`](OldFaithfulNodeData.md)

## Properties

### eruptions

> **eruptions**: `number`

Defined in: [graph-datasets/src/oldFaithful.ts:28](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph-datasets/src/oldFaithful.ts#L28)

Eruption duration in minutes.

***

### waiting

> **waiting**: `number`

Defined in: [graph-datasets/src/oldFaithful.ts:30](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph-datasets/src/oldFaithful.ts#L30)

Minutes elapsed before the next eruption.
