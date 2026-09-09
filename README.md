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

## Module format — ESM only

Every published `@invana/*` package is **ESM only**: `"type": "module"`, an ESM-only build,
and an `exports` map with a `default` condition but **no `require` condition**. There is no
CJS build, and there will not be one — see the note below.

| Consumer | Result |
|---|---|
| `import` from ESM, or any modern bundler (Vite, webpack 5, Rollup, esbuild, Next.js) | ✅ works |
| `require()` on Node **20.19+ / 22.12+** | ✅ works — `default` resolves to the ESM file and Node's `require(esm)` loads it (verified on Node 24: `@invana/canvas` 162 exports, `canvas-core` 142, `canvas-store` 103) |
| `require()` on Node **18 – 20.18 / 22.0 – 22.11** | ❌ `ERR_REQUIRE_ESM` |
| A build that emits CJS and does not down-level dependencies | ❌ same |

Why no dual build: the stack targets the browser and WebGPU, so CJS buys little — and a
second build across packages that ship in lockstep would let a consumer mixing `require`
and `import` load **two copies** of the shape / connector / layout registries and the spec
store, which are effectively singletons.

## Packages

| Package | Responsibility |
|---|---|
| [`@invana/canvas-core`](./packages/canvas-core) | The **floor** — imports nothing at all. The vocabulary every other package speaks: the spec types (shapes / connectors / decorations / effects) and the geometry over them, `geom` / `frame`, the event-bus and theme classes, the data primitives, the `ReactiveStore` port contract, `CanvasView`, the renderer contract (`IRenderer` / `ISurface` / `IElementRenderer` / `ICameraBinding`), the `Layer` / `Behaviour` / `Layout` base classes, `Camera`, and the registries. |
| [`@invana/canvas-store`](./packages/canvas-store) | The **state machinery** over those contracts — the immer patch engine and `ReactiveStore` adapters, history / undo, picking (rbush), telemetry ports, and `createCanvasStore`, which builds the one `CanvasStore { view, data, events }` each `Canvas` owns. The only home of `zustand` / `immer`. |
| [`@invana/canvas`](./packages/canvas) | The engine — `Canvas`, the tick and renderer lifecycle, built-in layers and behaviours, and raster / SVG / state import-export. Re-exports the whole `canvas-core` surface, so applications import everything from here. **Imports no drawing library itself.** |
| [`@invana/renderer-pixijs`](./packages/renderer-pixijs) | The PixiJS drawing backend — implements the renderer contract. The **only** package that touches `pixi.js`. It is a **required dependency** of `@invana/canvas`, imported at module scope, so `init()` works with no configuration; bring a different backend by passing your own `IRenderer` to `new Canvas({ renderer })`. |
| [`@invana/canvas-telemetry-otel`](./packages/canvas-telemetry-otel) | Opt-in **OpenTelemetry** adapter — `otelTelemetry({ endpoint })` builds the `telemetry` config `Canvas` accepts, exporting traces, FPS metrics, and logs over OTLP/HTTP to HyperDX or any collector. The engine ships the ports; this ships the SDK. |
| [`@invana/graph`](./packages/graph) | Graph domain on the engine — `GraphCanvas`, `GraphLayer`, `MiniMapLayer`, the graph store, and hover / select / lasso / brush / drag / context-menu behaviours. |
| [`@invana/graph-layout-*`](./packages) | One layout algorithm each — `d3-force`, `elkjs`, `d3-hierarchy`, `d3-sankey`, `geometric`. |
| [`@invana/graph-layer-*`](./packages) | Overlay layers — `d3-contour` (density), `bubble-sets` (group annotation), `maplibre` (basemap). |
| [`@invana/canvas-react`](./packages/canvas-react) | **Headless** React bindings — declarative `<Canvas>` / `<GraphCanvas>` roots, contexts, null-rendering layer / behaviour / layout wrappers, and store hooks. Draws no UI of its own. |
| [`@invana/canvas-ui`](./packages/canvas-ui) | The React **UI kit** — every pixel: components, toolbars, menus, panels, schema-driven settings editors, and `GraphCanvasApp`. Built on canvas-react's hooks. |
| [`@invana/canvas-designer`](./packages/canvas-designer) | The visual **designer** — node **template** authoring today (WYSIWYG → `FreeformStructure`); layout/behaviour/layer designers planned. |
| [`@invana/graph-datasets`](./packages/graph-datasets) | Sample datasets for examples and stories. |

## Roadmap & design notes

- **[roadmap.md](./roadmap.md)** — the why, architecture diagram, and feature status.
- **[docs/](./docs/)** — internal design notes and `*-plan.md` documents (`docs/README.md` indexes them).

## License

