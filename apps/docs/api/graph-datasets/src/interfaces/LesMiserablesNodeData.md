# Interface: LesMiserablesNodeData

Defined in: [graph-datasets/src/lesMiserables.ts:21](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph-datasets/src/lesMiserables.ts#L21)

Les Misérables character co-occurrence network.

Character relationships from Victor Hugo's *Les Misérables* novel —
77 characters, 254 undirected co-occurrence edges weighted by how many
scenes they share. Each character belongs to one of 11 "groups" (loosely:
the cluster of characters they appear with most). Useful as a small but
structurally-rich force-directed layout demo.

Source: Donald E. Knuth, *The Stanford GraphBase: A Platform for
Combinatorial Computing*, 1993. Adapted from the D3.js examples.

Export shape is structurally compatible with `GraphData` from
`@invana/graph` — pass it straight to `graph.setData()`.

## Example

```ts
import { lesMiserables } from '@invana/graph-datasets';
graph.setData(lesMiserables);
```

## Properties

### group

> **group**: `number`

Defined in: [graph-datasets/src/lesMiserables.ts:23](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph-datasets/src/lesMiserables.ts#L23)

Co-occurrence cluster (0–10). Used for colour-by-group in stories.
