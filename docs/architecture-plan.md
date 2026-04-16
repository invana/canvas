# Canvas Architecture Plan — v2.x Refactor

Working document for the planned refactor. All ideas captured here, not yet prioritised for implementation.

---

## 1. Hide PixiJS Behind the Public API

**Goal:** Plugin authors and library users should never need to `import` from `pixi.js`. PixiJS is an internal implementation detail.

**Current problems:**
- `canvas.app` getter returns `Application` — a raw PixiJS type
- `canvas.viewport` returns a `Viewport` that extends pixi-viewport directly (will become `canvas.camera`)
- `types/index.ts` re-exports `Graphics as CanvasGraphicsSurface` from `pixi.js`
- Layer internals pass PixiJS `Container` and `Graphics` to plugins

**Proposed approach:**

Introduce a `Renderer` internal class that wraps the PixiJS `Application`. The `Canvas` class never exposes it publicly. Instead, Canvas exposes only these surface methods (already partially done):
- `canvas.getCanvasElement()` — returns `HTMLCanvasElement`
- `canvas.addTicker(fn)` / `canvas.removeTicker(fn)` — for render-loop hooks
- `canvas.createStageSurface(label, zIndex)` — creates a drawing surface not affected by pan/zoom
- `canvas.resize(w, h)` — resizes renderer + camera
- `canvas.getRendererType()` — `'webgpu' | 'webgl'`

Introduce a `CameraAPI` interface that `Camera` implements. Canvas exposes `canvas.camera` typed as `CameraAPI`, not as the concrete pixi-viewport class:

```typescript
interface CameraAPI {
  pan(deltaX: number, deltaY: number): void;
  panTo(worldX: number, worldY: number): void;
  zoom(scale: number): void;
  zoomTo(scale: number, center?: Point): void;
  fitContent(padding?: number): void;
  toWorld(screenX: number, screenY: number): Point;
  toScreen(worldX: number, worldY: number): Point;
  reset(): void;
  animate(options: CameraAnimationOptions): void;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}
```

Layers will expose a `DrawingSurface` interface instead of raw PixiJS `Graphics`:

```typescript
interface DrawingSurface {
  clear(): void;
  drawCircle(x: number, y: number, radius: number): void;
  drawRect(x: number, y: number, w: number, h: number): void;
  // ... etc
}
```

For more complex rendering needs, plugins go through `canvas-core` drawing utilities (see §2).

---

## 2. Rename `primitives/` → `graphics-utils/` ✅ DECIDED

**Decision: `graphics-utils/`**

Descriptive name that communicates these are utility functions for drawing graphics.

Internal folder structure stays the same, only the top-level folder is renamed:

```
graphics-utils/
  shapes/     circle, rect, ellipse, polygon, star, roundedRect
  paths/      line, bezier, orthogonal
  arrows/     triangle, diamond, circle, square
  labels/     label rendering
  effects/    glow, ripple, halo
  fills/      gradients, images, fill resolver
  index.ts
```

---

## 3. Full Event System

**Goal:** Comprehensive, typed events with consistent naming, full payload types, and no `any`.

**Current problems:**
- `AnyRendererNodeBase`, `AnyRendererEdgeBase`, `AnyFederatedPointerEvent` are all `any` in `types/index.ts`
- Event payloads mix raw PixiJS types with custom types
- No events for data lifecycle (`node:added`, `node:removed`, etc.) in the map
- No plugin lifecycle events (`plugin:registered`, `plugin:destroyed`)
- No layer events (`layer:visibility-changed`)

**Proposed event taxonomy:**

```typescript
// Node interaction
'node:pointerdown'        NodePointerEvent
'node:pointermove'        NodePointerEvent
'node:pointerup'          NodePointerEvent
'node:clicked'            NodePointerEvent
'node:dblclicked'         NodePointerEvent
'node:contextmenu'        NodePointerEvent
'node:hover'              NodePointerEvent
'node:hoverend'           NodePointerEvent
'node:dragstart'          NodeDragEvent
'node:drag'               NodeDragEvent
'node:dragend'            NodeDragEvent
'node:selected'           NodeSelectionEvent
'node:deselected'         NodeSelectionEvent

// Node data lifecycle
'node:added'              { nodeId: string }
'node:updated'            { nodeId: string }
'node:removed'            { nodeId: string }

// Edge interaction
'edge:pointerdown'        EdgePointerEvent
'edge:clicked'            EdgePointerEvent
'edge:dblclicked'         EdgePointerEvent
'edge:contextmenu'        EdgePointerEvent
'edge:hover'              EdgePointerEvent
'edge:hoverend'           EdgePointerEvent
'edge:selected'           EdgeSelectionEvent
'edge:deselected'         EdgeSelectionEvent

// Edge data lifecycle
'edge:added'              { edgeId: string }
'edge:updated'            { edgeId: string }
'edge:removed'            { edgeId: string }

// Canvas background
'canvas:pointerdown'      CanvasBgPointerEvent
'canvas:pointermove'      CanvasBgPointerEvent
'canvas:pointerup'        CanvasBgPointerEvent
'canvas:clicked'          CanvasBgPointerEvent
'canvas:dblclicked'       CanvasBgPointerEvent
'canvas:contextmenu'      CanvasBgPointerEvent

// Camera (was viewport:*)
'camera:zoom'             { scale: number; center: Point }
'camera:pan'              { x: number; y: number }
'camera:fit'              { bounds: Bounds }
'camera:reset'            {}
'camera:animate-start'    { targetScale: number; targetX: number; targetY: number }
'camera:animate-end'      {}

// Selection
'selection:changed'       { nodes: string[]; edges: string[] }  // IDs only, no element refs
'selection:cleared'       {}

// Graph data (from GraphDataPlugin)
'graph:data-set'          { nodeCount: number; edgeCount: number }
'graph:cleared'           {}

// Plugin lifecycle
'plugin:registered'       { pluginId: string }
'plugin:destroyed'        { pluginId: string }

// Layer
'layer:visibility-changed' { layerId: string; visible: boolean }
'layer:added'             { layerId: string }
'layer:removed'           { layerId: string }
```

**Key design decisions:**
1. Event payloads carry **`ICanvasNode`** / **`ICanvasEdge`** (user data objects) — never `NodeGfx`, never raw PixiJS types. `nodeId: string` always present for quick filtering.
2. `ICanvasPointerEvent` becomes a well-typed structural interface (no more `AnyFederatedPointerEvent`). `originalEvent` field typed as `PointerEvent` (DOM type, not PixiJS).
3. `NodeGfx` / `EdgeGfx` only emit to `EventBus`. They never apply state changes. Plugins (e.g. `ClickSelectPlugin`) subscribe and decide what to do.
4. Graph-specific events (`node:*`, `edge:*`, `graph:*`) live in `@invana/graph-canvas`; canvas-level events (`canvas:*`, `camera:*`, `layer:*`, `plugin:*`) stay in `canvas-core`.
5. `'viewport:zoomed'` / `'viewport:panned'` renamed to **`'camera:zoom'`** / **`'camera:pan'`** (see Decision 16).

**Implementation:** `EventEmitter<CanvasEventMap>` already exists — only the map and payload types need updating.

---

## 4. Photoshop-like Layer Model

**Goal:** The canvas is a composable stack of layers. Each plugin contributes one or more named layers. Layers can be shown, hidden, reordered, and have opacity. This enables multi-dataset visualizations (graph data + annotations + heatmap + maps all on the same canvas).

**Layer stack example:**

```
z=100  annotations layer       (AnnotationPlugin)
z=90   brush selection overlay (BrushSelectPlugin)
z=80   minimap                 (MiniMapPlugin, screen-space)
z=50   node labels layer       (GraphDataPlugin)
z=40   node badges layer       (GraphDataPlugin)
z=30   nodes layer             (GraphDataPlugin)
z=20   edges layer             (GraphDataPlugin)
z=10   group bounding boxes    (GroupsPlugin — future)
z=5    background              (BackgroundPlugin)
```

**Layer API (public):**

```typescript
interface Layer {
  readonly id: string;
  readonly zIndex: number;
  visible: boolean;
  opacity: number;
  label?: string;          // human-readable name for a layer panel UI
  locked?: boolean;        // no pointer events
}

interface LayerManager {
  getLayers(): Layer[];
  showLayer(id: string): void;
  hideLayer(id: string): void;
  setLayerOpacity(id: string, opacity: number): void;
  setLayerZIndex(id: string, zIndex: number): void;
  getLayer(id: string): Layer | undefined;
}
```

`canvas.layers` exposes `LayerManager` directly. This is the foundation for a layer panel UI component.

**For multi-dataset support:** a second `GraphDataPlugin` instance with a different layer z-range can overlay a second dataset. Layers from different plugins do not conflict as long as their z-ranges don't overlap.

---

## 5. Canvas as a Lean Orchestrator

**Current problem:** `Canvas.ts` manages PixiJS `Application`, `pixi-viewport`, layers, plugins, events, coordinate conversion, background color, ticker, stage surfaces — all in one class (~500 lines). This conflates rendering internals with the public API.

**Proposed structure:**

```
Canvas (public orchestrator — ~150 lines)
  │
  ├── Renderer (internal, never exposed)
  │     Wraps: PixiJS Application + stage
  │     Owns: ticker, background, stage surfaces, canvas element
  │     Never part of public API
  │
  ├── Camera (exposed via CameraAPI interface)
  │     Wraps: pixi-viewport internally
  │     Public methods: pan, panTo, zoom, zoomTo, fitContent, toWorld, toScreen, reset, animate
  │     Internal: direct pixi-viewport access stays private
  │
  ├── LayerManager (exposed as canvas.layers)
  │     Plugins interact with this to create/get drawing layers
  │     Supports: show/hide, opacity, z-ordering, labels
  │
  ├── PluginSystem (exposed as canvas.plugins)
  │     Methods: register, get, has, unregister, list
  │     Wraps current _plugins Map + PluginRegistry logic
  │
  └── EventBus (exposed as canvas.events)
        Already exists as EventEmitter<CanvasEventMap>
        Canvas wires internal pixi events → EventBus
        Plugins use EventBus only — never access pixi events directly
```

**Responsibilities of Canvas:**
- Lifecycle: `init()`, `destroy()`, `resize()`
- Wire PixiJS → EventBus (pointer events, camera events)
- Delegate to the four sub-systems above
- Expose clean utility methods: `toWorld()`, `toScreen()`, `fitContent()`

**What moves OUT of Canvas:**
- Direct PixiJS `Application` management → `Renderer` (internal class, same file or `rendering/`)
- Behavior preset logic → `PluginSystem`
- `createStageSurface()` internals → `Renderer`
- Plugin option update logic → `PluginSystem`

**File layout after refactor:**

```
core/
  Canvas.ts          ~150 lines (orchestrator)
  Renderer.ts        ~200 lines (internal PixiJS wrapper)
  PluginSystem.ts    ~150 lines (plugin register/get/remove)
  index.ts
```

---

## 6. `packages/graph-canvas` — Graph Visualization Layer ✅ DECIDED

**Goal:** `canvas-core` is a lean, generic drawing engine. `graph-canvas` is the graph visualization layer built on top — it owns graph data, graph elements, graph-specific interactions, and graph-specific plugins.

**`canvas-core` keeps (generic canvas engine):**
- `Canvas`, `Camera`, `LayerManager`, `Renderer` (internal)
- `CanvasPlugin` interface + `PluginRegistry`
- `BackgroundPlugin` — fundamental canvas concern
- All `graphics-utils/` drawing functions
- `EventEmitter`, types, defaults
- Style system (`FunctionBasedStyle`)
- Registry (shape/path drawer registry)

**New `packages/graph-canvas` contains (`@invana/graph-canvas`):**
- **Graph data:** `GraphDataPlugin` — `setData()`, `setStyles()`, add/remove nodes/edges
- **Graph elements:** `RendererNodeBase`, `RendererEdgeBase`, all node types (Circle, Rect, Ellipse, Star, Polygon, etc.), all edge types (Line, Bezier, Orthogonal)
- **Graph interaction plugins:**
  - `DragElementPlugin`
  - `DragCanvasPlugin`
  - `ZoomControlPlugin`
  - `ClickSelectPlugin`
  - `HoverActivatePlugin`
  - `FocusElementPlugin`
  - `MiniMapPlugin`
  - `BrushSelectPlugin`
  - `LassoSelectPlugin`
- **Graph types:** `ICanvasData`, `ICanvasNode`, `ICanvasEdge`, node/edge state types
- **Renderer:** node/edge rendering pipeline, `createNode` factory

**Benefits:**
- `canvas-core` becomes reusable for non-graph use cases (maps, diagrams, annotations, image editors)
- `graph-canvas` is a complete graph viz toolkit — one import for everything graph-related
- Third-party graph plugins follow the same pattern as built-in ones
- `graph-canvas` lists `canvas-core` as a peer dep
- No need for a separate `canvas-plugins` package — graph plugins live with graph code

**Monorepo structure after refactor:**

```
packages/
  canvas-core/         @invana/canvas-core      — generic canvas engine
  graph-canvas/        @invana/graph-canvas      — graph visualization layer
  canvas-utils/        @invana/canvas-utils      — math, color, geometry
  layouts-d3-force/    @invana/layouts-d3-force   — D3 force layout plugin
  example-datasets/    @invana/example-datasets   — sample graph datasets
```

**User-facing imports:**

```typescript
// Just the canvas engine
import { Canvas } from '@invana/canvas-core';

// Graph visualization
import { GraphDataPlugin, ClickSelectPlugin, DragElementPlugin } from '@invana/graph-canvas';

// Layout
import { D3ForceLayoutPlugin } from '@invana/layouts-d3-force';
```

---

## 7. Text and Graphics Resolution Quality

**Root cause of blurry text:** PixiJS `Text` renders to a 2D canvas at 1x resolution by default, then scales up. At high pixel ratios (Retina, 2x, 3x screens) the result looks soft.

**Fixes:**

### Immediate (no API changes)
1. Pass `resolution: window.devicePixelRatio` to every `Text` object created in label primitives
2. Ensure canvas init uses `resolution: window.devicePixelRatio, autoDensity: true` (already done partially)
3. For `BitmapText`: pre-render the font at `resolution: 2` so it's crisp when scaled

### Better text rendering: switch to `HTMLText` or `BitmapFont`

| Approach | Quality | Performance | Notes |
|---|---|---|---|
| `Text` (current) | Poor at scale | Fast for < 1K labels | Canvas 2D raster |
| `BitmapText` | Good | Very fast | Pre-raster; bad at extreme zoom |
| `HTMLText` (PixiJS 8) | Excellent | Moderate | HTML DOM; CSS font rendering |
| SDF fonts (PixiJS msdf-bmfont) | Perfect | Fast | Best for labels at all zoom levels |

**Recommendation for graph labels:** use `BitmapFont` with `resolution: window.devicePixelRatio * 2` — good quality, very fast, works for 100K nodes.

**Recommendation for annotations/tooltips:** use `HTMLText` — pixel-perfect because it uses the browser's font renderer.

### Graphics resolution
- PixiJS 8 with WebGPU: inherently crisper (no antialiasing artifacts from WebGL)
- Ensure `antialias: true` at canvas init ✅
- For very thin lines (1px): use `strokeWidth: 1 / camera.scale` so lines stay 1px at all zoom levels (currently not done — lines get thinner as you zoom in)

---

## 8. 100K Nodes/Edges — Rendering Performance

For production-scale graphs (100K nodes, 250K edges) the current per-object rendering model breaks down. This requires a full rethink of the rendering pipeline.

### Problem areas in current architecture
1. Each node is a separate PixiJS `Container + Graphics` — 100K containers = massive scene graph overhead
2. Each edge is a separate `Graphics` draw call — 250K Graphics = slow
3. No camera/viewport culling — off-screen elements still render
4. Labels are always rendered — at 100K nodes, labels alone kill performance
5. State changes trigger re-draw of individual elements — no batching

### PixiJS-Specific Performance Audit

The codebase uses **zero** GPU-optimized PixiJS primitives. Everything is `Graphics`-based imperative drawing. Here's what's missing and what to fix:

#### A. Graphics `clear()` + `render()` on Every State Change

Every hover, select, or drag calls:
```typescript
this._graphics.clear();   // destroys all GPU geometry
this.render();             // rebuilds from scratch
```
**Fix:** Use PixiJS 8 `cacheAsTexture(true)` on shapes that are not actively changing. Cache the `Graphics` as a GPU texture. Only call `cacheAsTexture(false)` → `clear()` → `render()` → `cacheAsTexture(true)` when the shape actually needs visual changes.

#### B. Labels: Destroyed & Recreated Every Update

`updateLabel()` calls `label.destroy()` then `new Text()` every time. `Text` objects are expensive — they rasterize to a hidden 2D canvas.

**Fix (immediate):** Reuse `Text` objects — update `text.text`, `text.style`, `text.position` instead of destroy+create. The existing `updateLabel()` function in `label.ts` exists but is **never called** by `RendererNodeBase`.

**Fix (scalable):** Switch to `BitmapText` for node labels — pre-rasterized at init, GPU-friendly, handles 100K labels. Use `Text` or `HTMLText` only for user-facing annotations.

**Fix (text resolution):** Always pass `resolution: Math.min(window.devicePixelRatio, 2)` to `Text` and `BitmapFont`. Current code doesn't set resolution, causing blurry text on Retina displays.

#### C. No Sprite Usage — Everything is Graphics

All nodes are drawn with `Graphics.circle()` + `.fill()` + `.stroke()`. Even image fills use `Graphics.fill({ texture })` instead of `Sprite`.

**Fix for image nodes:** Use `Sprite` for image-based nodes. `Sprite` is a single quad — drastically cheaper than a `Graphics` fill with texture matrix.

**Fix for icon nodes:** Pre-load icons into a `Spritesheet` (texture atlas). All icons become `Sprite` lookups from a shared atlas — one texture bind for all icons, minimal draw calls.

**Fix for uniform shapes (circle, rect):** For graphs where thousands of nodes share the same shape+style, render the shape once to a `RenderTexture`, then use `Sprite` clones. 1000 identical circles = 1 texture + 1000 cheap Sprites instead of 1000 expensive Graphics redraws.

```typescript
// Render a "prototype" circle to texture once
const prototype = new Graphics().circle(0, 0, 20).fill('#3fcbeb').stroke('#fff');
const texture = app.renderer.generateTexture(prototype);

// Clone as Sprite for each node
const nodeSprite = new Sprite(texture);
nodeSprite.position.set(x, y);
```

#### D. Image Loading: No Preloading or Batching

`loadImageTexture()` calls `Assets.load()` per image. 100 nodes with the same avatar URL rely on PixiJS's internal cache — no explicit warming.

**Fix:** Collect all unique image URLs from graph data, batch-load via `Assets.load([urls])` before rendering. Show a placeholder shape until images resolve.

```typescript
// Before rendering:
const uniqueUrls = [...new Set(nodes.map(n => n.imageUrl).filter(Boolean))];
await Assets.load(uniqueUrls);

// Now all textures are cached — Sprite creation is instant
```

#### E. Glow Effect: 9 Concentric Circles per Glow

`drawCircleGlow` draws **up to 9 overlapping filled circles** for a glow effect. Each is a separate `Graphics` path.

**Fix:** Replace with a single radial gradient fill, or pre-render the glow to a `RenderTexture` and use it as a `Sprite`. Since glow appearance only depends on `(color, radius, intensity)`, cache the texture by these parameters.

#### F. Ripple Animation: Graphics Clear/Redraw at 60fps

`updateRipple()` does `rippleGraphics.clear()` + `drawRippleEffect()` on every ticker frame.

**Fix:** Use `scale` animation on a pre-drawn ripple `Sprite` instead of redrawing geometry. Create the ripple shape once, then animate `sprite.scale` and `sprite.alpha` — no GPU geometry reconstruction.

#### G. Edge Re-rendering on Every Drag Frame

`updateConnectedEdges()` triggers full `clear()` + `render()` for every connected edge on every drag tick.

**Fix:** For straight-line edges, update only the endpoints without clearing — PixiJS 8 `Graphics` supports `setStrokeStyle` and path modification. For bezier/orthogonal edges that must recalculate control points, batch the redraws into a single frame via `requestAnimationFrame` coalescing.

#### H. No Viewport Culling

Layers never set `cullable = true` or `cullArea`. All off-screen shapes are processed by the renderer.

**Fix:** Enable PixiJS built-in culling:
```typescript
// On every Container (node, edge):
container.cullable = true;

// On the viewport/camera container:
viewport.cullArea = new Rectangle(0, 0, screenWidth, screenHeight);
```

For even better perf at 100K scale, use RBush spatial index (Tier 2 below).

#### I. No `renderGroup` for Static Subtrees

PixiJS 8 `renderGroups` batch a subtree into a single draw call when the subtree is static.

**Fix:** Mark static layers (e.g., background, non-interactive edges) as render groups:
```typescript
edgeLayer.isRenderGroup = true;  // PixiJS 8 batches this subtree
```

#### J. Badge Rendering: Raw Graphics Instead of Sprites

Badges are drawn with `new Graphics()` + `.circle()` + `.fill()`. Badges are uniform circles with text — prime candidates for `Sprite` + `BitmapText`.

**Fix:** Same `RenderTexture` + `Sprite` approach as node shapes. Badge styles are a small finite set — cache textures by `(color, size)` tuple.

### Strategy: tiered rendering

**Tier 1 — PixiJS optimization (no architecture change)**

Apply fixes A–J above. Expected impact: **2–5× faster** for 1K–10K elements.

| Fix | Effort | Impact |
|-----|--------|--------|
| H. Enable `cullable` | 1 line per element | High — removes off-screen from GPU pipeline |
| B. Reuse Text objects | Small refactor | Medium — eliminates Text allocation churn |
| A. `cacheAsTexture` for static shapes | Medium | High — reduces per-frame GPU work |
| I. `renderGroup` for edge layer | 1 line | Medium — batches static edges |
| D. Batch image preloading | Small | Medium — eliminates waterfall loads |
| C. Sprite for image nodes | Medium | High for image-heavy graphs |

**Tier 2 — LOD (Level of Detail) by zoom level**

| Zoom level | Node rendering | Edge rendering | Labels |
|---|---|---|---|
| < 0.15 | Single colored pixel (ParticleContainer) | Omit | None |
| 0.15–0.5 | Simple filled circle (no stroke, no badge) | Single line | None |
| 0.5–1.0 | Full shape (stroke, fill) | Bezier/line | None |
| > 1.0 | Full shape + effects | Full path | All |

**Tier 3 — Camera culling with spatial index**

Only process elements whose world bounding box intersects the current camera bounds. Use [RBush](https://github.com/mourner/rbush) (R*-tree) for O(log n) spatial queries on camera pan/zoom.

```typescript
// On every camera:pan / camera:zoom event
const visibleIds = spatialIndex.search(cameraBounds);
renderer.setVisibleSet(visibleIds);
```

**Tier 4 — Dirty flag + batched updates**

```typescript
// Instead of immediate re-render:
node.markDirty();

// Renderer collects dirty nodes during frame, redraws once:
renderer.onTick(() => {
  const dirty = renderer.getDirtyNodes();
  renderer.batchRedraw(dirty);
});
```

**Tier 5 — RenderTexture pooling for homogeneous shapes**

For graphs where many nodes share the same shape+style:

```typescript
// Shape texture cache: key = "circle:40:#3fcbeb:#fff:2"
const texturePool = new Map<string, Texture>();

function getShapeTexture(shape: string, size: number, fill: string, stroke: string): Texture {
  const key = `${shape}:${size}:${fill}:${stroke}`;
  if (!texturePool.has(key)) {
    const g = new Graphics();
    // draw shape...
    texturePool.set(key, app.renderer.generateTexture(g));
    g.destroy();
  }
  return texturePool.get(key)!;
}

// Each node becomes a Sprite — no per-node Graphics
const sprite = new Sprite(getShapeTexture('circle', 40, '#3fcbeb', '#fff'));
```

**Tier 6 — Typed arrays for node data**

Instead of `Map<id, { x, y, state, ... }>` (heap-allocated objects):

```typescript
// Compact representation for 100K nodes
const positions = new Float32Array(nodeCount * 2);  // [x0, y0, x1, y1, ...]
const sizes     = new Float32Array(nodeCount);
const states    = new Uint8Array(nodeCount);         // bitmask of states
const colors    = new Uint32Array(nodeCount);        // packed RGBA
```

Lookups via `idToIndex: Map<string, number>`.

**Tier 7 — Layout in a WebWorker**

D3 force layout blocks the main thread for large graphs. Run in a Worker:

```typescript
// Worker sends back positions on each tick
worker.postMessage({ type: 'tick', positions: Float32Array });

// Main thread updates node positions without recomputing layout
renderer.updatePositions(positions);
```

**Tier 8 — GPU instancing (WebGPU path, future)**

For graphs where all nodes are the same shape, use GPU instancing:
- 1 draw call for all circle nodes, regardless of count
- Per-instance data: `(x, y, radius, fillColor, strokeColor, opacity)` in a `Float32Array`
- WebGPU `drawIndexedIndirect` can render 100K circles in <1ms

### Implementation order
1. **Tier 1: PixiJS quick wins** (culling, cacheAsTexture, reuse Text, renderGroups, image preload)
2. Tier 3: Camera culling with RBush spatial index
3. Tier 2: LOD by zoom level
4. Tier 4: Dirty flag batching
5. Tier 5: RenderTexture pooling for Sprite-based nodes
6. Tier 7: WebWorker layout
7. Tier 6: Typed arrays (only if profiling shows Object overhead)
8. Tier 8: GPU instancing (WebGPU only, future)

---

## 9. Styling & State System — Redesign

### Current Flaws (must fix)

**Critical bugs:**

1. **Edges don't respect state priority.** Node `computeActiveStyle()` iterates `statePriority` in defined order. Edge `computeStateStyle()` iterates `_activeStates` (a `Set`) — result depends on **insertion order** (which `setState()` was called first), not declared priority. Hovering then selecting an edge gives a different result than selecting then hovering.

2. **Edge `resolveEdgeStyle()` doesn't deep-merge states.** Node style resolution deep-merges per-state: `{ ...defaultStates.selected, ...userStates.selected }`. Edge resolution flat-spreads: `{ ...defaultStyle, ...userStyle }` — if user provides `styles.edge.states.selected`, they **lose all other default states** (active, highlighted, muted, disabled).

3. **Node `setState('default', false)` has no guard.** Edges guard against removing DEFAULT. Nodes don't — calling `node.setState('default', false)` silently removes the base state, breaking style resolution.

**Design issues:**

4. **Manual property-by-property style copy.** `computeActiveStyle()` lists ~14 properties individually. Adding a new style property requires updating **two places** (priority loop + custom states loop). Violates DRY, error-prone.

5. **Custom states override priority-ordered states.** After the priority loop, `computeActiveStyle()` iterates `_activeStates` again for states NOT in the priority list. Custom states overlay on top of priority-ordered states — a custom `'loading'` state could accidentally override `'selected'`.

6. **State change events are asymmetric.** Nodes emit `statechange` from `setState()`. Edges don't. Plugin authors can't listen for edge state changes.

7. **Two-phase style resolution is tangled.** Phase 1 (`resolveNodeStyle`) eagerly evaluates function values for ALL states at creation time — even states that may never become active. Phase 2 (`computeActiveStyle`) then overlays pre-evaluated state styles. Wasted computation for inactive states.

**Performance issues:**

8. **Edge cache key is `JSON.stringify(entireStyleObject)`.** Node cache key: integer hash → O(1). Edge: serializes full style including nested `states` → O(n) string allocation per cache miss. At 10K edges, significant GC pressure.

9. **`reapplyStylesToAll()` — no batching.** Theme switching calls `forceRender()` per element individually. 10K nodes = 10K synchronous `clear() + render()` calls. Existing batch mode isn't used.

10. **Hover/select plugins iterate ALL elements.** `HoverActivatePlugin` and `ClickSelectPlugin` loop through every node/edge to apply `muted`/`inactive` states. Neither uses `startBatch()`/`endBatch()`. Every hover on a 10K graph triggers 10K `setState()` → 10K re-renders.

11. **Global style cache is never LRU-evicted.** 10K cap exists but no eviction. `clearGlobalStyleCache()` only called from `reapplyStylesToAll()`. Theme switching accumulates stale entries.

### Proposed Design for canvas-core Shapes

In the refactored canvas-core, **`ShapeStyle<TElement>`** is the base for all style definitions. All visual capabilities live here — there is no separate "effects" config object.

#### Style Value Type

```typescript
// T is the concrete value type, TElement is ICanvasNode | ICanvasEdge | ICanvasGroup
type StyleValue<T, TElement = unknown> = T | ((element: TElement, zoom: number) => T);
```

The `zoom` parameter enables LOD-aware styling: e.g. hide labels below zoom 0.3, switch to a simplified fill at zoom 0.1.

#### ShapeStyle Base Interface

```typescript
interface ShapeStyle<TElement = unknown> {
  // Fill
  fill?:         StyleValue<Fill | string | number, TElement>;

  // Strokes
  stroke?:       StyleValue<string | number, TElement>;   // innerStroke (body border)
  strokeWidth?:  StyleValue<number, TElement>;
  outerStroke?:  StyleValue<StrokeStyle, TElement>;        // ring outside the body
  innerStroke?:  StyleValue<StrokeStyle, TElement>;

  // Outline (thin line between body and outerStroke)
  outline?:      StyleValue<OutlineStyle, TElement>;

  // Glow / shadow
  shadow?:       StyleValue<ShadowStyle, TElement>;

  // Halo (soft radial glow, rendered as Sprite via RenderTextureCache)
  halo?:         StyleValue<HaloStyle, TElement>;

  // Pulse animation (sprite pool, tick-driven)
  pulse?:        StyleValue<PulseStyle, TElement>;

  // Label
  label?:        StyleValue<LabelStyle, TElement>;

  // Visibility
  opacity?:      StyleValue<number, TElement>;
  visible?:      StyleValue<boolean, TElement>;

  // Layer override (which named layer to deposit into)
  layer?:        string;

  // Effect scale behaviour at different zoom levels
  scalingMethod?: 'scaled' | 'fixed';

  // State overrides — same shape as parent style, all optional
  states?:       Record<string, Partial<ShapeStyle<TElement>>>;

  // Priority: last entry wins when multiple states active simultaneously
  statePriority?: string[];
}
```

#### Node, Edge, Group Styles

```typescript
// Adds node-specific properties on top of ShapeStyle
interface NodeStyle extends ShapeStyle<ICanvasNode> {
  shape?:   StyleValue<NodeShape, ICanvasNode>;   // 'circle'|'rect'|'ellipse'|...
  size?:    StyleValue<number, ICanvasNode>;
  icon?:    StyleValue<IconStyle, ICanvasNode>;
  image?:   StyleValue<ImageFill, ICanvasNode>;
  badges?:  StyleValue<BadgeStyle[], ICanvasNode>;
}

interface EdgeStyle extends ShapeStyle<ICanvasEdge> {
  width?:     StyleValue<number, ICanvasEdge>;
  pathType?:  StyleValue<'line' | 'bezier' | 'orthogonal', ICanvasEdge>;
  body?:      StyleValue<EdgeBodyStyle, ICanvasEdge>;
  head?:      StyleValue<ArrowStyle, ICanvasEdge>;
  tail?:      StyleValue<ArrowStyle, ICanvasEdge>;
  badge?:     StyleValue<BadgeStyle, ICanvasEdge>;
  flow?:      StyleValue<FlowStyle, ICanvasEdge>;
}

interface GroupStyle extends ShapeStyle<ICanvasGroup> {
  padding?:      StyleValue<number, ICanvasGroup>;
  borderRadius?: StyleValue<number, ICanvasGroup>;
}
```

#### State Management

```typescript
// States are managed externally by plugins / GraphDataPlugin
// NodeGfx / EdgeGfx do not track state — they render what they're given
// State merging happens in StyleResolver before NodeGfx receives anything

// GraphDataPlugin API:
graphPlugin.setNodeState(nodeId, 'selected', true);
graphPlugin.setNodeState(nodeId, 'selected', false);
graphPlugin.clearNodeStates(nodeId);
```

#### Style Resolution (StyleResolver)

```typescript
class StyleResolver {
  // Convert NodeStyle + active states → ResolvedNodeStyle (all concrete values)
  resolveNode(
    node: ICanvasNode,
    style: NodeStyle,
    activeStates: ReadonlySet<string>,
    zoom: number,
  ): ResolvedNodeStyle

  resolveEdge(
    edge: ICanvasEdge,
    style: EdgeStyle,
    activeStates: ReadonlySet<string>,
    zoom: number,
  ): ResolvedEdgeStyle
}
```

Resolution steps:
1. Merge state overrides in `statePriority` order (last wins) — `deepMergeStates()`
2. Call any `StyleValue` functions: `typeof value === 'function' ? value(element, zoom) : value`
3. `normalizeFill()`: coerce `string | number` → `SolidFill`
4. For image/pattern fills: if `AssetCache` has texture → embed it; else emit `fill: fallbackSolid` and re-emit `node:updated` (FILL dirty) when texture arrives

#### Resolved Style Types

```typescript
// ResolvedNodeStyle: same structure as NodeStyle but every StyleValue<T> → T
// No functions, no shorthands, no state maps — pure concrete values
interface ResolvedNodeStyle {
  shape:    NodeShape;
  size:     number;
  fill:     Fill;           // always a full Fill object after normalizeFill()
  stroke:   string | number;
  strokeWidth: number;
  outerStroke?: StrokeStyle;
  outline?:    OutlineStyle;
  halo?:       HaloStyle;
  pulse?:      PulseStyle;
  label?:      LabelStyle;
  icon?:       IconStyle;
  badges?:     BadgeStyle[];
  opacity:     number;
  visible:     boolean;
  // ... all other properties
}
// ResolvedEdgeStyle and ResolvedGroupStyle follow same pattern
```

#### Style Merge (3-layer, with proper deep-merge)

```typescript
// Layer 1: defaults  →  Layer 2: global style  →  Layer 3: per-element style override
function mergeStyles<T extends ShapeStyle<any>>(
  defaultStyle: T,
  globalStyle?: Partial<T>,
  elementStyle?: Partial<T>,
): T

// States are deep-merged: per-state partial styles stack correctly
// Adding a global 'selected' state does NOT wipe default 'active' state
```

#### Default State Priority

```typescript
const DEFAULT_STATE_PRIORITY = [
  'default',      // base — always active, always first
  'muted',        // lowest visual priority
  'disabled',
  'highlighted',
  'active',       // hover
  'selected',     // click selection
  'dragging',     // highest visual priority
];
```

---

---

## 10. Visual Effects System — Node & Edge Composable Effects

Production-grade graph visualization requires a rich composable effect system where each visual sub-component (halo, stroke, badge, pulse, etc.) is independently controllable, state-aware, zoom-responsive, and optimized for its own rendering characteristics. This section defines the full effects model.

---

### 10.1 Node Visual Layer Stack

Every node is rendered as a stack of independent visual layers (bottom → top):

```
[z-order]  Effect            PixiJS Object
──────────────────────────────────────────────────────────────────────
  -2        halo             Sprite from RenderTexture (pre-rendered glow disc)
  -1        outerStroke      Concentric Graphics shape, outside the node body
   0        node body        Graphics (fill + shape)
  +1        innerStroke      Thin stroke drawn inside the edge of the node body
  +2        outline          Single-stroke ring — used for selection/focus indicators
  +3        icon / image     Sprite (pre-rendered icon on RenderTexture)
  +4        badge (×4)       Sprites positioned at topLeft/topRight/bottomLeft/bottomRight corners
  +5        text / label     BitmapText (or HTMLText) positioned outside the node
  +pulse    pulse rings      Sprite pool with animated scale+alpha, on dedicated pulse layer
```

**Ownership**: each sub-effect lives in its own dedicated layer — halos always below the node body, badges always above. This enables per-layer `cacheAsTexture` and eliminates z-fighting.

---

### 10.2 Edge Visual Layer Stack

```
[z-order]  Effect            PixiJS Object
──────────────────────────────────────────────────────────────────────
  -1        halo             Sprite (wide soft blur behind the edge path)
   0        edge body        Graphics (line or triangle, style: plain/dashed/dotted)
  +1        stroke           Concentric path drawn around the edge body
  +2        outline          Selection ring around the edge
  +3        badge            Single Sprite positioned along the edge path
  +4        text             BitmapText (centered or shifted off the edge)
  +pulse    pulse rings      Sprite pool with animated scale+alpha
```

---

### 10.3 Node Shapes

All shapes are drawn via `graphics-utils/shapes/` primitives. No PixiJS primitives called directly from element classes.

| Shape | Value |
|---|---|
| Circle | `"circle"` |
| Cross | `"cross"` |
| Diamond | `"diamond"` |
| Pentagon | `"pentagon"` |
| Square | `"square"` |
| Star | `"star"` |
| Equilateral triangle | `"equilateral"` |

---

### 10.4 Edge Types, Extremities & Styles

**Edge body (`EdgeBodyType`)**:

| Type | Value |
|---|---|
| Line | `"line"` |
| Triangle (fat arrow) | `"triangle"` |

**Edge extremities (`EdgeExtremity`)** — apply to `head` and `tail` independently:

| Extremity | Value |
|---|---|
| None | `null` |
| Standard arrow | `"arrow"` |
| Circle-hole arrow | `"circle-hole-arrow"` |
| Triangle-hole arrow | `"triangle-hole-arrow"` |
| Short arrow | `"short-arrow"` |
| Open arrow | `"open-arrow"` |
| Sharp arrow | `"sharp-arrow"` |
| Circle terminus | `"circle"` |
| Square terminus | `"square"` |

**Edge line style (`EdgeStyle`)**:

| Style | Value |
|---|---|
| Solid | `"plain"` |
| Dotted | `"dotted"` |
| Dashed | `"dashed"` |

---

### 10.5 Node Effect Attribute Specification

All node visual effects are sub-objects of the node attribute. Each is independently nullable to disable.

```typescript
interface NodeVisualAttributes {
  // Core geometry
  shape?: NodeShape;                // default: "circle"
  radius?: number;                  // default: 5 (graph space)
  color?: Color | Color[];          // array = color pie chart segments
  opacity?: number;                 // 0–1
  layer?: number;                   // z-index: 1–3, default 1
  scalingMethod?: 'scaled' | 'fixed'; // default: "scaled"

  // Strokes
  innerStroke?: {
    color?: Color;                  // default: "white"
    width?: number;                 // default: 2 (pixel, inside node border)
    scalingMethod?: 'scaled' | 'fixed';
    minVisibleSize?: number;        // hide below this screen diameter
  };
  outerStroke?: {
    color?: Color | null;           // default: null (disabled)
    width?: number;                 // default: 5
    scalingMethod?: 'scaled' | 'fixed';
    minVisibleSize?: number;        // default: 0
  };

  // Selection / focus ring
  outline?: {
    enabled?: boolean;              // default: false
    color?: Color;                  // default: "rgba(0,0,0,0.36)"
    minVisibleSize?: number;        // default: 12
  };

  // Halo (ambient glow rendered BELOW node body)
  halo?: {
    color?: Color | null;           // default: null (disabled)
    width?: number;                 // default: 50 (pixels from node edge)
    strokeColor?: Color;            // ring outline color
    strokeWidth?: number;           // default: 1
    scalingMethod?: 'scaled' | 'fixed'; // default: "fixed"
    hideNonAdjacentEdges?: boolean; // fade non-adjacent edges while halo is shown
  };

  // Pulse (animated concentric expanding rings)
  pulse?: {
    enabled?: boolean;              // default: false (for continuous loop)
    duration?: number;              // ms per ring, default: 1000
    interval?: number;              // ms between rings, default: 800
    startColor?: Color;             // default: "rgba(0,0,0,0.6)"
    endColor?: Color;               // default: "rgba(0,0,0,0)"
    startRatio?: number;            // where pulse starts (1 = node border), default: 1
    endRatio?: number;              // where pulse ends, default: 2
    width?: number;                 // px width of pulse ring, default: 50
  };

  // Icon (glyph/text rendered inside node)
  icon?: {
    content?: string;               // character or text
    font?: string;                  // default: "Arial"
    color?: Color;                  // default: "black"
    scale?: number;                 // fraction of node radius, default: 0.7
    style?: 'normal' | 'bold' | 'italic';
    minVisibleSize?: number;        // default: 12
  };

  // Image (raster image inside node)
  image?: {
    url?: string | null;
    fit?: boolean;                  // default: true
    tile?: boolean;                 // default: false
    scale?: number;                 // default: 1
    minVisibleSize?: number;        // default: 12
  };

  // Badges (4-corner icons/labels)
  badges?: {
    topLeft?: Badge | null;
    topRight?: Badge | null;
    bottomLeft?: Badge | null;
    bottomRight?: Badge | null;
  };

  // Text / label
  text?: NodeTextAttributes;

  // Interaction flags
  detectable?: boolean;             // default: true
  draggable?: boolean;              // default: true
  layoutable?: boolean;             // default: true
}

interface Badge {
  color?: Color;                    // badge background fill, default: "white"
  scale?: number;                   // fraction of node size, default: 0.45
  positionScale?: number;           // distance from node center (1 = border), default: 1
  scalingMethod?: 'scaled' | 'fixed';
  minVisibleSize?: number;          // default: 12
  image?: { url?: string; scale?: number } | null;
  stroke?: { color?: Color; width?: number; scalingMethod?: 'scaled' | 'fixed' };
  text?: {
    content?: string;
    color?: Color;
    font?: string;
    scale?: number;                 // fraction of badge diameter, default: 0.5
    style?: 'normal' | 'bold' | 'italic';
    paddingLeft?: number;
    paddingTop?: number;
  };
}
```

---

### 10.6 Edge Effect Attribute Specification

```typescript
interface EdgeVisualAttributes {
  // Core geometry
  shape?: {
    body?: EdgeBodyType;             // "line" | "triangle"
    style?: 'plain' | 'dotted' | 'dashed';
    head?: EdgeExtremity;            // arrow at target end
    tail?: EdgeExtremity;            // arrow at source end
  };
  color?: Color | 'source' | 'target'; // default: "#617083"
  width?: number;                   // edge line width (graph space), default: 1
  opacity?: number;
  layer?: number;                   // z-index: -1 to 3
  scalingMethod?: 'scaled' | 'fixed';
  minVisibleSize?: number;          // hide edge below this screen width, default: 0
  adjustAnchors?: boolean;          // adjust endpoints for badges/shape, default: true

  // Edge stroke (border around the edge body)
  stroke?: {
    color?: Color | 'inherit';      // default: "inherit"
    width?: number;                 // default: 0 (disabled)
    minVisibleSize?: number;        // default: 0
  };

  // Outline (selection ring)
  outline?: {
    enabled?: boolean;              // default: false
    color?: Color;                  // default: "rgba(0,0,0,0.36)"
    minVisibleSize?: number;        // default: 0
  };

  // Halo (no strokeColor/strokeWidth unlike node halo)
  halo?: {
    color?: Color | null;
    width?: number;                 // default: 10
    scalingMethod?: 'scaled' | 'fixed'; // default: "fixed"
  };

  // Pulse
  pulse?: {
    enabled?: boolean;
    duration?: number;              // default: 1000
    interval?: number;              // default: 800
    startColor?: Color;
    endColor?: Color;
    startRatio?: number;            // default: 1
    endRatio?: number;              // default: 2
    width?: number;                 // px, default: 50
  };

  // Edge badge (single, positioned along the edge)
  badge?: EdgeBadge | null;

  // Text
  text?: EdgeTextAttributes;
}

interface EdgeBadge {
  position?: number | 'source' | 'target' | 'center'; // 0–1 or keyword
  // same badge properties as node Badge
}
```

---

### 10.7 Text System (Node & Edge)

**Node text** — rendered outside the node body:

```typescript
interface NodeTextAttributes {
  content?: string | null;
  position?: 'top' | 'right' | 'bottom' | 'left' | 'center'; // default: "bottom"
  color?: Color;                    // default: "black"
  font?: string;                    // default: "Arial"
  size?: number;                    // font size, default: 12
  style?: 'normal' | 'bold' | 'italic';
  align?: 'left' | 'center' | 'right';
  margin?: number;                  // gap from node edge, default: 10
  padding?: number;                 // padding inside background, default: 2
  backgroundColor?: Color | null;
  outline?: { color?: Color; width?: number }; // text stroke
  maxLineLength?: number;           // wrap text at this char count, 0 = unlimited
  scale?: number;                   // font size scaling, default: 0.1
  scaling?: boolean;                // whether text scales with zoom, default: false
  minVisibleSize?: number;          // hide text below this node screen size, default: 24
  tip?: boolean;                    // show pointer to node when text offset, default: true
  secondary?: NodeTextAttributes;   // second line below primary text
}
```

**Edge text** — rendered on the edge path:

```typescript
interface EdgeTextAttributes {
  content?: string | null;
  position?: 'shifted' | 'centered'; // default: "shifted"
  adjustAngle?: boolean;            // rotate text to follow edge direction, default: true
  color?: Color;
  font?: string;
  size?: number;                    // default: 12
  style?: 'normal' | 'bold' | 'italic';
  align?: 'left' | 'center' | 'right';
  margin?: number;                  // default: 2
  padding?: number;                 // default: 2
  backgroundColor?: Color | null;
  outline?: { color?: Color; width?: number };
  maxLineLength?: number;
  scale?: number;                   // default: 1
  scaling?: boolean;                // default: false
  minVisibleSize?: number;          // default: 4
  secondary?: EdgeTextAttributes;
}
```

---

### 10.8 Zoom-Dependent Styling

`minVisibleSize` is the threshold-based version of zoom-responsive visibility. The full zoom-responsive styling model goes further:

- Any style property that accepts a function receives `(element, zoomLevel)` — same as the current `(element)` function-based style, extended with zoom context.
- `scalingMethod`:
  - `"scaled"` — the effect grows proportionally with zoom (graph-space units). A node with `radius: 5` in graph space will be larger on screen when zoomed in.
  - `"fixed"` — the effect stays constant in screen pixels regardless of zoom. Useful for halos, pulse rings, and strokes where you want a consistent visual weight.
- `minVisibleSize` — when the element's screen-pixel size (diameter for nodes, width for edges) falls below this threshold, the sub-attribute is hidden. Each visual sub-component (icon, text, stroke, outline) has its own independent threshold.

**Layer-specific `minVisibleSize` defaults (pixels)**:

| Component | Node default | Edge default |
|---|---|---|
| `icon` | 12 | — |
| `image` | 12 | — |
| `innerStroke` | 0 | — |
| `outerStroke` | 0 | — |
| `outline` | 12 | 0 |
| `badge` | 12 | — |
| `text` | 24 | 4 |

---

### 10.9 PixiJS Implementation Per Effect

Each effect requires a different PixiJS optimization strategy:

| Effect | PixiJS Strategy | Notes |
|---|---|---|
| **Node body** | `Graphics` → `cacheAsTexture()` on first draw | Re-render only on attribute change |
| **innerStroke** | Drawn as part of body `Graphics`, cached together | No separate object |
| **outerStroke** | Separate `Graphics` behind node body | Cache separately |
| **outline** | Separate `Graphics` above body, cheap single ring path | Enable/disable via `visible` |
| **halo** | Pre-render to `RenderTexture` → `Sprite` | Never redrawn; position-only updates |
| **icon** | Pre-render glyph to `RenderTexture` → `Sprite` | Font atlas cache by font+char+color |
| **image** | Loaded `Texture` → `Sprite` | Standard asset loader; crop/fit via UV |
| **badge** | Pre-render badge to `RenderTexture` → `Sprite` | One `RenderTexture` per unique badge config |
| **text/label** | `BitmapText` (preferred) or `HTMLText` (rich) | See Section 7 for resolution details |
| **edge body** | `Graphics` per edge, re-render on path change | Skip on drag (use cached position) |
| **edge stroke** | Drawn as second, wider `Graphics` path | Share path computation with body |
| **edge extremity** | Pre-drawn arrow head `RenderTexture` → `Sprite` rotated | 9 types → 9 textures shared |
| **pulse** | Sprite pool; animate `scale` + `alpha` in RAF | No Graphics redraw per frame |
| **flow animation** | Dedicated Graphics layer cleared+redrawn per RAF tick | Hidden during drag |

**Dirty flag discipline** (ties into Section 9):
- `GEOMETRY_DIRTY` — node moved, edge endpoint changed → re-compute path only
- `STYLE_DIRTY` — color/stroke/fill changed → re-render Graphics or rebuild texture
- `VISIBILITY_DIRTY` — `visible` toggled → set `displayObject.visible`, no redraw
- `PULSE_DIRTY` — pulse params changed → rebuild pulse Sprite pool
- Each effect component tracks its own dirty flag independently — changing `outline.color` must not trigger halo texture rebuild.

---

### 10.10 State-Based Default Effects

The style system in Section 9 controls per-state overrides. These are the expected defaults for the graph-canvas layer (not canvas-core which is state-agnostic):

| State | Typical Effect Changes |
|---|---|
| **Default** | `innerStroke: { color: "white", width: 2 }`, no outline, no halo |
| **Hover** | `outerStroke: { color: "red", width: 10 }`, outline disabled |
| **Selected** | `innerStroke: { color: "white", width: 2 }`, `outerStroke: { color: "red", width: 7 }`, `outline: { enabled: true, color: "blue" }` |
| **Disabled** | Reduced `opacity: 0.3`, `color` muted |
| **Active / highlighted** | Halo enabled, outerStroke accent color |

State overrides are pure style-layer concerns — canvas-core shapes accept any attribute values; graph-canvas style rules generate the correct per-state attribute set via the style function chain (see Section 9).

---

## 11. Animation API

Two distinct animation systems exist: **attribute animation** (tweening visual properties of nodes/edges) and **camera animation** (panning/zooming the viewport). They share the same easing vocabulary but are otherwise independent.

---

### 11.1 Attribute Animation

Any visual property of a node or edge can be animated by passing `AttributeAnimationOptions` alongside a `setAttributes` call:

```typescript
// Tween a single attribute over 500ms
graphPlugin.getNode('n1').setAttributes(
  { color: '#ff0000', radius: 60 },
  { duration: 500, easing: 'cubicOut' }
); // returns Promise<void>

// Animate a whole list at once
graphPlugin.getNodes().setAttributes(
  { opacity: 0 },
  { duration: 300, easing: 'linear' }
);
```

**`AttributeAnimationOptions`**:
```typescript
type AttributeAnimationOptions = {
  duration?: number;  // ms, default: 0 (instant)
  easing?: Easing;    // default: "linear"
} | number;           // shorthand: pass duration directly
```

**`Easing`** values:
```
"linear" | "quadraticIn" | "quadraticOut" | "quadraticInOut"
        | "cubicIn"      | "cubicOut"      | "cubicInOut"
```

**Methods on node/edge list that accept `AttributeAnimationOptions`**:
- `setAttributes(attrs, opts?)` — tween to new attribute values
- `setAttribute(attr, value, opts?)` — single attribute tween
- `resetAttributes(attrs?, opts?)` — animate back to style-rule defaults
- `addClass(className, opts?)` / `removeClass(className, opts?)` — class-based style with animated transition
- `addClasses(names, opts?)` / `removeClasses(names, opts?)`

**Implementation**:
- Attribute tweens run on a shared `AnimationManager` that advances all active tweens in the PixiJS `Ticker` callback.
- Each tween stores: `{ element, attribute, startValue, endValue, elapsed, duration, easing }`.
- Color interpolation uses RGBA channel lerp. Number properties lerp linearly (with easing applied).
- Nested attributes (e.g. `halo.color`, `innerStroke.width`) are supported via a dotted-path resolver.
- When `duration: 0`, the change is applied synchronously in the same frame — no tween is created.
- Multiple simultaneous tweens on the same property → newer one cancels older.

---

### 11.2 Pulse Animation

Pulse is a specialized animation — N concentric rings expand outward from a node or edge over time. It is NOT a style property tween; it is a procedural animation effect.

```typescript
// Shorthand: fire 3 pulses on a node list
graphPlugin.getNode('n1').pulse({
  number: 3,           // total rings to fire (default: 1)
  duration: 1000,      // ms per ring fade, default: 1000
  interval: 800,       // ms between rings, default: 800
  startColor: 'rgba(0,0,0,0.6)',
  endColor: 'rgba(0,0,0,0)',
  startRatio: 1,       // 1 = starts at node edge
  endRatio: 2,         // 2 = expands to 2× node radius
  width: 50,           // ring width in pixels
}); // returns Promise<void> (resolves when all rings finish)

// Continuous loop: set enabled:true in attributes
graphPlugin.getNode('n1').setAttributes({
  pulse: { enabled: true, duration: 1000, interval: 800 }
});
```

**PixiJS implementation**:
- Pre-render a single ring shape to `RenderTexture` (gradient from `startColor` to transparent).
- Maintain a `SpritePool` per element. When a pulse fires, acquire a `Sprite`, set its `scale = startRatio`, `alpha = 1`.
- In `Ticker.add()`, advance elapsed time: interpolate `scale` from `startRatio → endRatio` and `alpha` from 1 → 0.
- On completion, return Sprite to pool. No re-draw per frame — only `scale` and `alpha` mutations.
- Pool size = `number` param (max concurrent rings). Shared texture for all instances of same pulse config.
- Pulse sprites render on a dedicated **pulse layer** that sits above all node/edge layers (to avoid clipping).

---

### 11.3 Camera Animation

Camera (viewport) animation is controlled separately via the `CameraAPI` (see Section 4):

```typescript
graphPlugin.getNode('n1').locate({
  duration: 400,
  easing: 'cubicInOut',
  padding: 50
});

canvas.camera.zoomTo(2.0, { duration: 300, easing: 'quadraticOut' });
canvas.camera.fitGraph({ duration: 500, padding: 40 });
```

**`CameraAnimationOptions`** (distinct from `AttributeAnimationOptions`):
```typescript
type CameraAnimationOptions = {
  duration?: number;
  easing?: Easing;
  padding?: number;   // graph-space padding for fit operations
};
```

`locate()` on a node/edge list computes the bounding box of the elements and calls `camera.fitRect(bbox, animOptions)` internally.

---

### 11.4 Layout Animation

When a layout algorithm runs, it can produce animated node movements via the same `setAttribute` + `AttributeAnimationOptions` pathway:

```typescript
const layout = new D3ForceLayoutPlugin({
  charge: -300,
  linkDistance: 100,
  animate: true,   // stream position updates → attribute tweens
  duration: 2000   // total animation budget
});
await layout.start();
```

With `animate: true`, the layout plugin emits position updates through the graph-canvas style/attribute pipeline, and each frame's delta is applied with a short `duration` tween so motion appears smooth rather than jumping.

---

### 11.5 Edge Flow Animation

Animated particles/dashes flowing along an edge path signal directionality:

```typescript
graphPlugin.getEdge('e1').setAttributes({
  flow: {
    enabled: true,
    speed: 1,         // particles per second
    color: '#58a6ff',
    width: 3,
    particleSize: 6,
    spacing: 40
  }
});
```

**PixiJS implementation**:
- Dedicated `FlowLayer` (a single `Graphics` object per frame clear+redraw approach, or a `ParticleContainer` for large counts).
- The `FlowAnimationManager` maintains an offset counter per edge, advancing by `speed * dt` each `Ticker` tick.
- On each tick: clear `FlowLayer.graphics`, re-draw current particle positions along each enabled edge's path.
- Hidden during drag (pause tick updates while `isDragging` flag is set) to avoid overdraw cost during panning.
- Batch all flow edge paths into a single `Graphics.beginFill` call per frame (one draw call for all flowing edges).

---

---

## 12. Renderer Layer Architecture

This section defines the complete data flow from user-supplied data through to PixiJS display objects on screen.

### 12.1 Layered Flow

```
USER WORLD
  ICanvasNode / ICanvasEdge / ICanvasGroup
  NodeStyle / EdgeStyle / GroupStyle (StyleValue functions, Fill shorthands)
        ↓
RESOLUTION LAYER  (StyleResolver)
  Calls StyleValue functions → concrete values
  normalizeFill() → SolidFill / LinearGradientFill / etc.
  Merges state overrides in statePriority order
  → ResolvedNodeStyle / ResolvedEdgeStyle (no functions, no shorthands)
        ↓
RENDERER LAYER  (NodeRenderer / EdgeRenderer)
  Diffs prev vs next ResolvedNodeStyle → DirtyFlags bitmask
  Creates / updates / destroys NodeGfx / EdgeGfx objects
  NodeGfx.update(resolved, dirty) — only redraws flagged refs
        ↓
LAYER WORLD  (LayerManager)
  Named PixiJS Containers at fixed z-indices:
    "edge-halos"   z:05
    "edge-bodies"  z:10
    "node-halos"   z:15
    "node-outer"   z:20
    "node-bodies"  z:25
    "node-outline" z:30
    "labels"       z:35
    "badges"       z:40
    "pulse"        z:45
        ↓
DISPLAY WORLD  (PixiJS Application → screen)
```

### 12.2 DirtyFlags

```typescript
const enum DirtyFlags {
  NONE     = 0,
  POSITION = 1 << 0,   // x, y moved — fast path, zero redraw
  GEOMETRY = 1 << 1,   // shape or size changed — full body redraw
  FILL     = 1 << 2,   // fill config changed
  STROKE   = 1 << 3,   // stroke / outerStroke changed
  OUTLINE  = 1 << 4,   // outline enabled / color changed
  HALO     = 1 << 5,   // halo config changed
  LABEL    = 1 << 6,   // label text or style changed
  BADGE    = 1 << 7,   // badge config changed
  PULSE    = 1 << 8,   // pulse config changed
  ALL      = ~0,
}
```

### 12.3 NodeRenderer

```typescript
class NodeRenderer {
  private gfxMap: Map<string, NodeGfx> = new Map();

  // node:added → allocate NodeGfx, mount into layers, full redraw
  add(node: ICanvasNode, resolved: ResolvedNodeStyle): void

  // node:updated → diff resolved styles, compute dirty flags, delegate to NodeGfx
  update(node: ICanvasNode, resolved: ResolvedNodeStyle): void

  // node:removed → unmount from layers, destroy PixiJS objects
  remove(nodeId: string): void

  // Position-only fast path (drag / layout tick)
  // Bypasses StyleResolver entirely — just sets .position on all refs
  setPosition(nodeId: string, x: number, y: number): void
}
```

Events `node:added`, `node:updated`, `node:removed` arrive from `GraphDataPlugin` via the internal `EventBus`.

### 12.4 NodeGfx

`NodeGfx` is a coordinator — NOT a PixiJS `Container` subclass. It holds references to individual PixiJS display objects deposited into named layers.

```typescript
class NodeGfx extends GfxBase {
  readonly id: string

  refs: {
    halo:        Sprite       // deposited into LayerManager["node-halos"]
    outerStroke: Graphics     // deposited into LayerManager["node-outer"]
    body:        Graphics     // deposited into LayerManager["node-bodies"]
    outline:     Graphics     // deposited into LayerManager["node-outline"]
    icon:        Sprite        // deposited into LayerManager["node-bodies"]
    badges:      Sprite[]     // deposited into LayerManager["badges"]
    label:       BitmapText   // deposited into LayerManager["labels"]
    pulsePool:   SpritePool   // deposited into LayerManager["pulse"]
  }

  // Add all refs to their respective layers
  mount(layers: LayerManager): void

  // Remove all refs from their layers
  unmount(layers: LayerManager): void

  // Release PixiJS objects (return to pools where applicable)
  destroy(): void

  // Wire PixiJS pointer events → EventBus domain events
  // Called once during mount()
  bindEvents(bus: EventBus, data: ICanvasNode): void

  // Selective redraw — only touches refs matching set dirty flags
  update(resolved: ResolvedNodeStyle, dirty: DirtyFlags): void

  // Position-only update — just .position.set() on all refs, zero redraw
  setPosition(x: number, y: number): void
}
```

`update()` logic per flag:

```
POSITION   → ALL refs: ref.position.set(x, y)              (zero redraw)
GEOMETRY | FILL | STROKE →
             body.clear()
             applyFill(body, resolved.fill, bounds)          (fills/fillResolver.ts)
             drawShapeGeometry(body, resolved.shape, resolved.size)
             body.cacheAsTexture(true)
STROKE     → outerStroke.clear()
             drawRing(outerStroke, resolved.outerStroke)
OUTLINE    → outline.visible = resolved.outline?.enabled
             drawOutline(outline, resolved.outline)
HALO       → tex = RenderTextureCache.get(hash(resolved.halo), drawFn)
             halo.texture = tex
             halo.visible = !!resolved.halo
LABEL      → label.text = resolved.label.content
             label.position.set(labelOffset(resolved))
BADGE      → badges[i].texture = RenderTextureCache.get(hash(badge), drawFn)
PULSE      → pulsePool.reconfigure(resolved.pulse)
```

### 12.5 RenderTextureCache

Shared singleton across all `NodeGfx` / `EdgeGfx` instances.

```typescript
class RenderTextureCache {
  private cache: Map<string, RenderTexture> = new Map();

  get(key: string, draw: (gfx: Graphics) => void): RenderTexture {
    if (this.cache.has(key)) return this.cache.get(key)!;
    const rt = RenderTexture.create(...);
    draw(this._tempGfx);
    renderer.render(this._tempGfx, { renderTexture: rt });
    this.cache.set(key, rt);
    return rt;
  }
}
```

Key formula: `hash(color + width + shape + size)`. 1000 nodes with the same halo config = **1 `RenderTexture`**.

### 12.6 SpritePool (pulse)

```typescript
class SpritePool {
  // Pre-allocate N sprites from a pre-rendered ring RenderTexture
  // Each tick: lerp scale 1→endRatio, alpha 1→0
  // Zero Graphics redraws per frame — only scale + alpha mutations
  reconfigure(config: PulseStyle): void
  tick(dt: number): void
}
```

### 12.7 EventBus wiring inside NodeGfx

```typescript
// Inside NodeGfx.bindEvents()
this.refs.body.eventMode = 'static';
this.refs.body.on('pointertap',  () => bus.emit('node:clicked',     { nodeId: data.id, node: data, position, originalEvent }));
this.refs.body.on('pointerover', () => bus.emit('node:hover',       { nodeId: data.id, node: data, position, originalEvent }));
this.refs.body.on('pointerout',  () => bus.emit('node:hoverend',    { nodeId: data.id, node: data, position, originalEvent }));
this.refs.body.on('rightclick',  () => bus.emit('node:contextmenu', { nodeId: data.id, node: data, position, originalEvent }));
this.refs.body.on('pointerdown', () => this._dragHandler.start(bus, data));
```

`NodeGfx` emits and stops. It never calls `setNodeState()` or alters any data. `ClickSelectPlugin` and `HoverActivatePlugin` receive the bus event and decide what to do.

---



| # | Question | Decision |
|---|---|---|
| 1 | Rename `primitives/` to what? | **`graphics-utils/`** |
| 2 | Where do GraphDataPlugin and interaction plugins live? | **New `packages/graph-canvas` (`@invana/graph-canvas`)** — graph elements, data, and all graph interaction plugins. No separate `canvas-plugins` package. |
| 3 | Event payloads: IDs only vs element references? | **`ICanvasNode` / `ICanvasEdge`** in payload — the user's own data object. No PixiJS types, no `NodeGfx` refs. `nodeId: string` always present for filtering without destructuring. See Decision 23. |
| 4 | `HTMLText` vs `BitmapFont` for labels? | **Deferred** — decide later |
| 5 | Activate commented-out node states (`LOADING`, `ERROR`, etc.)? | **Remove entirely** — YAGNI, add when needed |
| 6 | Plugin versioning: same monorepo vs separate repo? | **Same monorepo** |
| 7 | GPU instancing: opt-in or automatic? | **Deferred** — focus on culling + LOD first |
| 8 | Effect layer ownership: embed in element vs separate layer? | **Separate dedicated layers per effect** — halo below, pulse above. Enables per-layer `cacheAsTexture` |
| 9 | Pulse rendering: redraw Graphics vs Sprite pool? | **Sprite pool** — pre-render ring to `RenderTexture`, animate `scale`+`alpha` only; zero GPU redraw per frame |
| 10 | Edge flow animation: Canvas2D overlay vs PixiJS Graphics? | **PixiJS `Graphics` FlowLayer** — clear+redraw each tick, pause during drag |
| 11 | Attribute animation: per-element scheduler vs shared manager? | **Shared `AnimationManager`** ticked by PixiJS `Ticker`; newer tween cancels older on same property |
| 12 | Easing vocabulary | **`"linear"\|"quadraticIn/Out/InOut"\|"cubicIn/Out/InOut"`** — matches what production libraries use |
| 13 | `scalingMethod` for effects | **`"scaled"` (default) vs `"fixed"`** — fixed keeps pixel-constant width independent of zoom |
| 14 | Class naming: coordinator objects | **`NodeGfx`** / **`EdgeGfx`** / **`GroupGfx`** (was `RendererNodeBase` / `RendererEdgeBase`). Shared abstract base: **`GfxBase`**. Folder: `gfx/` (was `elements/`). These are coordinators — NOT PixiJS `Container` subclasses. They hold refs to individual PixiJS display objects deposited into named layers. |
| 15 | Class naming: renderer orchestrators | **`NodeRenderer`** / **`EdgeRenderer`** (was single `Renderer`). Each owns a `Map<id, NodeGfx\|EdgeGfx>` and handles `node:added/updated/removed` / `edge:added/updated/removed`. |
| 16 | Rename `Viewport` → `Camera` | **`Camera`** everywhere: class, folder (`camera/`), API (`canvas.camera`), events (`camera:zoom`, `camera:pan`). Public API typed as `CameraAPI` interface — no pixi-viewport types leak out. |
| 17 | Style input type | **`ShapeStyle<TElement>`** base interface — all visual capabilities as `StyleValue<T, TElement>`. `StyleValue<T, TElement> = T \| ((element: TElement, zoom: number) => T)`. `zoom` parameter enables LOD-aware styling. `NodeStyle extends ShapeStyle<ICanvasNode>` adds shape/size/icon/badges. `EdgeStyle extends ShapeStyle<ICanvasEdge>` adds pathType/head/tail/flow. `GroupStyle extends ShapeStyle<ICanvasGroup>` adds padding/borderRadius. |
| 18 | Resolved style types | **`ResolvedNodeStyle`** / **`ResolvedEdgeStyle`** / **`ResolvedGroupStyle`** — same structure as their `*Style` counterparts but with all `StyleValue<T>` replaced by concrete `T`. No functions. These are what `NodeGfx.update()` receives. Replaces `NodeVisualAttributes` / `EdgeVisualAttributes`. |
| 19 | Style resolution class | **`StyleResolver`** replaces `FunctionBasedStyle.ts`. Responsibilities: call `StyleValue` functions, run `normalizeFill()` (coerce `string\|number` → `SolidFill`), merge state overrides in priority order, deep-merge `states` maps. |
| 20 | Dirty flags | **`DirtyFlags`** bitmask const enum: `POSITION \| GEOMETRY \| FILL \| STROKE \| OUTLINE \| HALO \| LABEL \| BADGE \| PULSE`. `NodeRenderer` diffs previous vs new `ResolvedNodeStyle` to compute flags. `NodeGfx.update(resolved, dirty)` only redraws refs matching set flags. Position-only path (drag/layout tick): only `.position.set(x,y)` on all refs — zero redraw. |
| 21 | Shared GPU texture cache | **`RenderTextureCache`** — `Map<string, RenderTexture>` shared across all `NodeGfx` / `EdgeGfx` instances. Key = `hash(config)`. Used for halos, icons, badge backgrounds, arrow heads. 1000 nodes with identical halo config = 1 `RenderTexture`. |
| 22 | Fill system | `Fill` union (`SolidFill \| LinearGradientFill \| RadialGradientFill \| ImageFill \| PatternFill`) already in `style/fills/`. `StyleValue<Fill>` flows through `StyleResolver` → `ResolvedNodeStyle.fill: Fill`. Gradients use `textureSpace: 'local'` — coords are 0–1 relative to shape bounds, size-independent. Async fills (image/pattern): **Strategy A** — `AssetCache` pre-warms texture; `StyleResolver` emits a second `node:updated` (FILL dirty) once loaded; renders solid fallback on first pass. |
| 23 | Event payloads | Payloads carry **`ICanvasNode`** / **`ICanvasEdge`** (user data objects) — never `NodeGfx`, never PixiJS types. `NodeGfx` only emits to `EventBus`; plugins decide what to do. `ClickSelectPlugin` listens to `node:clicked` → calls `graphPlugin.setNodeState(id, 'selected', true)`. |
| 24 | Event registration API | **`canvas.on(event, cb)`** / **`canvas.once(event, cb)`** / **`canvas.off(event, cb)`** — three methods only. `on()` returns a disposer `() => void`. No `on:{}` in `CanvasOptions` — subscribe dynamically after `canvas.init()`. |

---

## Implementation Order (Proposed)

```
Phase 0   Audit (find all pixi.js leaks, any casts, duplicate stories)
Phase 1   Delete dead code (GroupsPlugin internals, processors refs, commented-out states)
Phase 2   Rename primitives/ → graphics-utils/
Phase 3   Rename viewport/ → camera/, Viewport → Camera, expose CameraAPI; update all event names viewport:* → camera:*
Phase 4   Rename elements/ → gfx/, RendererNodeBase → NodeGfx, RendererEdgeBase → EdgeGfx, RendererBase → GfxBase
Phase 5   Introduce NodeRenderer / EdgeRenderer; split Renderer.ts; add DirtyFlags
Phase 6   Rebuild styling: ShapeStyle<TElement>, StyleValue<T,TElement>, StyleResolver, ResolvedNodeStyle/EdgeStyle
Phase 7   Wire fill system: StyleValue<Fill> → StyleResolver → ResolvedNodeStyle.fill; add AssetCache pre-warming
Phase 8   Add RenderTextureCache + SpritePool; wire halo/pulse through cache
Phase 9   Fix event system: typed CanvasEventMap, ICanvasNode payloads, remove any casts; canvas.on/once/off only
Phase 10  Extract packages/graph-canvas — move graph elements, GraphDataPlugin, all interaction plugins
Phase 11  Camera culling + LOD (prerequisite for 100K performance)
Phase 12  Dirty flag batching (batch theme switches, hover muting)
Phase 13  Visual effects system (§10) — composable effect layer stack, node/edge shapes, strokes, halos, badges, text
Phase 14  Animation API (§11) — AttributeAnimationOptions, AnimationManager, pulse SpritePool, CameraAnimationOptions, edge flow
Phase 15  (Future) Text resolution improvements (BitmapFont / HTMLText)
Phase 16  (Future) GPU instancing (WebGPU, large graphs)
```

---

*Last updated: 2026-04-16 — added §12 Renderer Layer, updated §9 ShapeStyle<TElement>, decisions 14–24, Camera rename, fill system, event payload types*
