# Packages

Every published `@invana/*` package ships from one repo and is versioned in **lockstep** — they all carry the same version, and you upgrade them together. This page is the map: what each one is, and when you need it. For the exported classes, methods and types, use the [API Reference](/api/), which is generated from the source.

## Choosing what to install

| You want to… | Install |
|---|---|
| Draw a non-graph scene, or author your own layer | `@invana/canvas` |
| Draw a graph — nodes, edges, layouts | `@invana/canvas` + `@invana/graph` + a `@invana/graph-layout-*` |
| Do either of those declaratively in React | …plus `@invana/canvas-react` |
| Ship an application shell — toolbars, panels, settings editors | …plus `@invana/canvas-ui` |
| Export traces / FPS metrics / logs to a collector | …plus `@invana/canvas-telemetry-otel` |

`pixi.js` is never a direct install: it arrives through `@invana/renderer-pixijs`, which `@invana/canvas` depends on. (React consumers are the exception — `@invana/canvas-react` declares `pixi.js` as a peer, so install it alongside.)

## The engine

| Package | What it is |
|---|---|
| **`@invana/canvas-core`** | The floor. Imports nothing at all — no workspace package, no third-party library. It owns the **vocabulary** every other package speaks: the spec types (shapes / connectors / decorations / effects as plain data) and the pure geometry over them, `geom` / `frame`, the event-bus and theme classes, the data primitives (`ColumnStore`, `DirtyBatcher`), the `ReactiveStore` port contract, `CanvasView`, the renderer contract (`IRenderer` / `ISurface` / `IElementRenderer` / `ICameraBinding`), the `Layer` / `Behaviour` / `Layout` base classes, `Camera`, and the registries. You rarely import it directly. |
| **`@invana/canvas-store`** | The state machinery over those contracts: the immer patch engine and `ReactiveStore` adapters, history / undo, picking (an rbush spatial index), the telemetry ports, and `createCanvasStore` — which builds the one `CanvasStore { view, data, events }` that each `Canvas` owns. The only home of `zustand` and `immer`. |
| **`@invana/canvas`** | The engine you actually import: `Canvas`, the tick loop and renderer lifecycle, the built-in layers (`BackgroundLayer`, `DevInfoLayer`, `LayersPanelLayer`) and behaviours (drag-pan, wheel/pinch zoom, keyboard camera, drag-shape, LOD…), and raster / SVG / state import-export. It re-exports the whole `canvas-core` surface, so one import covers the engine. It imports no drawing library itself. |
| **`@invana/renderer-pixijs`** | The PixiJS drawing backend — the **only** package in the stack that touches `pixi.js`. It implements the renderer contract: the application, the viewport binding, every shape / connector / decoration / effect / marker primitive, textures and fonts. It is a required dependency of `@invana/canvas`, imported at module scope, so `init()` works with no configuration. To swap backends you pass your own `IRenderer` to `new Canvas({ renderer })`. |
| **`@invana/canvas-telemetry-otel`** | The opt-in OpenTelemetry adapter — the only package that imports an OTel SDK. `otelTelemetry({ endpoint, traces, metrics, logging })` returns the `telemetry` config `new Canvas({ telemetry })` accepts, backed by OTLP/**HTTP** exporters (browsers cannot speak OTLP/gRPC). Nothing in the engine imports it: the kernel declares `tracer` / `meter` / `logger` ports and no-ops when they are absent, so a consumer who wants no observability pulls in no OTel bytes. |

## The graph domain

| Package | What it is |
|---|---|
| **`@invana/graph`** | The graph domain on top of the engine — `GraphCanvas` (a strict `Canvas` superset), `GraphLayer`, `MiniMapLayer`, the node-structure template model, and the hover / click / lasso / brush / drag / select / context-menu behaviours. `type` is required on every `GraphNode` and `GraphEdge`. |
| **`@invana/graph-layout-d3-force`** | Iterative, animated force layout. |
| **`@invana/graph-layout-elkjs`** | ELK layered / tree / radial layouts, one-shot. |
| **`@invana/graph-layout-d3-hierarchy`** | Tree, cluster, radial, pack, sunburst — one-shot. |
| **`@invana/graph-layout-d3-sankey`** | Sankey flow layout, one-shot. |
| **`@invana/graph-layout-geometric`** | Grid, snake and circular layouts — one-shot and dependency-free. |
| **`@invana/graph-layer-d3-contour`** | Density overlay — `DensityContourFillLayer` and `DensityContourStrokeLayer`. |
| **`@invana/graph-layer-bubble-sets`** | `BubbleSetsLayer` — named-group annotation around sets of nodes. |
| **`@invana/graph-layer-maplibre`** | `MapLayer` — a MapLibre GL basemap that projects nodes onto a real world map. |
| **`@invana/graph-datasets`** | Sample graph datasets for examples and stories. |

A **layout** reads a layer's data, computes positions, and writes them back; it does not register with the canvas, render, or subscribe to input. A **layer** draws.

## React

The React side splits on one axis — *headless bindings* vs *pixels*.

| Package | What it is |
|---|---|
| **`@invana/canvas-react`** | Headless bindings only: the declarative `<Canvas>` / `<GraphCanvas>` roots, contexts, null-rendering layer / behaviour / layout wrappers, and store hooks. It renders no application UI. |
| **`@invana/canvas-ui`** | The UI kit — every pixel: components, toolbars, menus, store-connected panels, schema-driven settings editors for each behaviour / layer / layout, and the `GraphCanvasApp` shell. Built on canvas-react's hooks. |
| **`@invana/canvas-designer`** | Visual authoring for a visualisation's definition. Today: the node-template surface — WYSIWYG composite-card authoring that emits a `FreeformStructure`, which compiles to a composite shape the engine renders. |

## Versioning

All packages are on the same version and released together from one tag. The stack is pre-1.0: the architecture and package boundaries are settled, but the API surface still moves — the [changelog](https://github.com/invana/canvas/blob/main/CHANGELOG.md) carries a **Breaking Changes** section per release, and 0.x releases do contain breaking changes.

## Live examples

Storybook is the canonical demo surface — every shape, connector, behaviour, layout and layer has a runnable story there. Run it with `pnpm --filter @canvas/storybook dev`.
