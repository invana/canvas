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
  │     StraightConnector, BezierConnector, OrthogonalConnector, QuadraticConnector
  └── ElementPlugin (CanvasPlugin)
        registry, CRUD, states, LOD, spatial index (RBush), event routing

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

### 3.2 Connector shapes (extend BaseConnector)

| Class | `route()` output | `waypoints` role |
|---|---|---|
| `StraightConnector` | Two-point line | — |
| `BezierConnector` | Cubic bezier | `[0]` = cp1, `[1]` = cp2 |
| `QuadraticConnector` | Quadratic bezier | `[0]` = cp |
| `OrthogonalConnector` | Right-angle segments | User-defined bend points; rest auto-routed |

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
  from: Point;                          // source position (world-space)
  to: Point;                            // target position (world-space)
  waypoints?: Point[];                  // intermediate control/bend points
  stroke?: StrokeSpec;
  opacity?: number;
  zIndex?: number;
  interactive?: boolean;
  cursor?: string;
  states?: Partial<Record<string, ConnectorStateStyle>>;
  animations?: ConnectorAnimations;
  data?: Record<string, unknown>;
}
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

// States
elementPlugin.setState(id: string, state: string, active: boolean): void
elementPlugin.clearState(id: string, state: string): void
elementPlugin.clearAllStates(id: string): void
elementPlugin.getStates(id: string): string[]

// Animations
elementPlugin.animate(id: string, animations: SolidAnimations | ConnectorAnimations): void
elementPlugin.stopAnimation(id: string, type?: string): void

// Registry — extend with custom shapes
elementPlugin.registerElement(type: string, cls: typeof BaseSolid): void
elementPlugin.registerConnector(type: string, cls: typeof BaseConnector): void

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
