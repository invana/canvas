# CLAUDE.md — packages/graph-layer-d3-contour (`@invana/graph-layer-d3-contour`)

`WorldLayer` that paints a [d3 `contourDensity`](https://d3js.org/d3-contour/density) overlay over a `GraphLayer`'s node positions. Toggleable independently — add / remove the layer (or flip `layer.visible`) to show / hide the density view without touching the underlying graph.

```ts
import { DensityContourLayer } from '@invana/graph-layer-d3-contour';

canvas.layers.add(
  new DensityContourLayer({
    id: 'density',
    options: { graphLayerId: 'graph', bandwidth: 30 },
  }),
);
```

Cross-layer dep is declared explicitly via `graphLayerId` per the canvas architecture rule — no inference of "the only graph layer".

Recompute is debounced (default 120 ms) and triggered by the source `GraphLayer`'s `data:changed`. `contourDensity` is O(n·grid²); per-frame live-drag recompute is intentionally not the default — set `recompute: 'manual'` and call `layer.recompute()` from a drag behaviour if you need it.
