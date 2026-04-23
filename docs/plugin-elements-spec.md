# plugin-elements — Package Specification

**Package:** `@invana/plugin-elements`  
**Depends on:** `@invana/canvas` (canvas-core-new)  
**Renderer:** WebGL2 / WebGPU (via PixiJS v8) — **no DOM, no HTML, no SVG, no React**.

`@invana/plugin-elements` is Layer 2 in the canvas plugin stack. It provides generic relational shapes (solids + connectors), the `ElementPlugin` orchestrator, and the rendering infrastructure that `@invana/plugin-graph` and community plugins build on top of.

---

## 1. Layer Architecture

```
@invana/canvas                      — Layer 1: engine + shape contracts
  ├── BaseSolid (abstract)          — base class for all closed/filled shapes
  ├── BaseConnector (abstract)      — base class for all path/routing shapes
  ├── CircleElement                 — reference concrete solid (circle perimeter math)
  ├── DrawContext (typed DSL)       — abstracted draw commands; no PixiJS imports
  └── StyleResolver (pure fn)       — merges defaultStyle → specStyle → active states

@invana/plugin-elements             — Layer 2: generic relational shapes  ← this package
  ├── extends BaseSolid:
  │     RectElement, PolygonElement, EllipseElement,
  │     StarElement, DiamondElement, HexagonElement
  ├── extends BaseConnector:
  │     StraightConnector, BezierConnector, QuadraticConnector,
  │     OrthogonalConnector, RoundedConnector, SmoothConnector, JumpoverConnector
  ├── Routers (pure fns):
  │     NormalRouter, OrthRouter, OneSideRouter,
  │     ErRouter, ManhattanRouter, MetroRouter
  ├── Markers (pure fns):
  │     triangle, triangle-outline, block, classic, diamond, diamond-outline,
  │     circle, circle-plus, ellipse, cross, async, square, path
  └── ElementPlugin (CanvasPlugin)
        registry, CRUD, states, LOD, spatial index (RBush), event routing,
        port system, edge label positioning, router/connector/marker registries

@invana/plugin-graph                — Layer 3: graph domain semantics
  └── depends on ElementPlugin for all rendering
```

**Dependency rule:** `plugin-elements` may import from `@invana/canvas` only. It never imports from `pixi.js`.

**Community extension:**

```ts
import { RectElement } from '@invana/plugin-elements';

class DatabaseNode extends RectElement {
  draw(ctx: DrawContext) {
    super.draw(ctx);           // rect + ports + border + halo + states
    this.drawCylinderTop(ctx);
  }
}
elementPlugin.registerElement('database', DatabaseNode);
```

---

## 2. Base Classes (live in `@invana/canvas`)

### 2.1 BaseSolid (abstract)

Base for all closed/filled shapes. Four methods must be implemented; everything else is provided.

```ts
abstract class BaseSolid<TSpec extends BaseSolidSpec> {
  // Must implement
  abstract draw(ctx: DrawContext): void;                           // full appearance
  abstract getBBox(): BBox;                                        // for RBush + culling
  abstract getCenter(): Point;                                     // for connector routing
  abstract getConnectionPoint(toX: number, toY: number): Point;   // perimeter math

  // Built-in
  readonly spec: TSpec;
  readonly activeStates: Set<string>;
  setState(state: string, active: boolean): void;  // calls onStateChange + markDirty
  markDirty(): void;

  // Optional lifecycle hooks (override in subclass)
  onMount?(ctx: PluginContext): void;
  onUpdate?(prev: TSpec, next: TSpec): void;
  onDestroy?(): void;
  onStateChange?(state: string, active: boolean): void;
  onAnimationTick?(dt: number): void;                              // driven by AnimationTicker
}
```

### 2.2 BaseConnector (abstract)

Base for all path/routing shapes. Only `route()` is abstract — `draw()` has a shared default implementation (stroke + arrowheads + midpoint label) that all connectors inherit.

```ts
abstract class BaseConnector<TSpec extends BaseConnectorSpec> {
  // Must implement — geometry only
  abstract route(from: Point, to: Point, waypoints: Point[]): PathCommand[];

  // Default implementation (override to customise appearance)
  draw(ctx: DrawContext): void;    // stroke path + arrowheads + midpoint label
  getBBox(): BBox;                 // computed from route() output

  readonly spec: TSpec;
  readonly activeStates: Set<string>;
  setState(state: string, active: boolean): void;
  markDirty(): void;

  // Optional lifecycle hooks
  onMount?(ctx: PluginContext): void;
  onUpdate?(prev: TSpec, next: TSpec): void;
  onDestroy?(): void;
  onStateChange?(state: string, active: boolean): void;
  onAnimationTick?(dt: number): void;
}
```

### 2.3 DrawContext (typed command DSL)

Hides PixiJS entirely from all plugin/consumer code. The engine records commands internally and replays onto the appropriate GPU surface.

```ts
interface DrawContext {
  // Solid fills
  fillCircle(cx: number, cy: number, r: number, style: FillStyle): void;
  fillRect(x: number, y: number, w: number, h: number, options: RectOptions): void;
  fillPolygon(points: Point[], style: FillStyle): void;
  fillEllipse(cx: number, cy: number, rx: number, ry: number, style: FillStyle): void;

  // Strokes
  strokeCircle(cx: number, cy: number, r: number, style: StrokeStyle): void;
  strokePath(path: PathCommand[], style: StrokeStyle): void;
  strokeRect(x: number, y: number, w: number, h: number, options: RectOptions): void;

  // Composite effects
  drawHalo(cx: number, cy: number, r: number, style: HaloStyle): void;
  drawPulseRings(cx: number, cy: number, style: PulseStyle): void;
  drawShadow(cx: number, cy: number, style: ShadowStyle): void;

  // Labels and ports
  drawText(text: string, x: number, y: number, style: TextStyle): void;
  drawPort(cx: number, cy: number, style: PortStyle): void;

  // Arrow markers (used by BaseConnector.draw default impl)
  drawArrow(tip: Point, angle: number, style: ArrowStyle): void;

  // Transform scope (for breathe / scale animations)
  withTransform(matrix: Matrix, fn: () => void): void;
}
```

### 2.4 StyleResolver (pure function)

Stateless — no instance, no side effects. Easy to test; can be overridden in `plugin-graph` for domain logic.

```ts
StyleResolver.resolve<TStyle>(
  defaultStyle:  TStyle,
  specStyle:     Partial<TStyle>,
  activeStates:  Set<string>,
  stateStyles:   Partial<Record<string, Partial<TStyle>>>
): TStyle
// Priority (lowest → highest): defaultStyle → specStyle → state styles (activation order)
// When two active states conflict on the same property, the later-activated state wins.
```

---

## 3. Concrete Shapes (live in `@invana/plugin-elements`)

### 3.1 Solid shapes (extend BaseSolid)

| Class | Perimeter math | Notes |
|---|---|---|
| `CircleElement` | circumference angle | Lives in `@invana/canvas` — reference impl |
| `EllipseElement` | ellipse perimeter | Parametric angle approximation |
| `RectElement` | nearest edge segment intersection | Supports `cornerRadius` |
| `PolygonElement` | nearest polygon edge | Configurable `sides` |
| `DiamondElement` | `PolygonElement` with `sides: 4`, rotated 45° | |
| `HexagonElement` | `PolygonElement` with `sides: 6` | |
| `StarElement` | nearest outer/inner edge | `points`, `innerRadius` |

### 3.2 Two-Stage Edge Pipeline

Edge rendering is split into two composable stages, matching the X6 / AntV model:

```
vertices (user-supplied waypoints)
      │
      ▼
  ┌─────────┐
  │ Router  │  — adds/reshapes intermediate points (geometry only, no drawing)
  └─────────┘
      │  processed point list (start, routed points, end)
      ▼
  ┌───────────┐
  │ Connector │  — converts point list into a rendered path (stroke style, curves, etc.)
  └───────────┘
      │
      ▼
   PathCommand[] → DrawContext.strokePath()
```

- **Router** is responsible for geometry: it takes `(from, to, vertices)` and returns an augmented list of `Point[]`, adding extra bend/segment points as needed.
- **Connector** is responsible for rendering: it takes the router's `Point[]` and produces a `PathCommand[]` (straight lines, cubic curves, rounded corners, etc.).
- The two can be combined freely: `orth` router + `rounded` connector = orthogonal path with rounded corners.

---

### 3.3 Built-in Routers

Routers are pure functions: `(from: Point, to: Point, vertices: Point[], args: RouterArgs, context: RouterContext) => Point[]`.

| Key | Class / fn | Description |
|---|---|---|
| `normal` | `NormalRouter` | Default — passes `vertices` through unchanged; no extra points added |
| `orth` | `OrthRouter` | All segments made horizontal or vertical; inserts extra points at corners |
| `oneSide` | `OneSideRouter` | Constrained orthogonal; always exactly 3 segments; path exits the source node from one side only |
| `er` | `ErRouter` | Entity-Relationship style; Z-shaped diagonal segments |
| `manhattan` | `ManhattanRouter` | Smart orthogonal; auto-avoids other node bounding boxes (A\* pathfinding) |
| `metro` | `MetroRouter` | Like `manhattan` but allows 45° diagonal sections (metro-map style) |
| custom | `RouterRegistry` | Register any function via `elementPlugin.registerRouter(name, fn)` |

**Router args examples:**

```ts
// orth router with padding
{ name: 'orth', args: { padding: 20 } }

// oneSide — exit direction
{ name: 'oneSide', args: { side: 'bottom' } }

// er router — direction of exit/enter
{ name: 'er', args: { offset: 32, direction: 'H' } }

// manhattan — grid step and obstacle margin
{ name: 'manhattan', args: { step: 10, padding: 20 } }

// shorthand (no args)
router: 'orth'
```

**RouterContext** gives routers read-only access to all solid bounding boxes (needed for obstacle avoidance in `manhattan` / `metro`):

```ts
interface RouterContext {
  getSolidBBox(id: string): BBox | undefined;
  getAllSolidBBoxes(): Map<string, BBox>;
}
```

---

### 3.4 Built-in Connectors

Connectors are pure functions: `(points: Point[], args: ConnectorArgs) => PathCommand[]`.

| Key | Class / fn | Description |
|---|---|---|
| `straight` | `StraightConnector` | Straight lines through all routed points (`M … L … L`) |
| `smooth` | `SmoothConnector` | Cubic Bézier curves through all routed points (Catmull-Rom to Bézier conversion) |
| `bezier` | `BezierConnector` | Single cubic Bézier; auto-computes cp1/cp2 from `curvature` or uses first two waypoints as explicit control points |
| `quadratic` | `QuadraticConnector` | Single quadratic Bézier; first waypoint is cp |
| `rounded` | `RoundedConnector` | Straight segments with circular arcs at joints (radius configurable) |
| `jumpover` | `JumpoverConnector` | Straight segments; draws a jump-over arc symbol wherever two connectors cross |
| custom | `ConnectorRegistry` | Register any function via `elementPlugin.registerConnector(name, fn)` |

**Connector args examples:**

```ts
// smooth — tension controls how tight curves are
{ name: 'smooth', args: { tension: 0.5 } }

// bezier — auto-curvature
{ name: 'bezier', args: { curvature: 80 } }

// rounded — corner radius
{ name: 'rounded', args: { radius: 10 } }

// jumpover — jump size
{ name: 'jumpover', args: { size: 8, type: 'arc' } }  // type: 'arc' | 'gap' | 'cubic'

// shorthand (no args)
connector: 'rounded'
```

---

### 3.5 Markers (Arrows)

Markers are drawn at the `start` and/or `end` of every connector. They are independent of connector type.

**Built-in marker types:**

| Key | Shape | Notes |
|---|---|---|
| `none` | — | No marker |
| `triangle` | Filled triangle | Default end marker |
| `triangle-outline` | Outlined triangle | |
| `block` | Wide filled block arrow | |
| `classic` | Classic open arrowhead | |
| `diamond` | Filled diamond | |
| `diamond-outline` | Outlined diamond | |
| `circle` | Filled circle | |
| `circle-plus` | Circle with `+` | |
| `ellipse` | Filled ellipse | `rx`, `ry` configurable |
| `cross` | × cross | |
| `async` | Half-open arrowhead (async-style) | |
| `square` | Filled square | |
| `path` | Arbitrary SVG-style path | Provide `d: string` |
| custom | Any fn | Register via `elementPlugin.registerMarker(name, fn)` |

**MarkerSpec:**

```ts
interface MarkerSpec {
  type: string;                   // built-in key or registered custom name
  size?: number;                  // width in world-space units (default: 8)
  fill?: string;                  // fill color (defaults to connector stroke color)
  stroke?: string;                // stroke color
  strokeWidth?: number;
  // type-specific args
  rx?: number;                    // for 'ellipse'
  ry?: number;                    // for 'ellipse'
  d?: string;                     // for 'path'
  open?: boolean;                 // for 'triangle', 'block' — outline only
}
```

**Usage in `BaseConnectorSpec`:**

```ts
{
  startMarker: { type: 'circle', size: 6 },
  endMarker:   { type: 'triangle', size: 10, fill: '#58a6ff' },
}
// or shorthand
{
  startMarker: 'none',
  endMarker:   'triangle',
}
```

---

### 3.6 Edge Labels

Multiple labels are supported per connector. Each label has a `position` that describes where along the path it sits.

```ts
interface EdgeLabelSpec {
  text: string;
  position?: number | EdgeLabelPosition;  // 0.0–1.0 along path, default: 0.5 (midpoint)
  style?: TextStyle;
  background?: FillSpec;                  // optional pill/rect behind text
  offset?: { x?: number; y?: number };   // pixel offset from path at position
  keepUpright?: boolean;                  // flip label if path goes right-to-left (default: true)
}

type EdgeLabelPosition =
  | number                  // 0.0 = start, 0.5 = midpoint, 1.0 = end
  | 'start'                 // alias for 0.0
  | 'mid'                   // alias for 0.5
  | 'end';                  // alias for 1.0
```

**LOD rule:** labels render only at `DETAIL` zoom level (> 1.5×) by default. Configurable per `ElementPlugin` instance.

---

### 3.7 Port System

Ports are named connection points on a solid. Connectors may target a port instead of the solid's auto-computed perimeter point.

```ts
interface PortSpec {
  id: string;
  position: PortPosition;     // where on the solid the port sits
  style?: PortStyle;          // visual appearance (dot, diamond, square, etc.)
  interactive?: boolean;      // whether the port responds to pointer events
}

type PortPosition =
  | { side: 'top' | 'bottom' | 'left' | 'right'; offset?: number }
  | { x: number; y: number }    // absolute world-space position
  | { rel: { x: number; y: number } };  // 0–1 relative to solid bbox

// Example solid spec with ports
const node: RectSolidSpec = {
  id: 'n1',
  x: 100, y: 100,
  width: 120, height: 60,
  ports: [
    { id: 'out', position: { side: 'right' } },
    { id: 'in',  position: { side: 'left'  } },
    { id: 'top', position: { side: 'top'   } },
  ],
};

// Connector targeting a named port
const connector: BaseConnectorSpec = {
  id: 'e1',
  from: { solidId: 'n1', portId: 'out' },   // ← port reference
  to:   { solidId: 'n2', portId: 'in'  },
};
```

`ElementPlugin` resolves `{ solidId, portId }` to world-space `Point` before passing to the router. Port positions update automatically when a solid is moved.

---

### 3.8 Connector shapes summary

| Class | Router default | Connector | Waypoints role |
|---|---|---|---|
| `StraightConnector` | `normal` | `straight` | — |
| `BezierConnector` | `normal` | `bezier` | `[0]` = cp1, `[1]` = cp2 |
| `QuadraticConnector` | `normal` | `quadratic` | `[0]` = cp |
| `OrthogonalConnector` | `orth` | `straight` | User bend points; rest auto-routed |
| `RoundedConnector` | `orth` | `rounded` | User bend points; corners rounded |
| `SmoothConnector` | `normal` | `smooth` | Passed as Catmull-Rom spline knots |

---

## 4. Base Spec Types

```ts
interface BaseSolidSpec {
  id: string;
  x: number;
  y: number;
  fill?: FillSpec;
  border?: BorderSpec;
  halo?: HaloSpec;
  opacity?: number;
  zIndex?: number;
  interactive?: boolean;
  cursor?: string;
  draggable?: boolean;
  states?: Partial<Record<string, SolidStateStyle>>;
  animations?: SolidAnimations;
  data?: Record<string, unknown>;
}

interface BaseConnectorSpec {
  id: string;

  // Source / target — can be a world-space point, a solid id, or a solid + port reference
  from: ConnectorTerminal;
  to: ConnectorTerminal;

  // Intermediate waypoints fed to the router before path generation
  vertices?: Point[];

  // Two-stage pipeline overrides (falls back to connector class defaults)
  router?: string | { name: string; args?: Record<string, unknown> };
  connector?: string | { name: string; args?: Record<string, unknown> };

  // Visual
  stroke?: StrokeSpec;
  startMarker?: string | MarkerSpec;    // default: none
  endMarker?: string | MarkerSpec;      // default: 'triangle'
  opacity?: number;
  zIndex?: number;

  // Labels (multiple supported, positioned along path)
  labels?: EdgeLabelSpec[];

  // Interaction
  interactive?: boolean;
  cursor?: string;

  // States + animations
  states?: Partial<Record<string, ConnectorStateStyle>>;
  animations?: ConnectorAnimations;

  // Arbitrary consumer data (not used by plugin-elements)
  data?: Record<string, unknown>;
}

// Terminal can be an explicit world-space point, a solid id, or a solid + port reference
type ConnectorTerminal =
  | Point                                        // { x, y } — fixed world-space point
  | { solidId: string }                          // auto-computes perimeter connection point
  | { solidId: string; portId: string };         // connects to a named port
```

---

## 5. ElementPlugin Public API

`ElementPlugin` implements `CanvasPlugin` and is the consumer-facing entry point for Layer 2.

```ts
// Registration
await canvas.plugins.register(new ElementPlugin({ key: 'elements' }));
const elementPlugin = canvas.plugins.get('elements') as ElementPlugin;

// Solid CRUD
elementPlugin.addSolid(type: string, spec: BaseSolidSpec): void
elementPlugin.updateSolid(id: string, partial: Partial<BaseSolidSpec>): void
elementPlugin.removeSolid(id: string): void
elementPlugin.getSolid(id: string): BaseSolid | undefined

// Connector CRUD
elementPlugin.addConnector(type: string, spec: BaseConnectorSpec): void
elementPlugin.updateConnector(id: string, partial: Partial<BaseConnectorSpec>): void
elementPlugin.removeConnector(id: string): void
elementPlugin.getConnector(id: string): BaseConnector | undefined

// Geometry queries (used by plugin-graph EdgeManager for routing)
elementPlugin.getCenter(id: string): Point
elementPlugin.getBBox(id: string): BBox
elementPlugin.getConnectionPoint(id: string, toX: number, toY: number): Point
elementPlugin.getPortPosition(solidId: string, portId: string): Point | undefined
elementPlugin.resolveTerminal(terminal: ConnectorTerminal): Point

// States
elementPlugin.setState(id: string, state: string, active: boolean): void
elementPlugin.clearState(id: string, state: string): void
elementPlugin.clearAllStates(id: string): void
elementPlugin.getStates(id: string): string[]

// Animations
elementPlugin.animate(id: string, animations: SolidAnimations | ConnectorAnimations): void
elementPlugin.stopAnimation(id: string, type?: string): void

// Registry — extend with custom shapes and pipeline functions
elementPlugin.registerElement(type: string, cls: typeof BaseSolid): void
elementPlugin.registerConnector(type: string, cls: typeof BaseConnector): void
elementPlugin.registerRouter(name: string, fn: RouterFn): void
elementPlugin.registerConnectorFn(name: string, fn: ConnectorFn): void
elementPlugin.registerMarker(name: string, fn: MarkerFn): void

// Misc
elementPlugin.clear(): void
elementPlugin.fit(padding?: number): void
```

---

## 6. Event System

All events flow through the shared `canvas.events` (`EventBus`). `ElementPlugin` owns hit-testing; `plugin-graph` (and other consumers) listen on `element:*` events and translate them into domain events.

### 6.1 Event chain

```
Canvas raw pointer (from Renderer — internal)
  │
  ▼
ElementPlugin
  → hit-tests pointer position via RBush (solids first, then connectors)
  → emits on EventBus:
       element:click         { elementId, elementType, x, y, nativeEvent }
       element:dblclick      { elementId, elementType, x, y, nativeEvent }
       element:contextmenu   { elementId, elementType, x, y, nativeEvent }
       element:pointerover   { elementId, elementType, x, y }
       element:pointerout    { elementId, elementType }
       element:pointermove   { elementId, elementType, x, y }
       element:pointerdown   { elementId, elementType, x, y }
       element:pointerup     { elementId, elementType, x, y }
       element:dragstart     { elementId, elementType, x, y }
       element:dragmove      { elementId, elementType, x, y, dx, dy }
       element:dragend       { elementId, elementType, x, y }
  │
  ▼
GraphPlugin (or any consumer)
  ctx.events.on('element:click', ({ elementId, elementType }) => {
    // translate to domain events: node:click, edge:click, etc.
  })
```

`elementType` is `'solid'` or `'connector'`, allowing consumers to filter without maintaining their own ID sets.

### 6.2 Element state events

| Event key | Payload | Trigger |
|---|---|---|
| `element:statechange` | `{ elementId, state, active }` | `setState()` / `clearState()` |
| `element:added` | `{ elementId, elementType }` | `addSolid()` / `addConnector()` |
| `element:removed` | `{ elementId, elementType }` | `removeSolid()` / `removeConnector()` |

---

## 7. LOD Defaults

Default thresholds (configurable per `ElementPlugin` instance):

| LOD Level | Zoom Range | Solids render | Connectors render |
|---|---|---|---|
| `DOT` | < 0.15 | 2 px dot only | Hidden |
| `FILL_BORDER` | 0.15 – 0.40 | Fill + border | Thin line only |
| `FULL` | 0.40 – 1.50 | Fill + border + halo | Line + arrowheads |
| `DETAIL` | > 1.50 | Everything + label + ports | Line + arrows + labels + tools |

---

## 8. Rendering Strategy

| Shape type | Strategy | Rationale |
|---|---|---|
| `BaseSolid` subclasses | **RenderTexture per style fingerprint** | Fingerprint = `hash(fill + stroke + size + activeStates)`. Same fingerprint → reuse cached GPU texture. State/style change → invalidate + re-bake that element only. Enables ~100k static solids at near-zero CPU cost per frame. |
| `BaseConnector` subclasses | **Shared Graphics + dirty-flag batching** | Paths are unique and change on waypoint drag. `ElementPlugin` owns one `Graphics` per layer. RAF tick: clear → redraw dirty connectors only. Node drag marks its connectors dirty via `nodeIndex: Map<solidId, Set<connectorId>>`. Force layout tick → 1 batch re-route, not N event dispatches. |

---

## 9. Spatial Index

`ElementPlugin` owns one `RBush` for solids and one for connectors. The engine's `HitTestManager` queries plugins in reverse z-order (topmost plugin first); first plugin returning a hit wins. Plugins cannot corrupt each other's indexes. Cross-plugin hit priority is controlled by plugin z-order at registration time.
