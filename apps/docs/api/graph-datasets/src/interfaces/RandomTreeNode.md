# Interface: RandomTreeNode

Defined in: [graph-datasets/src/randomTree.ts:17](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph-datasets/src/randomTree.ts#L17)

Procedurally-generated tree, for force-layout stress tests and
tree-shaped demos.

Node `i + 1`'s parent is node `floor(sqrt(i))`, which yields a
branchy, square-root-balanced tree in O(n) time with no RNG.

The export uses a minimal `{ index }` / `{ source, target }` shape.
Map it onto `GraphNode` / `GraphEdge` at the call site (see the
`RandomTree` story for an example).

## Example

```ts
import { generateRandomTree } from '@invana/graph-datasets';
const tree = generateRandomTree(500);
```

## Properties

### index

> **index**: `number`

Defined in: [graph-datasets/src/randomTree.ts:18](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph-datasets/src/randomTree.ts#L18)
