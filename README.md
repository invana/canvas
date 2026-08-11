# @invana/canvas

High-performance data investigation toolkit for your graphs — WebGPU-first rendering, explorer features.

## Why

Most graph tooling renders a snapshot and stops. Invana Canvas is built to be
*interacted with* — pan / zoom / select, re-layout, annotate, and drive backend
queries, all in place without leaving the view. The picture is a means, not the product.

Architecture, highlighted features, and completion status live in the **[roadmap](./roadmap.md)**.

## Install

```bash
pnpm install
pnpm build
pnpm --filter @canvas/storybook dev   # → http://localhost:6006  (live examples)
```

Build a single package:

```bash
pnpm --filter @invana/canvas build
```

## Packages

| Package | Responsibility |
|---|---|
| [`@invana/canvas`](./packages/canvas) | The engine — `Canvas`, `Layer` / `Behaviour` / `Layout` base classes, the spec vocabulary, picking, connector geometry, camera, and the renderer contract. **Renderer-agnostic: imports no drawing library.** |
| [`@invana/renderer-pixijs`](./packages/renderer-pixijs) | The PixiJS drawing backend — implements the renderer contract. The **only** package that touches `pixi.js`. Swappable: `@invana/canvas` declares it an optional peer and resolves it lazily. |
| [`@invana/graph`](./packages/graph) | Graph domain on the engine — `GraphCanvas`, `GraphLayer`, `MiniMapLayer`, the graph store, and hover / select / lasso / brush / drag / context-menu behaviours. |
| [`@invana/graph-layout-*`](./packages) | One layout algorithm each — `d3-force`, `elkjs`, `d3-hierarchy`, `d3-sankey`, `geometric`. |
| [`@invana/graph-layer-*`](./packages) | Overlay layers — `d3-contour` (density), `bubble-sets` (group annotation), `maplibre` (basemap). |
| [`@invana/canvas-react`](./packages/canvas-react) | React bindings — declarative `<Canvas>`, hooks, components + assembled toolbars, `GraphCanvasApp`. |
| [`@invana/canvas-ui`](./packages/canvas-ui) | Schema-driven, engine-agnostic **editor** components, built on `@invana/forms`. |
| [`@invana/canvas-designer`](./packages/canvas-designer) | The visual **designer** — node **template** authoring today (WYSIWYG → `FreeformStructure`); layout/behaviour/layer designers planned. |
| [`@invana/graph-datasets`](./packages/graph-datasets) | Sample datasets for examples and stories. |

## Roadmap & design notes

- **[roadmap.md](./roadmap.md)** — the why, architecture diagram, and feature status.
- **[docs/](./docs/)** — internal design notes and `*-plan.md` documents (`docs/README.md` indexes them).

## License

