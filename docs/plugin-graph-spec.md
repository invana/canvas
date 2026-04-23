# plugin-graph — Package Specification

**Package:** `@invana/plugin-graph`  
**Depends on:** `@invana/plugin-elements` → `@invana/canvas` (canvas-core-new)  
**Inspired by:** AntV G6 v5, AntV X6 v2  
**Renderer:** WebGL2 / WebGPU (via PixiJS v8) — **no DOM, no HTML, no SVG, no React**. All rendering is GPU-accelerated canvas only.

`@invana/plugin-graph` is Layer 3 in the canvas plugin stack. It adds graph domain semantics (nodes, edges, directed relationships, layouts, selection, behaviors) on top of `@invana/plugin-elements`. It has zero `pixi.js` imports — all rendering goes through `ElementPlugin`.

See [plugin-elements-spec.md](./plugin-elements-spec.md) for the Layer 2 spec (`BaseSolid`, `BaseConnector`, `DrawContext`, `ElementPlugin` API, event chain).

---

## Architecture Overview

`GraphPlugin` is a single `CanvasPlugin` registered on a `Canvas` instance. It depends on `ElementPlugin` for all rendering and translates `element:*` events into graph-semantic `node:*` / `edge:*` events.

```
@invana/canvas  (Canvas)
  ├── BackgroundPlugin              ← built into @invana/canvas
  │
  ├── ElementPlugin                 ← @invana/plugin-elements
  │     BaseSolid instances:  CircleElement, RectElement, PolygonElement, …
  │     BaseConnector instances: StraightConnector, BezierConnector, …
  │     StyleResolver, LODController, HaloPool, AnimationTicker, RBush
  │
  └── GraphPlugin                   ← @invana/plugin-graph (depends on ElementPlugin)
        NodeManager   — CRUD, geometry, states, animations for nodes
        EdgeManager   — CRUD, routing, states, animations for edges
        SelectionManager — selection state, lasso, rubber-band
        BehaviorManager  — drag-node, click-select, create-edge, …
        LayoutRunner     — runs layout adapters, animates to result
```

`GraphPlugin` calls only the `ElementPlugin` public API (`addSolid`, `addConnector`, `update`, `remove`, `animate`, `getCenter`, `getConnectionPoint`, `setState`). It never calls `DrawContext` or `StyleResolver` directly.

**Registration pattern:**

```ts
import { Canvas } from '@invana/canvas';
import { ElementPlugin } from '@invana/plugin-elements';
import { GraphPlugin } from '@invana/plugin-graph';
import { D3ForceLayout } from '@invana/plugin-layout-force';

const canvas = new Canvas({ container, width: 800, height: 600 });
await canvas.init();

await canvas.plugins.register(new ElementPlugin({ key: 'elements' }));

const graph = new GraphPlugin({
  key: 'graph',
  directed: true,
  defaultNodeStyle: { shape: 'circle', size: 40 },
  defaultEdgeStyle: { pathType: 'autoBezier', stroke: { width: 1.5 } },
  behaviors: ['drag-node', 'click-select', 'zoom-canvas'],
});
await canvas.plugins.register(graph);

graph.setData({ nodes: [...], edges: [...] });
graph.setState('n1', 'selected', true);
graph.animate('n1', { pulse: { color: '#ff0000' } });
await graph.layout(new D3ForceLayout());
graph.fitView();
```

**Multiple plugins on the same canvas:**

```ts
await canvas.plugins.register(new BackgroundPlugin({ type: 'pattern', patternType: 'dots' }));
await canvas.plugins.register(new ElementPlugin({ key: 'elements' }));
await canvas.plugins.register(graph);

// Future: graph on top of a map tile layer
await canvas.plugins.register(new MapPlugin({ tileSource: '...' }));
await canvas.plugins.register(graph);
```

---

## 1. Node Shapes (Solid Shapes)

### 1.1 NodeSpec

```ts
interface NodeSpec {
  // Identity
  id: string;

  // Position (world-space pixels)
  x: number;
  y: number;

  // Shape variant
  shape: NodeShapeType;   // see §1.2
  size?: number;          // uniform size; overridden by width/height for rects
  width?: number;
  height?: number;
  cornerRadius?: number;  // rect only

  // Visual
  fill?: FillSpec;        // solid | linear | radial | texture | icon
  border?: BorderSpec;    // color, width, alpha, dash
  halo?: HaloSpec;        // hover halo ring

  // Label
  label?: NodeLabelSpec;  // see §1.3

  // Ports (connection anchors)
  ports?: PortSpec[];     // see §1.4

  // State overrides (applied on top of base style)
  states?: Partial<Record<NodeState, NodeStateStyle>>;

  // Animations
  animations?: NodeAnimations;  // see §1.6

  // Meta
  data?: Record<string, unknown>;
  zIndex?: number;
  interactive?: boolean;
  cursor?: 'pointer' | 'grab' | 'default' | 'crosshair' | 'move';
  draggable?: boolean;
}
```

### 1.2 NodeShapeType

Grouped by underlying `plugin-elements` solid class:

| Group | `shape` values | Solid class |
|---|---|---|
| **Circle family** | `'circle'`, `'dottedCircle'`, `'dashedCircle'` | `CircleElement` / `DashedCircleElement` |
| **Rect family** | `'rect'`, `'roundedRect'`, `'dottedRect'`, `'dashedRect'` | `RectElement` / `DashedRectElement` |
| **Polygon family** | `'polygon'`, `'hexagon'`, `'diamond'` | `PolygonElement` (sides: 6, 4) |
| **Star family** | `'star'` | `StarElement` |
| **Effects** | `'circleGlow'`, `'rippleRing'` | `CircleGlowElement` / `RippleRingElement` |
| **Custom** | `'custom'` | class registered via `elementPlugin.registerElement()` |

### 1.3 NodeLabelSpec

```ts
interface NodeLabelSpec {
  text: string;
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';  // default: 'center'
  offset?: { x?: number; y?: number };
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  color?: string;
  background?: {
    color: string;
    padding?: number;
    cornerRadius?: number;
  };
  maxWidth?: number;       // truncate + ellipsis
  visible?: boolean;       // LOD-independent override
}
```

Labels appear automatically at LOD `DETAIL` (zoom ≥ 1.5). `visible: true` forces them at all LOD levels.

### 1.4 Port System

Ports are named connection anchors on a node. Edges attach to a port by name, not raw coordinates.

```ts
interface PortSpec {
  id: string;                                             // unique within the node

  // Placement
  position?: 'top' | 'right' | 'bottom' | 'left'        // cardinal
            | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'  // corners
            | { x: number; y: number };                  // custom ratio (0–1)

  // Distributed ports — evenly space N ports along the shape perimeter
  distribution?: {
    type: 'uniform';
    count: number;
    side?: 'top' | 'right' | 'bottom' | 'left' | 'all'; // default: 'all'
  };

  autoRotate?: boolean;    // rotate port marker to follow perimeter tangent (default: false)

  // Visual
  shape?: 'circle' | 'rect' | 'diamond';
  size?: number;
  fill?: string;
  border?: { color: string; width: number };
  visible?: 'always' | 'hover' | 'never';               // default: 'hover'

  label?: {
    text: string;
    position?: 'inside' | 'outside' | 'left' | 'right';
    fontSize?: number;
    color?: string;
  };
}
```

When an edge specifies `sourcePort` / `targetPort`, the edge endpoint is pinned to that port's computed world position. Without a port, `elementPlugin.getConnectionPoint(id, toX, toY)` computes the closest perimeter point dynamically.

### 1.5 Node States

Multiple states can be active simultaneously; styles are merged in priority order via `StyleResolver`.

```ts
type NodeState = 'default' | 'selected' | 'hovered' | 'active' | 'disabled' | string;

interface NodeStateStyle {
  fill?: FillSpec;
  border?: BorderSpec;
  halo?: HaloSpec;
  opacity?: number;
  size?: number;
  labelColor?: string;
  labelBackground?: string;
}
```

State management delegates to `ElementPlugin`:
```ts
graph.setState('n1', 'selected', true);   // → elementPlugin.setState('n1', 'selected', true)
graph.clearState('n1', 'selected');
graph.clearAllStates('n1');
graph.getStates('n1'): NodeState[];
```

### 1.6 Node Animations

```ts
interface NodeAnimations {
  fadeIn?: FadeInOptions;
  breathe?: BreatheOptions;
  colorCycle?: ColorCycleOptions;       // cycles fill.color through a palette
  pulse?: PulseOptions;                 // radiating rings from perimeter
  marchingAnts?: MarchingAntsOptions;
  dashedFlow?: DashedFlowOptions;
  borderGlow?: BorderGlowOptions;
}
```

All delegate to `elementPlugin.animate(id, ...)`.

### 1.7 LOD Behavior (Nodes)

Inherits `ElementPlugin` LOD thresholds (configurable per instance):

| LOD Level | Zoom Range | What renders |
|---|---|---|
| `DOT` | < 0.15 | 2 px dot only |
| `FILL_BORDER` | 0.15 – 0.40 | Fill + border only |
| `FULL` | 0.40 – 1.50 | Fill + border + hover halo |
| `DETAIL` | > 1.50 | Everything including label, ports, badges |

---

## 2. Edge Shapes (Connector Shapes)

### 2.1 EdgeSpec

```ts
interface EdgeSpec {
  // Identity
  id: string;

  // Endpoints (by node ID)
  source: string;
  target: string;
  sourcePort?: string;     // port id on source node
  targetPort?: string;     // port id on target node

  // Direction
  directed?: boolean;      // true = arrow at target (default: inherits GraphPlugin.directed)

  // Path type / routing strategy
  pathType?: EdgePathType;  // see §2.2 — default: 'autoBezier'

  // Manual control points (override auto-routing)
  waypoints?: { x: number; y: number }[];   // orthogonal: intermediate bend points
  cpOverride?: { x: number; y: number };    // autoBezier: override auto-computed CP

  // Visual
  stroke?: EdgeStrokeSpec;    // see §2.3
  arrow?: EdgeArrowSpec;      // see §2.4
  labels?: EdgeLabelSpec[];   // see §2.5 — default position: middle of path
  tools?: EdgeTool[];         // see §2.8

  // State overrides
  states?: Partial<Record<EdgeState, EdgeStateStyle>>;

  // Animations
  animations?: EdgeAnimations;  // see §2.6

  // Meta
  data?: Record<string, unknown>;
  zIndex?: number;
  interactive?: boolean;
  cursor?: string;
}
```

### 2.2 EdgePathType

```ts
type EdgePathType =
  | 'straight'          // direct line → StraightConnector
  | 'autoBezier'        // auto-computed cubic bezier → BezierConnector (default)
  | 'bezier'            // user-controlled cubic bezier → BezierConnector
  | 'quadratic'         // quadratic bezier → QuadraticConnector
  | 'orthogonal'        // right-angle routing → OrthogonalConnector
  | 'roundedOrthogonal' // right-angle with rounded corners → OrthogonalConnector
  | 'er'                // ER-diagram style: exits node port center, one elbow
  | 'erCenter'          // ER-center: connects to node center, routes around boundary
  | 'oneSide'           // forces exit/entry from specified sides
  | 'manhattan'         // obstacle-aware orthogonal routing (avoids node bboxes)
  | 'metro'             // Manhattan with 45° diagonals at start/end
  | 'jumpover'          // base path + arc bridges at edge crossings
  | 'custom';           // class registered via elementPlugin.registerConnector()
```

**Routing details:**

| `pathType` | Underlying connector | Control point model |
|---|---|---|
| `straight` | `StraightConnector` | None |
| `autoBezier` | `BezierConnector` | `cpOverride` to pin the CP |
| `bezier` | `BezierConnector` | `waypoints[0]` = cp1, `waypoints[1]` = cp2 |
| `quadratic` | `QuadraticConnector` | `waypoints[0]` = cp |
| `orthogonal` | `OrthogonalConnector` | `waypoints[]` = user bend points; rest auto-routed |
| `roundedOrthogonal` | `OrthogonalConnector` | `cornerRadius` option |
| `er` | `OrthogonalConnector` | `sourceDirection` / `targetDirection` |
| `erCenter` | `OrthogonalConnector` | — |
| `oneSide` | `OrthogonalConnector` | `sourceDirection`, `targetDirection` |
| `manhattan` | `OrthogonalConnector` | `waypoints[]` as forced passes |
| `metro` | `OrthogonalConnector` | — |
| `jumpover` | Any + arc overlays | Applies to `straight` or `orthogonal` base |

### 2.3 EdgeStrokeSpec

```ts
interface EdgeStrokeSpec {
  color?: string;
  width?: number;
  alpha?: number;
  dash?: { length: number; gap: number };
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';

  // Gradient stroke — color transitions from source to target along path
  gradient?: {
    type: 'linear';
    startColor: string;
    endColor: string;
  };

  // Double edge — two parallel lines offset from path centerline
  double?: boolean;
  doubleGap?: number;    // gap between lines in px (default: 4)

  // Shadow/glow behind the stroke
  shadow?: {
    color: string;
    blur: number;
    offsetX?: number;
    offsetY?: number;
    alpha?: number;
  };

  // Fill between double lines (traffic lane / cross-fill style)
  fillBetween?: {
    color: string;
    alpha?: number;
  };
}
```

`gradient`, `double`, `shadow`, and `fillBetween` are resolved by `EdgeManager` before calling `elementPlugin.addConnector()`.

### 2.4 EdgeArrowSpec

Arrowheads are positioned at source/target connection points and auto-rotate to match path tangent.

```ts
interface EdgeArrowSpec {
  source?: ArrowMarker;
  target?: ArrowMarker;
}

type NativeArrowType =
  | 'block'       // filled triangle
  | 'classic'     // open chevron
  | 'open'        // thin open arrow
  | 'diamond'     // filled diamond
  | 'circle'      // filled circle
  | 'circlePlus'  // circle with plus sign
  | 'ellipse'     // filled ellipse
  | 'cross'       // × cross
  | 'async'       // half-open async arrow
  | 'none';

interface ArrowMarker {
  type: NativeArrowType | 'custom';
  customId?: string;     // registered via graph.registerArrow()
  size?: number;
  color?: string;        // defaults to stroke color
  fill?: string;
  alpha?: number;
  offset?: number;       // px gap between arrow tip and node perimeter
  rotate?: number;       // manual rotation offset in degrees
}
```

### 2.5 EdgeLabelSpec

```ts
interface EdgeLabelSpec {
  text: string;
  position?: number | 'start' | 'middle' | 'end';  // 0–1 along path, default: 0.5
  offset?: { x?: number; y?: number };
  autoRotate?: boolean;    // rotate text to follow path tangent (default: false)
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  color?: string;
  background?: { color: string; padding?: number; cornerRadius?: number };
  maxWidth?: number;
  visible?: boolean;
}
```

Multiple labels per edge supported (`labels?: EdgeLabelSpec[]`). Labels appear at LOD `DETAIL` by default.

### 2.6 Edge States

```ts
type EdgeState = 'default' | 'selected' | 'hovered' | 'active' | 'disabled' | string;

interface EdgeStateStyle {
  stroke?: EdgeStrokeSpec;
  arrow?: EdgeArrowSpec;
  opacity?: number;
  labelColor?: string;
}
```

### 2.7 Edge Animations

```ts
interface EdgeAnimations {
  fadeIn?: FadeInOptions;
  breathe?: BreatheOptions;
  strokeCycle?: ColorCycleOptions;     // cycles stroke.color through a palette
  marchingAnts?: MarchingAntsOptions;
  dashedFlow?: DashedFlowOptions;
  borderGlow?: BorderGlowOptions;
  flowDot?: FlowDotOptions;            // animated dot traveling along path
}

interface FlowDotOptions {
  color?: string;
  size?: number;          // dot radius in px (default: 4)
  speed?: number;         // fraction of path per second (default: 0.3)
  direction?: 1 | -1;
  repeat?: number;
}
```

`strokeCycle` and `flowDot` are implemented in `GraphPlugin`/`EdgeManager` (not in `plugin-elements`). `flowDot` manages a temporary `CircleElement` solid via `elementPlugin.addSolid/updateSolid/removeSolid`.

### 2.8 Edge Tools

Lightweight shapes/hit-targets placed at a parametric position along the edge path.

```ts
type EdgeToolType =
  | 'button'        // circle button — emits edge:tool:click on click
  | 'remove'        // preconfigured remove button
  | 'vertices'      // draggable bend-point handles (orthogonal waypoints)
  | 'segments'      // draggable segment midpoint handles
  | 'custom';       // registered via graph.registerTool()

interface EdgeTool {
  type: EdgeToolType;
  customId?: string;
  position?: number;          // 0–1 along path (default: 0.5)
  size?: number;
  fill?: string;
  border?: { color: string; width: number };
  alwaysVisible?: boolean;    // show at all LOD levels (default: false — DETAIL only)
  data?: Record<string, unknown>;
}
```

Tool events:
```ts
canvas.events.on('edge:tool:click',    ({ edgeId, toolType, toolData, x, y }) => {})
canvas.events.on('edge:tool:dragmove', ({ edgeId, toolType, waypointIndex, x, y }) => {})
```

`vertices` and `segments` tools write back into `EdgeSpec.waypoints` on `dragend`.

### 2.9 LOD Behavior (Edges)

| LOD Level | Zoom Range | What renders |
|---|---|---|
| `DOT` | < 0.15 | Hidden |
| `FILL_BORDER` | 0.15 – 0.40 | Thin line only |
| `FULL` | 0.40 – 1.50 | Line + arrows |
| `DETAIL` | > 1.50 | Line + arrows + labels + edge tools |

---

## 3. Geometry API

`GraphPlugin` exposes perimeter math (delegating to `ElementPlugin`):

```ts
graph.getCenter(id): Point
graph.getBBox(id): BBox
graph.getConnectionPoint(id, toX: number, toY: number): Point
graph.getPortPosition(nodeId: string, portId: string): Point
```

`getConnectionPoint` computes the shape-perimeter intersection along the line from node center toward `(toX, toY)`. Shape-specific math lives in each solid class (`CircleElement`, `RectElement`, `PolygonElement`, etc.).

---

## 4. Event System

`GraphPlugin` listens on `element:*` events from `ElementPlugin` and re-emits graph-semantic events. All events flow through the shared `canvas.events` (`EventBus`).

### 4.1 Event translation

```
ElementPlugin emits:
  element:click      { elementId, elementType }
  element:dragmove   { elementId, dx, dy }
  element:pointerover { elementId }
  …

GraphPlugin translates → emits:
  node:click    if elementId is in nodeIds
  edge:click    if elementId is in edgeIds
  …
```

### 4.2 Node Events

| Event key | Payload | Source |
|---|---|---|
| `node:click` | `{ nodeId, x, y, nativeEvent }` | `element:click` |
| `node:dblclick` | `{ nodeId, x, y, nativeEvent }` | `element:dblclick` |
| `node:contextmenu` | `{ nodeId, x, y, nativeEvent }` | `element:contextmenu` |
| `node:pointerover` | `{ nodeId, x, y }` | `element:pointerover` |
| `node:pointerout` | `{ nodeId }` | `element:pointerout` |
| `node:dragstart` | `{ nodeId, x, y }` | `element:dragstart` |
| `node:dragmove` | `{ nodeId, x, y, dx, dy }` | `element:dragmove` — NodeManager auto-updates position + connected edges |
| `node:dragend` | `{ nodeId, x, y }` | `element:dragend` |
| `node:statechange` | `{ nodeId, state, active }` | `element:statechange` |

### 4.3 Edge Events

| Event key | Payload | Source |
|---|---|---|
| `edge:click` | `{ edgeId, x, y, nativeEvent }` | `element:click` |
| `edge:dblclick` | `{ edgeId, x, y, nativeEvent }` | `element:dblclick` |
| `edge:contextmenu` | `{ edgeId, x, y, nativeEvent }` | `element:contextmenu` |
| `edge:pointerover` | `{ edgeId, x, y }` | `element:pointerover` |
| `edge:pointerout` | `{ edgeId }` | `element:pointerout` |
| `edge:statechange` | `{ edgeId, state, active }` | `element:statechange` |

### 4.4 Graph-level Events

| Event key | Payload | Trigger |
|---|---|---|
| `graph:nodeadded` | `{ nodeId }` | `graph.addNode()` |
| `graph:noderemoved` | `{ nodeId }` | `graph.removeNode()` |
| `graph:edgeadded` | `{ edgeId }` | `graph.addEdge()` |
| `graph:edgeremoved` | `{ edgeId }` | `graph.removeEdge()` |
| `graph:datachanged` | `{}` | `graph.setData()` |
| `graph:layoutstart` | `{ layoutId }` | layout begins |
| `graph:layoutend` | `{ layoutId }` | layout completes |

---

## 5. Selection & Interaction

### 5.1 SelectionManager (internal to GraphPlugin)

`SelectionManager` is an internal sub-system — not a separate `CanvasPlugin`. Selection API is exposed on the `GraphPlugin` instance.

Internally calls `elementPlugin.setState(id, 'selected', true)` for nodes and edges. Selection rubber-band draws a temporary dashed `RectElement` via `elementPlugin.addSolid()` on drag, removed on pointer-up.

```ts
graph.select(ids: string[]): void
graph.deselect(ids: string[]): void
graph.clearSelection(): void
graph.getSelected(): string[]

canvas.events.on('graph:selection:changed', ({ added, removed, current }) => {})
```

### 5.2 Built-in Interaction Behaviors

| Behavior | What it does |
|---|---|
| `drag-node` | Drag nodes; connected edges re-route automatically |
| `drag-canvas` | Pan the camera |
| `zoom-canvas` | Pinch/scroll zoom |
| `click-select` | Click node/edge to select; click canvas to deselect |
| `lasso-select` | Drag on canvas to rubber-band select |
| `create-edge` | Click source port → drag → click target port |
| `collapse-expand` | Collapse/expand subgraphs |
| `brush-select` | Rectangle select with modifier key |

---

## 6. Layout System

Layout adapters are separate packages that implement a simple interface.

```ts
interface LayoutAdapter {
  id: string;
  layout(data: GraphData): Promise<LayoutResult> | LayoutResult;
}

interface LayoutResult {
  nodes: { id: string; x: number; y: number }[];
  edges?: { id: string; waypoints?: { x: number; y: number }[] }[];
}
```

| Package | Algorithm |
|---|---|
| `@invana/plugin-layout-force` | D3 force-directed (exists, rename pending) |
| `@invana/plugin-layout-dagre` | Hierarchical / tree (planned) |
| `@invana/plugin-layout-elk` | ELK.js — best for orthogonal routing (planned) |
| `@invana/plugin-layout-manual` | No-op — preserves existing positions (planned) |

---

## 7. GraphPlugin Public API

```ts
// CRUD
graph.setData(data: GraphData): void          // diffs current state — add/update/remove only what changed
graph.addNode(spec: NodeSpec): void
graph.updateNode(id: string, partial: Partial<NodeSpec>): void
graph.removeNode(id: string): void
graph.addEdge(spec: EdgeSpec): void
graph.updateEdge(id: string, partial: Partial<EdgeSpec>): void
graph.removeEdge(id: string): void
graph.clear(): void

// Query
graph.getNode(id: string): NodeSpec | undefined
graph.getEdge(id: string): EdgeSpec | undefined
graph.getById(id: string): NodeSpec | EdgeSpec | undefined   // shared namespace
graph.getNodes(): NodeSpec[]
graph.getEdges(): EdgeSpec[]
graph.getConnectedEdges(nodeId: string): EdgeSpec[]

// States
graph.setState(id: string, state: string, active: boolean): void
graph.clearState(id: string, state: string): void
graph.clearAllStates(id: string): void
graph.getStates(id: string): string[]

// Animations
graph.animate(id: string, animations: NodeAnimations | EdgeAnimations): void
graph.stopAnimation(id: string, type?: string): void

// Layout & camera
await graph.layout(adapter: LayoutAdapter): Promise<void>
graph.fitView(padding?: number): void

// Selection
graph.select(ids: string[]): void
graph.deselect(ids: string[]): void
graph.clearSelection(): void
graph.getSelected(): string[]
```

**ID namespace:** nodes and edges share a single namespace. `graph.getById('x1')` returns whichever exists. Adding a node and edge with the same ID throws at `add()` time.

**`setData()` diff behaviour:** Diffs against the current graph using ID maps — adds new items, updates changed items, removes missing items. Animation state on unchanged nodes/edges is preserved.

---

## 8. Boundary: What GraphPlugin Does NOT Own

| Owned by | What it is | How `GraphPlugin` accesses it |
|---|---|---|
| `@invana/canvas` | `CameraAPI` | `ctx.camera.fitContent()`, `ctx.camera.pan()` |
| `@invana/canvas` | `LayerManager` | `ctx.layers.show/hide()` |
| `@invana/canvas` | `EventBus` | `ctx.events.on/emit()` |
| `@invana/canvas` | `DrawContext`, `StyleResolver` | internal to `ElementPlugin`, never called directly |
| `@invana/canvas` | All `graphics-utils/` functions | never imported by `GraphPlugin` |
| `@invana/plugin-elements` | `ElementPlugin` | `ctx.plugins.get('elements')` |
| `@invana/plugin-elements` | `LODController`, `HaloPool`, `AnimationTicker`, `RBush` | internal to `ElementPlugin`, not exposed |

`GraphPlugin` has zero `pixi.js` imports. It does not access `_viewport`, `_renderer`, `Container`, `Graphics`, or `DrawContext` directly.

---

## 9. Rendering Constraints

WebGL2 / WebGPU only. Explicitly out of scope:

- No HTML overlays (`<div>`, `<foreignObject>`)
- No DOM-based labels or tooltips
- No React / Vue / Svelte renderers for node/edge content
- No SVG renderer path

All text uses PixiJS `BitmapText` or canvas-texture `Text`. All shapes use PixiJS `Graphics`. This is a hard constraint, not a limitation.

---

## 10. Resolved Design Decisions

1. **`flowDot` animation** — owned by `EdgeManager` in `plugin-graph`. Manages a temporary `CircleElement` solid via `elementPlugin.addSolid/updateSolid/removeSolid`. Requires path-length parameterization.

2. **Multi-edge fan-out** — `EdgeManager` detects parallel edges (same source+target pair) at `add()`/`setData()` time, assigns a `curvatureOffset` per pair index. No consumer intervention needed.

3. **Self-loop edges** — `EdgeManager` special-cases `source === target`: generates a looping cubic bezier with two CPs offset above/beside the node. Configurable via `EdgeSpec.loopRadius`.

4. **Edge bend handles** — handled by `EdgeTool` type `'vertices'` / `'segments'` (§2.8), not `SelectionManager`. Bend handle interaction is `EdgeManager` territory.

5. **Jumpover connector** — `EdgeManager` post-processes all `pathType: 'jumpover'` edges after layout: finds pairwise intersections with other edges, inserts arc bridges via `elementPlugin`. Recomputed on any node/edge move.

6. **Manhattan / Metro router** — uses an RBush index of all node bboxes (from `elementPlugin.getBBox()`) for obstacle avoidance. Implemented in `plugin-graph/src/routing/manhattan.ts`. Not dependent on ELK/Dagre.

7. **Combo/group nodes** — not in v1 scope.

8. **HTML/React/SVG labels** — explicitly not supported. See §9.

9. **Event translation layer** — `GraphPlugin` listens on `element:*` events from `ElementPlugin` and re-emits `node:*` / `edge:*`. No direct hit-testing in `GraphPlugin` — that is `ElementPlugin`'s responsibility.

10. **Rendering strategy is encapsulated in `ElementPlugin`** — `GraphPlugin` has no knowledge of RenderTexture vs shared-Graphics decisions. `NodeManager` calls `elementPlugin.addSolid()`; `EdgeManager` calls `elementPlugin.addConnector()`. Strategy is transparent.
