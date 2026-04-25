# RFC: @invana/canvas — Feature Roadmap

**Status:** Draft  
**Date:** 2026-04-25  
**Author:** Invana Team

---

## Overview

This RFC catalogues the full set of features targeted for the `@invana/canvas` ecosystem — the engine (`@invana/canvas`) and its plugins (`@invana/plugin-graph`, `@invana/plugin-maps`, etc.). Features are grouped by domain. Each group lists individual capabilities; the intent is to drive prioritisation and implementation planning, not to prescribe implementation order.

---

## Table of Contents

1. [Graph Operations](#1-graph-operations)
2. [Node Styles](#2-node-styles)
3. [Edge Styles](#3-edge-styles)
4. [Text Styles](#4-text-styles)
5. [Layers & Overlays](#5-layers--overlays)
6. [Interaction](#6-interaction)
7. [Animations](#7-animations)
8. [Layouts](#8-layouts)
9. [Transformations & Grouping](#9-transformations--grouping)
10. [Analysis](#10-analysis)
11. [Geo Mode](#11-geo-mode)
12. [Timeline](#12-timeline)
13. [Data Import / Export](#13-data-import--export)
14. [Image Export](#14-image-export)
15. [UI & Controls](#15-ui--controls)
16. [Performance](#16-performance)
17. [Integrations](#17-integrations)
18. [Graph Generators](#18-graph-generators)
19. [Gallery / Complex Demos](#19-gallery--complex-demos)

---

## 1. Graph Operations

Core CRUD and lifecycle operations on the graph data model.

| Feature | Description |
|---|---|
| Load graph | Initialise the canvas with a full graph payload |
| Read nodes and edges | Query the in-memory graph model |
| Count nodes and edges | Aggregate statistics |
| Add node | Programmatically insert a node at runtime |
| Add edge | Programmatically insert an edge at runtime |
| Remove node | Delete a node and its incident edges |
| Remove edge | Delete a single edge |
| Set data | Replace or merge the full graph dataset |
| Clear | Reset the canvas to an empty state |
| Undo / Redo | History stack for reversible graph mutations |

---

## 2. Node Styles

Visual properties that can be set per-node, per-class, or via data-driven rules.

| Feature | Description |
|---|---|
| Radius | Node size |
| Color | Fill color (solid, data-driven) |
| Color pie | Multi-segment pie chart encoded as a node fill |
| Shape | Circle, square, diamond, triangle, star, pentagon, cross, and more |
| Text / Label | Primary label text, font, placement |
| Stroke | Border color and width |
| Outline | Outer glow / outline ring distinct from stroke |
| Icon | Icon overlaid at the center of the node (font icon or SVG) |
| Image | Texture fill from a URL or data-URI |
| Badge | Small indicator attached to a corner of the node |
| Halo | Glow effect for emphasis |
| Pulse | Animated radial pulse ring for live / alert states |
| Custom charts | Bar charts, line sparklines, or arbitrary SVG rendered inside the node |
| Theme presets | Named color + shape themes applied globally or per class |
| Zoom-dependent styles | Style rules that activate or interpolate based on camera zoom level (LOD) |
| Z-index | Explicit draw-order override per node or class |

### Ports

Named connection points on a node that constrain where edges anchor. Used in flowcharts, ER diagrams, pipeline editors, and any diagram where edge attachment position matters.

**Port groups** — a group defines shared defaults (style, layout, label layout, z-index) for a set of ports; individual ports inherit and can override.

**Port layouts** — how ports are distributed around the node boundary:

| Layout | Description |
|---|---|
| `absolute` | Exact `x` / `y` placement; supports percentage-based offsets |
| `left` / `right` / `top` / `bottom` | Evenly distribute ports along the named edge of a rectangular node |
| `line` | Evenly distribute along an arbitrary line segment |
| `ellipse` | Distribute around an elliptical arc from a start angle with configurable step |
| `ellipseSpread` | Uniformly spread around the full ellipse with rotation compensation |
| custom | Register a custom layout function via the plugin API |

**Port label layouts** — where the port's text label sits:

| Layout | Description |
|---|---|
| `left` / `right` / `top` / `bottom` | Label to the respective side of the port |
| `inside` / `outside` | Label inside or outside the node boundary |
| `insideOriented` / `outsideOriented` | Same as above with text rotated to follow the node edge |
| `radial` / `radialOriented` | For circular/elliptical nodes; optional arc-direction text rotation |
| custom | Register a custom label layout function |

**Port features:**

| Feature | Description |
|---|---|
| Visibility | Show always, on hover only, or never |
| Styling | Per-port or per-group color, size, shape, stroke |
| Dynamic ports | Add or remove ports at runtime |
| Connection constraints | Allow or deny connections per port by direction (source / target) or type |
| Connection validation | Per-port predicate that accepts or rejects an edge during interactive connect |
| Compensation | Auto-adjust port positions when the node is resized |
| Snapping | Snap an edge endpoint to the nearest valid port during drag-connect |
| Interaction | Hover and click events on individual ports |
| Tooltip | Show a tooltip on port hover |

---

## 3. Edge Styles

Visual and geometric properties for edges / connectors, including how their paths are computed and rendered.

### Basic Styles

| Feature | Description |
|---|---|
| Width | Stroke thickness |
| Color | Solid or data-driven edge color |
| Text / Label | Edge label text |
| Badge | Small indicator on the edge path |
| Outline | Outer border on the edge stroke |
| Halo | Glow emphasis |
| Pulse | Animated pulse traveling along the edge (flow visualization) |
| Parallel edges | Bundled parallel edges between the same pair of nodes |
| Arrow size | Control arrowhead scale independent of stroke width |
| Zoom-dependent text | Show/hide or resize edge labels based on zoom level |
| Offset | Connector offset from node boundary |

### Routers

Routers compute the intermediate waypoints of an edge path before it is rendered. Decoupled from how the path is drawn (that is the connector's responsibility).

| Router | Description |
|---|---|
| `normal` | Pass-through — returns input vertices unchanged; default for simple straight edges |
| `orth` | Orthogonal routing — all segments are strictly horizontal or vertical; supports configurable `padding` from node boundary |
| `oneSide` | Strict three-segment orthogonal route that exits from one specified side (`left` / `right` / `top` / `bottom`) of the source node |
| `manhattan` | Smart obstacle-avoiding orthogonal router; avoids other nodes using A\*; configurable `step`, `startDirections`, `endDirections`, `excludeTerminals`, `excludeShapes`, and fallback |
| `metro` | Obstacle-avoiding router mixing orthogonal and 45° diagonal segments (subway-map aesthetic); same options as `manhattan` with default `maxDirectionChange: 45°` |
| `er` | Zigzag diagonal segments designed for entity-relationship diagrams; configurable `offset`, `min` distance, and `direction` |
| custom | Register an arbitrary routing function via `registerRouter()` — receives `(vertices, args, view)` and returns a point array |

### Connectors

Connectors control how the route waypoints are drawn as a final SVG / canvas path.

| Connector | Description |
|---|---|
| `normal` | Straight line segments connecting all route points in sequence |
| `smooth` | Cubic Bézier curve through all route points; optional `direction` lock to `H` (horizontal) or `V` (vertical) |
| `rounded` | Straight segments with arc fillets at each bend; configurable `radius` (default 10) |
| `jumpover` | Straight segments with a jump symbol at each crossing edge; `type` is `arc` / `gap` / `cubic`; configurable `size` and fillet `radius` |
| custom | Register an arbitrary path-building function via `registerConnector()` — receives `(sourcePoint, targetPoint, routePoints, args)` and returns a path |

### Markers

Markers are decorators rendered at the source or target endpoint of an edge (arrowheads, terminals).

| Marker | Description |
|---|---|
| `block` | Solid filled arrowhead; configurable `width`, `height`, `offset`, open / closed variants |
| `classic` | Classic hollow arrowhead; configurable dimensions and offset |
| `diamond` | Diamond-shaped tip; configurable `size` and positioning |
| `cross` | Cross / × tip; configurable `size` and offset |
| `async` | Asymmetric arrowhead for async / one-way flow notation; supports `flip`, `open`, `width`, `height`, `offset` |
| `circle` | Circular terminal; configurable `radius` and fill / stroke |
| `circlePlus` | Circle with an internal `+` symbol |
| `ellipse` | Elliptical terminal with independent `rx` / `ry` radii |
| `path` | Fully custom marker defined by arbitrary SVG path data; configurable `offsetX` / `offsetY` |
| custom SVG | Any SVG element (`path`, `rect`, `polygon`, `polyline`, `image`, `circle`, `ellipse`) used as a marker via `tagName` + SVG attributes |
| custom registered | Register a reusable parameterised marker factory by name via `registerMarker()` |

---

## 4. Text Styles

Fine-grained typography controls shared by both node and edge labels.

| Feature | Description |
|---|---|
| Font family | Custom web fonts or system fonts |
| Font style | Bold, italic, normal |
| Color | Per-element text color |
| Size | Absolute or zoom-relative font size |
| Centered text | Lock text to node center regardless of node size |
| Position | Label placement: top, bottom, left, right, center, custom offset |
| Multiline | Automatic or manual line-break support |
| Background | Pill / rect background behind label text for readability |
| Secondary label | A second, smaller line of text below the primary label |
| RTL support | Right-to-left text rendering |

---

## 5. Layers & Overlays

DOM/canvas layers rendered above or below the graph for custom UI, annotations, and integrations.

| Feature | Description |
|---|---|
| Free drawing | Freehand pen/pencil layer for markup |
| Category annotation | Color-coded region annotations tied to node groups |
| Distance annotation | Ruler / distance measurement overlay |
| Overlays + annotations | Combined overlay system with stacking |
| Context menu (layer) | Right-click context menu rendered as a positioned DOM overlay |
| Editable notes | Sticky-note overlays with in-place edit forms |
| Text on edge extremities | Source/target labels at each end of an edge |
| Edge badges (layer) | DOM-positioned badge overlays on edges |
| Flowlines | Animated flow lines showing direction/throughput on edges |
| Diagram shapes | Generic diagram elements (boxes, swimlanes, etc.) on a canvas layer |
| D3 integration | Render D3.js visualizations as a canvas layer |
| Density contours | Kernel-density estimation contour layer |
| Konva.js integration | Konva stage mounted as a canvas layer |
| PixiJS integration | PixiJS scene mounted as a canvas layer |
| Cluster annotation | Visual region/hull annotations around clusters |
| Blueprint overlay | Background grid / blueprint rendering |
| Animated edges (layer) | Complex animated edge paths via overlay |
| Async node metadata | Load and display node details asynchronously as overlays |
| Identity card nodes | Rich DOM identity-card panels anchored to nodes |
| Org-chart DOM nodes | DOM-based rich node templates for org charts |
| Annotations plugin | Standalone plugin exposing the full annotation API |

---

## 6. Interaction

User input handling, selection, and manipulation of graph elements.

| Feature | Description |
|---|---|
| Hover | Highlight node or edge on cursor hover |
| Click | Single-click event on node, edge, or background |
| Select | Click to select individual elements |
| Disabled state | Prevent interaction on specific nodes/edges |
| Panning | Drag the viewport to pan the scene |
| Rectangle selection | Drag a selection box to multi-select |
| Lasso selection | Free-form lasso to multi-select nodes |
| Selection API | Programmatic get/set/clear of the selected set |
| Custom selection style | Override highlight style for selected elements |
| Drag nodes | Move individual nodes by dragging |
| Badge interactions | Click and hover events on node/edge badges |
| Node resizing | Drag handles to resize a node |
| Container resizing | Resize the canvas container and relayout |
| Edge rewiring | Drag an edge endpoint to reconnect it to a different node or port |
| Group selection | Select and drag multiple nodes together |
| Connect nodes | Draw a new edge by dragging from one node (or port) to another |
| Keyboard interactions | Keyboard shortcuts for select all, delete, zoom, etc. |
| Draggable / non-draggable | Lock specific nodes in place |
| Node snapping | Snap dragged nodes to a grid or other nodes |
| Port snapping | Snap an edge endpoint to the nearest valid port during drag-connect |
| Halo masking | Prevent halo from rendering through node fill |
| Fast highlight | GPU-accelerated highlight on hover (large graphs) |
| Hold-space-to-drag | Temporarily switch to pan mode while spacebar is held |
| Scroll to pan | Use scroll wheel for panning instead of zooming |

---

## 7. Animations

Tween and transition APIs for nodes, edges, and the camera. Animations are driven by a frame-rate-independent `AnimationTicker` (PixiJS ticker). Each animation type is a registered handler that writes into a per-shape `_animOverrides` object; the shape's draw loop reads overrides on every frame without extra allocations. Multiple animation types can run concurrently on the same shape.

### Shape / Node / Edge Animations

| Animation | Target property | Mechanism | Default duration | Loops |
|---|---|---|---|---|
| `breathe` | `scale` | Sine-wave oscillation around 1.0 | 2 000 ms / cycle | infinite |
| `pulse` | Halo rings (3 staggered) | Radial rings expand from shape center, fade alpha as they grow | 1 200 ms / cycle | infinite |
| `fadeIn` | `alpha` | Linear interpolation from a start opacity to 1.0 (wall-clock time) | 400 ms | once |
| `colorCycle` | Fill color | Discrete steps through a user-supplied color palette | 800 ms / step | infinite |
| `marchingAnts` | `dashOffset` | Dashes march around the border in alternating directions (bidirectional) | 360 perimeter units | infinite |
| `dashedFlow` | `dashOffset` | Dashes flow in one direction only (positive or negative); models data flow / current | 360 perimeter units | infinite |
| `borderGlow` | `borderWidth` | Sine-wave oscillation between `minWidth` and `maxWidth` | 1 000 ms / cycle | infinite |
| Animated halo (spec) | Halo redraw | Spec flag `halo.animated: true`; halo rings redrawn each tick | 1 500 ms / cycle | infinite |

**Common options shared by all shape animations:**

| Option | Type | Default | Notes |
|---|---|---|---|
| `duration` | `number` (ms) | animation-specific | Length of one cycle |
| `repeat` | `number` | `-1` | `-1` = infinite; positive integer = fixed cycle count then auto-stop |
| `color` | `string` (hex) | shape fill / border color | Color override where supported |

**Animation-specific options:**

| Animation | Extra options |
|---|---|
| `breathe` | `amplitude` — max scale delta (default `0.1` = ±10%) |
| `pulse` | `maxRadius` — max expansion beyond shape boundary in px (default `40`) |
| `fadeIn` | `from` — starting alpha 0–1 (default `0`) |
| `colorCycle` | `colors` — required array of hex strings |
| `marchingAnts` | `speed` — dash-offset increment per frame in px (default `1`) |
| `dashedFlow` | `speed` — offset per frame (default `1`); `direction` — `1` forward / `-1` reverse |
| `borderGlow` | `minWidth` (default `1`), `maxWidth` (default `6`) — stroke width range |

**API:**

```typescript
// Start one or more animations on a shape (node or edge element)
shapes.animate(id, {
  breathe:      { amplitude: 0.15, duration: 1800 },
  pulse:        { color: '#FF4444', maxRadius: 50, duration: 1000 },
  fadeIn:       { duration: 600, from: 0, repeat: 1 },
  colorCycle:   { colors: ['#FF0000', '#00FF00', '#0000FF'], duration: 600 },
  marchingAnts: { speed: 2, color: '#FFFFFF' },
  dashedFlow:   { speed: 1.5, direction: -1 },
  borderGlow:   { minWidth: 1, maxWidth: 8, duration: 800 },
});

// Stop a specific animation type (or all if animType omitted)
shapes.stopAnimation(id, 'pulse');
shapes.stopAnimation(id); // stops all
```

**Spec-driven halo animation (declarative, no API call needed):**

```typescript
shapeSpec.halo = {
  color: '#FFFFFF',
  radius: 20,
  alpha: 0.6,
  animated: true,   // enables per-tick redraw
  duration: 1500,
};
```

### Camera Animations

| Feature | Description |
|---|---|
| Camera pan / zoom | Animate pan (`x`, `y`), zoom (`scale`), or both simultaneously via pixi-viewport's easing engine |
| Animate to bounds | Smoothly zoom/pan the camera to fit a given bounding box (`fitContent`) |

**Camera animation options:**

| Option | Type | Default | Notes |
|---|---|---|---|
| `x` | `number` | current | Target world-space X |
| `y` | `number` | current | Target world-space Y |
| `scale` | `number` | current | Target zoom (1.0 = 100 %) |
| `duration` | `number` (ms) | `500` | Animation duration |
| `ease` | `string` | `'easeInOut'` | Any easing name supported by pixi-viewport |

**Events fired:**

| Event | Payload |
|---|---|
| `camera:animate-start` | `{ x, y, scale }` — target values at start |
| `camera:animate-end` | — fires after `duration` ms |

```typescript
canvas.camera.animate({ x: 100, y: 200, scale: 1.5, duration: 800, ease: 'easeInOut' });
canvas.camera.fitContent(padding);  // zoom-to-fit with smooth transition
```

---

## 8. Layouts

Automatic graph layout algorithms and controls.

| Feature | Description |
|---|---|
| Force layout (CPU) | Physics-based force-directed layout |
| Force layout (GPU) | GPU-accelerated force layout for large graphs |
| Force layout GPU vs CPU | Benchmark / comparison mode |
| Force layout (large graph) | Optimized force layout for 100k+ elements |
| Force layout auto-stop | Automatically halt simulation when energy drops |
| Force layout with masses/weights | Custom node mass and edge weight influence |
| Force layout automatic settings | Auto-tune force parameters from graph structure |
| Grid layout | Place nodes on a regular grid |
| Concentric layout | Nodes arranged in concentric circles by a metric |
| ForceLink layout | ForceLink (D3-style) spring layout |
| Continuous ForceLink | Live-updating spring layout |
| Hierarchical layout | Top-down / left-right tree/DAG layout |
| Hierarchical advanced | Multi-root, compound hierarchical layout |
| Hierarchical sort siblings | Sort sibling nodes by a property |
| Hierarchical pack siblings | Pack siblings compactly |
| Hierarchical pack sitemap | Sitemap-style hierarchical packing |
| Sequential layout | Linear sequential arrangement |
| Radial layout | Nodes arranged radially around a focus node |
| Local grid | Apply grid to a selection without moving the rest |
| Local ForceLink | Apply ForceLink to a selection only |
| Local force | Apply force to a selection only |
| Local concentric | Apply concentric to a selection only |
| Local radial | Apply radial to a selection only |
| Incremental ungrouping | Expand groups incrementally with layout |
| Incremental expand | Expand collapsed subgraphs with animated layout |
| Expand with pinning | Expand while pinning existing nodes in place |
| Remove node overlap | Post-layout step to eliminate node overlaps |
| Circular layout (plugin) | Plugin-provided circular arrangement |
| Circle-packing layout | Nested circle-packing for hierarchies |
| Expand/collapse in place | Toggle subtrees without full re-layout |
| In-place resize | Resize a node and adjust neighbors in place |

---

## 9. Transformations & Grouping

Higher-level data transformations applied on top of the raw graph.

| Feature | Description |
|---|---|
| Filter nodes | Hide nodes matching a predicate |
| Filter edges | Hide edges matching a predicate |
| Group nodes | Collapse multiple nodes into a single aggregate node |
| Group edges | Collapse parallel edges into a single aggregate edge |
| Visual grouping | Draw a hull around a logical group without collapsing |
| Visual grouping clustering | Auto-cluster nodes and draw hulls |
| Visual grouping manual | User-defined visual groups |
| Visual grouping highlight | Highlight a visual group on hover |
| Visual grouping expand/collapse | Toggle hull expand/collapse |
| Group on zoom | Auto-collapse groups when zooming out |
| Onion decomposition | Layer graph by k-core / onion decomposition |
| Clustering middleware | Plug-in clustering strategy |
| Node collapsing | Collapse a node and its subtree |
| Neighbor merging | Merge highly-connected neighbors into a supernode |
| Neighbor generation | Lazily expand neighbors from a source node |
| Virtual properties | Compute derived properties without mutating data |
| Transformation pipeline | Chain multiple transformations in sequence |
| Multilevel grouping | Nested / hierarchical grouping |
| Visual grouping geo | Visual groups in geo mode |
| Drilldown API | Programmatic expand/collapse for grouping hierarchies |
| Group layout optimization | Optimize intra-group layout |
| Easy grouping | Simplified grouping API for common cases |

---

## 10. Analysis

Built-in graph analysis algorithms.

| Feature | Description |
|---|---|
| Data-driven styles | Map node/edge properties to visual styles automatically |
| Shortest path | Highlight the shortest path between two nodes |
| Cycle detection | Identify and highlight cycles |
| Weakly connected components | Partition graph into WCCs |
| Data lineage | Trace upstream/downstream data dependencies |
| Minimum spanning tree | Compute and highlight the MST |
| BFS / DFS traversal | Breadth-first and depth-first traversal with step-by-step visualization |
| Betweenness centrality | Compute and encode betweenness as a node style |
| Other centrality measures | Degree, closeness, eigenvector, PageRank |

---

## 11. Geo Mode

Geographic map integration for spatially embedded graphs.

| Feature | Description |
|---|---|
| Geographical mode | Overlay the graph on a tile-based map |
| Dynamic geo base maps | Switch base map providers at runtime |
| Geo clustering | Cluster nodes by geographic proximity |
| Indoor maps | Floor-plan map support |
| Vector layers / GeoJSON | Render GeoJSON features as a map layer |
| Vector tiles | Tile-based vector map rendering |
| Native map provider layers | First-class integration with Mapbox-style layers |
| Third-party basemap (ESRI / ArcGIS) | ArcGIS and ESRI basemap support |
| ESRI vector tiles | ESRI vector tile layer |
| Geo mode + heatmap | Kernel-density heatmap on the geo layer |
| Geo mode + marker clustering | Geographic marker clustering layer |
| Transport network (geo) | Graph overlaid on a transit/road network map |
| Show overlapping nodes | Spread or highlight co-located nodes in geo mode |
| Visual grouping (geo) | Visual hulls in geo coordinate space |
| Geo mode + layouts | Run layouts while respecting geographic constraints |
| PNG export with geo map | Rasterize graph + map tile as a single PNG |

---

## 12. Timeline

Time-based visualization and playback.

| Feature | Description |
|---|---|
| Timeline control | Interactive timeline scrubber linked to graph state |
| Time layout | Arrange nodes on a horizontal time axis |
| Timeline animation | Animate graph evolution along a time axis |
| Node lifespans | Show nodes only within their start/end time range |

---

## 13. Data Import / Export

Read and write graph data in industry-standard formats.

### Import (Data Translators)

| Format | Notes |
|---|---|
| JSON | Generic JSON graph format |
| GEXF | Gephi Exchange Format |
| GraphML | XML-based graph format |
| MTX | Matrix-market sparse format |
| CSV | Nodes + edges as flat CSV files |
| Excel (.xlsx) | Nodes + edges as Excel spreadsheets |
| Custom JSON | User-defined JSON shape via mapping config |
| Neo4j Cypher | Load graph from a Neo4j Cypher query result |
| Google Spanner | Load graph from a Spanner SQL result |
| SPARQL to JSON | Load graph from a SPARQL endpoint |

### Export (Data)

| Format | Notes |
|---|---|
| JSON | Serialize current graph to JSON |
| CSV | Export nodes/edges as CSV |
| Excel (.xlsx) | Export nodes/edges as Excel |
| Excel (advanced) | Multi-sheet, styled Excel export |
| GEXF | Export to GEXF |
| GraphML | Export to GraphML |

---

## 14. Image Export

Rasterize or vectorize the canvas to a static image.

| Feature | Description |
|---|---|
| PNG export | Full-canvas raster screenshot |
| Export selection only | Crop PNG to the selected elements |
| PNG with watermark | Overlay a logo/text watermark on export |
| SVG export | Vector SVG output |
| PNG with geographical map | Composite graph + map tile into PNG |
| PNG with geo map + vector layers | Include vector tile layers in the composite PNG |
| PDF export | PDF page containing the rendered graph |
| Canvas layer export | Export a specific layer independently |

---

## 15. UI & Controls

Built-in UI components and canvas settings.

| Feature | Description |
|---|---|
| Background color | Configurable canvas background |
| Dark mode | Automatic dark-mode style set |
| Cursor style | Custom CSS cursor per interaction state |
| Fullscreen | Toggle fullscreen mode |
| Settings panel | All-settings configuration panel |
| Tooltip | Hover tooltip with HTML content |
| Tooltip (template) | Mustache/template-based tooltip rendering |
| Legend | Auto-generated or custom visual legend |
| Branding / watermark | Logo overlay on the canvas |
| Scrollable page | Canvas embedded inside a scrollable page layout |
| Fuzzy search | Search nodes/edges by fuzzy text match |
| Import progress bar | Progress indicator during large graph loads |
| Context menu (UI) | Right-click context menu with action items |
| Node label editing | In-place label edit via double-click |
| Minimap / Overview | Thumbnail overview control in a corner |
| Drag and drop | Drop files onto canvas to import |

---

## 16. Performance

Features and demos focused on handling large graphs efficiently.

| Feature | Description |
|---|---|
| GPU-accelerated layout | Offload force layout computation to the GPU |
| Large graph rendering | Stable 60 fps with 100k+ nodes/edges |
| Filtering performance | High-throughput filter/unfilter on large graphs |
| Fast highlight | GPU path for hover highlight without style recalc |
| Force layout auto-stop | Halt simulation when kinetic energy falls below threshold |
| Culling (RBush) | Spatial index–based off-screen culling |
| LOD (zoom-dependent styles) | Reduce detail at low zoom to cut draw calls |
| `cacheAsTexture` | Cache static subtrees as GPU textures |
| `renderGroup` | Batch draw calls within render groups |
| Dirty-flag batching | Skip style recomputation for unchanged elements |
| RenderTexture pooling | Reuse GPU textures to reduce allocation pressure |
| WebWorker layout | Run layout algorithms off the main thread |
| GPU instancing | Instance-based rendering for homogeneous node sets |

---

## 17. Integrations

First-class bindings to popular frameworks and libraries.

| Feature | Description |
|---|---|
| React | Official React component wrapper |
| React + Minimap | React component with built-in minimap |
| D3.js | D3 scale/layout/force interop |
| Konva.js | Konva stage as an overlay layer |
| PixiJS (layer) | PixiJS scene as an overlay layer |
| Mapbox / MapLibre | Vector map tile rendering |
| ESRI / ArcGIS | ESRI basemap and vector tile support |

---

## 18. Graph Generators

Utility functions for generating synthetic graphs for testing and demos.

| Generator | Description |
|---|---|
| Random | Erdős–Rényi random graph |
| Grid | Regular 2-D grid graph |
| Tree | Balanced or random-branching tree |
| Small world | Watts–Strogatz small-world graph |
| Power law | Barabási–Albert preferential-attachment graph |

---

## 19. Gallery / Complex Demos

End-to-end reference applications demonstrating real-world use cases.

| Demo | Description |
|---|---|
| Transport network analysis | Multi-layer transit graph with geo overlay |
| Fraud detection | Bipartite fraud ring visualization |
| Supply chain | Multi-hop supplier graph with risk scoring |
| Cyber security log analysis | Event-correlation graph from syslog data |
| IT management | Service-dependency map |
| Anti-money laundering | Transaction flow graph with clustering |
| iPhone parts origin | Supply chain provenance graph |
| Draw your graph | Interactive graph editor from scratch |
| Parallel view | Two synchronized canvas instances side by side |
| Real-time collaboration | Multi-user graph editing via WebSocket |
| Annotations demo | Full annotation workflow |
| AI classification | Node classification with ML-derived style mapping |
| AI recommendation | Graph-based recommendation system |
| Accessibility | ARIA-compliant graph navigation |
| Neighborhood highlight | Highlight ego-network on hover |
| US Airlines | Airport route graph on a geo map |
| Visual grouping of large web | Clustered web-scale graph |
| Radial layout on transport network | Radial layout applied to a transit graph |
| Multiple canvas instances | Several independent canvas instances on one page |
| Flowchart / diagram editor | Port-based diagram editor with routers and connectors |
| ER diagram | Entity-relationship diagram using ports and `er` router |
| Pipeline editor | DAG pipeline with port connection constraints and validation |

---

## Implementation Priority

Suggested order for phased delivery across packages:

**Phase 1 — Engine core (`@invana/canvas`)**
- Graph operations (CRUD, undo/redo)
- Node + edge + text styles (all properties)
- Markers (block, classic, diamond, circle, path, custom)
- Basic connectors (normal, smooth, rounded)
- Interaction (hover, click, select, drag, pan, zoom)
- Basic animations (node, edge, camera)
- Force + hierarchical layouts
- UI controls (background, fullscreen, minimap, tooltip)
- PNG / SVG export

**Phase 2 — Graph plugin (`@invana/plugin-graph`)**
- Ports (groups, layouts, label layouts, visibility, constraints, validation)
- Routers (normal, orth, oneSide, manhattan, metro, er, custom)
- Advanced connectors (jumpover, custom)
- Additional markers (async, circlePlus, ellipse, custom SVG, custom registered)
- Transformations (filter, group, collapse, virtual properties)
- Analysis algorithms (shortest path, WCC, centrality)
- Advanced layouts (radial, concentric, circle-packing, local layouts)
- Layers + overlays (annotations, flowlines, context menu)
- Data import/export (JSON, CSV, Excel, GEXF, GraphML)
- Performance (LOD, culling, GPU layout, dirty-flag batching)

**Phase 3 — Ecosystem plugins**
- `@invana/plugin-maps` — geo mode, vector layers, clustering
- `@invana/plugin-layout-force` — GPU force, ForceLink, auto-stop
- Timeline plugin
- React / framework integrations
- Advanced export (PDF, watermark, geo composite PNG)
- Gallery demos (flowchart editor, ER diagram, pipeline editor)

---

## Open Questions

1. **Undo/redo scope** — should history live in the engine or in `plugin-graph`?
2. **Geo mode** — integrate as a built-in layer or a separate `@invana/plugin-maps` package?
3. **Timeline** — data model: event-sourced graph or time-indexed snapshots?
4. **GPU instancing** — limit to node rendering only, or also edges?
5. **AI features** — first-party ML inference or thin integration hooks for external models?
6. **Collaboration** — CRDT-based or server-authoritative?
7. **Ports** — should port definitions live on the node data model or in the plugin layer? How do ports serialise to JSON/GraphML?
8. **Routers** — manhattan router requires obstacle data; should it share the spatial index (RBush) used for culling, or maintain its own?
9. **Markers** — SVG-only or also WebGL/WebGPU instanced markers for performance at scale?
