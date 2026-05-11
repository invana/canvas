# Package status

The repo is mid-rewrite. This page is the honest map of what exists today vs. what's planned. The architecture, naming convention, and package boundaries are set; the domain-package implementations are still being filled in.

::: warning Skeleton packages
`@invana/graph`, `@invana/graph-layout-d3-force`, `@invana/graph-layout-elkjs`, and `@invana/graph-datasets` currently export `{}`. They have CLAUDE.md design notes but no shipped code. Use `@invana/canvas` directly until they land.
:::

## `@invana/canvas`

The engine. Production-ready surface for everything you can do today.

| Exports | Status |
|---|---|
| `Canvas`, `Camera`, `CanvasContext` | ✅ |
| `Layer`, `WorldLayer`, `ScreenLayer` | ✅ |
| `Behaviour` base + `DragPanBehaviour`, `WheelZoomBehaviour`, `PinchZoomBehaviour`, `KeyboardCameraInputBehaviour`, `DragShapeBehaviour` | ✅ |
| `LayerRegistry`, `BehaviourRegistry` | ✅ |
| `CanvasEventBus`, `EventEmitter`, `SourceEmitter`, `CanvasEvent` | ✅ |
| `createLayerStore` (zustand+immer), `ColumnStore`, `DirtyBatcher` | ✅ |
| `TextureRegistry`, `loadIconFont` | ✅ |
| `Layout` type | ✅ (interface only — no built-in layouts) |

### `@invana/canvas/primitives`

The drawing surface composed by Layers.

| Exports | Status |
|---|---|
| `PrimitivesRenderer` | ✅ |
| Base classes: `PrimitiveBase`, `ShapeBase`, `ConnectorBase`, `ShapeDecorationBase`, `ConnectorDecorationBase` | ✅ |
| Shapes: `CircleShape`, `RectShape` | ✅ |
| `Connector`, `ArrowMarker` + `arrowMarkerSpec` helper | ✅ |
| Routers: `straightRouter`, `orthRouter`, `manhattanRouter`, `metroRouter`, `erRouter`, `oneSideRouter` | ✅ |
| PathStyles: `normalPathStyle`, `roundedPathStyle`, `bezierPathStyle`, `smoothPathStyle` | ✅ |
| Anchors: `centerAnchor`, `boundaryAnchor`, `perpendicularAnchor` | ✅ |
| Decorations: `GlowDecoration` | ✅ |
| Badge placement helpers | ✅ |
| Path utilities: `samplePath`, `tangentAt`, `pathBounds`, `distanceToPolylineSq` | ✅ |

### Not yet shipped in `@invana/canvas`

| Item | Notes |
|---|---|
| `BackgroundLayer`, `ThemedBackgroundLayer` | Planned built-in `WorldLayer`s. |
| `DevInfoLayer` | Planned built-in `ScreenLayer` (FPS / stats overlay). |
| Additional shapes (`ellipse`, `polygon`, `path`, `image`, `text`) | Planned. |
| Additional markers (`circle`, `square`, `diamond`) | Planned. |
| Additional decorations (`halo`, `border`, `marching-ants`, `pulse-ring`, `breathing`) | Planned. Connector decorations all still TBD. |

You can register your own custom shapes / markers / decorations via the renderer's `registerShape` / `registerDecoration` etc. while built-ins catch up.

## `@invana/graph` — graph-domain layers

**Status: skeleton.** Empty export. Planned surface (per its `CLAUDE.md`):

| Planned export | Role |
|---|---|
| `GraphLayer` | `WorldLayer` subclass wrapping a `PrimitivesRenderer`; UI state via `Layer.state`, bulk data via typed-array `ColumnStore` extensions. |
| `GraphNodeStore`, `GraphEdgeStore` | `ColumnStore` schemas for node / edge data. |
| `MiniMapLayer` | `ScreenLayer` showing a viewport-fixed minimap of a source `GraphLayer`. |
| `HoverActivateBehaviour`, `ClickSelectBehaviour`, `LassoSelectBehaviour`, `BrushSelectBehaviour`, `PanBehaviour`, `DragMoveBehaviour` | Domain-typed behaviours over generic primitives. |
| Sugar methods: `haloNode(id)`, `pulseNode(id)`, `dashBorderNode(id)`, `glowNode(id)`, `flashEdge(id)` | Domain-named wrappers that mutate `state` (never the renderer directly). |

## `@invana/graph-layout-d3-force` — D3 force layout

**Status: skeleton.** Planned:

```ts
const layout = new D3ForceLayout({ charge: -300 });
await layout.apply(graphLayer);
```

A `Layout` reads `layer.data`, computes positions, writes them back. It does not register with the canvas, render, or subscribe to input.

## `@invana/graph-layout-elkjs` — ELK.js layout

**Status: skeleton.** Planned:

```ts
const layout = new ElkLayout({ algorithm: 'layered' });
await layout.apply(graphLayer);
```

One-shot — no tick simulation. Single `apply()` call.

## `@invana/graph-datasets` — example graph data

**Status: skeleton.** Planned datasets to port: Les Misérables, Scientists org chart, random tree.

## Building today without domain packages

Until `@invana/graph` ships you compose your own `WorldLayer` subclass and call `PrimitivesRenderer` directly. See [Getting Started](./getting-started.md) and [Layers](./layers.md) for the pattern — the renderer carries you a long way before you actually need a `GraphLayer` abstraction. Domain typing, ColumnStore-backed bulk data, and the prepared sugar methods are what the dedicated package adds.

## Versioning

All packages are currently `0.0.1` and unpublished. Treat the API surface as stable in shape but expect renames as the domain packages land.
