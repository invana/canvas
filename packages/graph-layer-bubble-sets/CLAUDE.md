# CLAUDE.md — packages/graph-layer-bubble-sets (`@invana/graph-layer-bubble-sets`)

`WorldLayer` that paints **BubbleSets** annotations over a `GraphLayer` — smooth, organic contours that enclose a named group of nodes (and optionally their incident edges) while routing around non-member nodes. Backed by [`bubblesets-js`](https://github.com/upsetjs/bubblesets-js) (Christopher Collins's IEEE InfoVis 2009 algorithm).

```ts
import { BubbleSetsLayer } from '@invana/graph-layer-bubble-sets';

canvas.layers.add(
  new BubbleSetsLayer({
    id: 'bubbles',
    options: {
      graphLayerId: 'graph',
      sets: [
        { id: 'cluster-a', members: ['n0', 'n2', 'n3'], edges: ['e0-2', 'e2-3'],
          style: { fill: 0xb39ddb, fillOpacity: 0.25, stroke: 0x7e57c2, strokeWidth: 1.5 },
          label: { text: 'cluster-a' } },
        { id: 'cluster-b', members: ['n4', 'n5'],
          style: { fill: 0x4dd0e1, fillOpacity: 0.25, stroke: 0x00838f } },
      ],
    },
  }),
);
```

Cross-layer dep is declared explicitly via `graphLayerId` per the canvas architecture rule — no inference of "the only graph layer".

Recompute is debounced (default 120 ms) and triggered by the source `GraphLayer`'s `data:changed`. BubbleSets is O(members · grid²); per-frame live-drag recompute is intentionally not the default — set `recompute: 'manual'` and call `layer.recompute()` from a drag behaviour if you need it.

## Concepts

- A **set** is `{ id, members[], edges?[], style?, label? }` — declarative grouping over node ids.
- Members → rectangles fed to BubbleSets' `pushMember`.
- Non-members (every other node in the source graph) → `pushNonMember`. The algorithm routes the contour around them.
- Edges (optional, by edge id) → straight line segments source-center → target-center fed to `pushEdge`. The algorithm encloses them.

## Mutation

The layer owns the set list. Mutators trigger debounced recompute via the same lifecycle as `data:changed`:

- `setSets(sets)` — replace all
- `addSet(set)`, `removeSet(id)`, `updateSet(id, patch)`
- `recompute()` — force immediate recompute (useful with `recompute: 'manual'`)

## Future siblings (same prefix `graph-layer-*`)

- `@invana/graph-layer-hull` — convex / concave hull annotation
- `@invana/graph-layer-annotations` — freeform callouts / labels / shapes

No shared `AnnotationLayerBase` until the second one lands and the abstraction is visible.
