# Canvas Core Architecture Redesign

## Current Issues

1. **Unclear separation**: Canvas, Renderer, and UI-Shapes all deal with "rendering"
2. **Registry placement**: Unclear if it belongs to Canvas or Renderer
3. **No layer abstraction**: Hardcoded node/edge layers, not extensible
4. **Mixed concerns**: Primitives are separate but Registry is in canvas/
5. **Limited extensibility**: Hard to add new element types (groups, labels as first-class, annotations, etc.)

---

## Proposed Architecture

### **Core Principle**: Separation of Concerns + Extensibility via Processors

```
┌─────────────────────────────────────────────────────────────┐
│                    @canvas/core                             │
│    Canvas, Viewport, Layers, Renderer, Processors          │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┬──────────────┐
        ▼                   ▼                   ▼              ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐ ┌─────────────┐
│   Viewport   │    │    Layers    │    │   Renderer   │ │  Processors │
│  Pan/Zoom    │    │   Manager    │    │  (Engine)    │ │  Pipeline   │
└──────────────┘    └──────────────┘    └──────────────┘ └─────────────┘
                            │                   │              │
                            ▼                   ▼              ▼
                    ┌──────────────┐    ┌──────────────┐ ┌─────────────┐
                    │ Layer Stack  │    │  Primitives  │ │StyleManager │
                    │ - background │    │   Registry   │ │InteractionMgr│
                    │ - edges      │    │              │ │VisibilityMgr│
                    │ - nodes      │    └──────────────┘ └─────────────┘
                    │ - labels     │            │
                    │ - overlay    │            ▼
                    │ - custom...  │    ┌──────────────┐
                    └──────────────┘    │   Elements   │
                                        │ Nodes, Edges │
                                        │    Labels    │
                                        └──────────────┘

        Extension Packages (separate packages/)
        ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
        │  @canvas/groups  │    │@canvas/annotations│    │  @canvas/layout  │
        │  - RectGroup     │    │  - TextAnnotation │    │  - layout-d3     │
        │  - ConvexHull    │    │  - ShapeAnnotation│    │  - layout-elk    │
        │  - Containers    │    │  - Callouts       │    │  - layout-dagre  │
        └──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## Module Breakdown

### 1. **Core Module** (`/core`)
**Purpose**: Application lifecycle, initialization, configuration
- `Canvas.ts` - Main entry point, orchestrates all modules
- `Application.ts` - PixiJS app wrapper
- `Config.ts` - Configuration management

**Responsibility**: 
- Initialize PixiJS
- Coordinate modules
- Handle resize, destroy
- Expose public API

---

### 2. **Viewport Module** (`/viewport`)
**Purpose**: Camera control - pan, zoom, fit
- `Viewport.ts` - Pan/zoom/pinch handling
- `Camera.ts` - World ↔ Screen coordinate transforms
- `Bounds.ts` - Bounding box calculations

**Responsibility**:
- User interaction (drag, wheel, pinch)
- Coordinate transformations
- Viewport animations (smooth zoom, fit content)

---

### 3. **Layers Module** (`/layers`)
**Purpose**: Layer management - creation, ordering, visibility
- `LayerManager.ts` - Create, order, show/hide layers
- `Layer.ts` - Individual layer (Container wrapper)
- `LayerRegistry.ts` - Named layer lookup

**Responsibility**:
- Dynamic layer creation
- Z-index management
- Layer visibility/locking
- Layer groups (for complex UIs)

**API**:
```typescript
canvas.layers.create('annotations', { zIndex: 100 });
canvas.layers.get('nodes').visible = false;
canvas.layers.reorder(['background', 'edges', 'nodes', 'annotations']);
```

---

### 4. **Rendering Module** (`/rendering`)
**Purpose**: Low-level drawing primitives and element rendering
- `Renderer.ts` - Main rendering engine
- `Registry.ts` - Shape/path/arrow registry
- `ElementFactory.ts` - Create elements from data
- `RenderPipeline.ts` - Batch rendering, optimizations

**Submodules**:
- `/primitives` - Low-level drawing functions
  - `shapes/` - Circle, rect, polygon drawers
  - `paths/` - Line, bezier, orthogonal drawers
  - `arrows/` - Arrow head drawers
  - `labels/` - Text rendering
  - `effects/` - Shadows, glows, ripples

**Responsibility**:
- Primitive drawing (shapes, paths, text)
- Graphics pooling/caching
- Render optimizations
- Style application

---

### 5. **Elements Module** (`/elements`)
**Purpose**: Core graph elements (nodes, edges, labels)
- `BaseElement.ts` - Abstract element base
- `Node.ts` - Node wrapper (delegates to node shapes)
- `Edge.ts` - Edge wrapper (delegates to edge shapes)
- `Label.ts` - Standalone label element

**Submodules**:
- `/nodes` - Node shape implementations
  - `NodeShapeBase.ts`
  - `CircleNode.ts`, `RectNode.ts`, `PolygonNode.ts`, etc.
- `/edges` - Edge shape implementations
  - `EdgeShapeBase.ts`
  - `LineEdge.ts`, `BezierEdge.ts`, `OrthogonalEdge.ts`, etc.
- `/labels` - Label implementations
  - `TextLabel.ts`, `HTMLLabel.ts`

**Responsibility**:
- Element lifecycle (create, update, destroy)
- Element state (selected, hovered, dragged)
- Element interactions (click, drag, hover)
- Element relationships (node-edge connections)

**Note**: Groups and Annotations are separate packages; Layouts are completely removed from core (see Extension Packages below)

---

### 6. **Scene Module** (`/scene`)
**Purpose**: Scene graph management - element tracking, queries, relationships
- `SceneGraph.ts` - Element tree/graph
- `ElementManager.ts` - CRUD operations
- `QueryEngine.ts` - Search/filter elements
- `Relationships.ts` - Node-edge tracking

**Responsibility**:
- Element storage (spatial index for performance)
- Relationship tracking (which edges connect to which nodes)
- Queries (find nodes by property, find connected edges)
- Batch operations (select all, delete all visible)

**API**:
```typescript
canvas.scene.add(node);
canvas.scene.query({ type: 'node', selected: true });
canvas.scene.getConnectedEdges(nodeId);
canvas.scene.remove(nodeId);
```

---

### 7. **Interaction Module** (`/interaction`)
**Purpose**: User input handling - events, selection, drag
- `InteractionManager.ts` - Event coordinator
- `SelectionManager.ts` - Element selection
- `DragManager.ts` - Drag & drop
- `HoverManager.ts` - Hover states

**Responsibility**:
- Pointer events → element events
- Selection state management
- Drag behavior (constrained drag, snap-to-grid)
- Hover effects

---

## Proposed File Structure

### Core Package (`packages/canvas-core/`)
```
packages/canvas-core/src/
├── core/
│   ├── Canvas.ts                 # Main entry point
│   ├── Application.ts            # PixiJS app wrapper
│   ├── Config.ts                 # Configuration
│   └── index.ts
│
├── viewport/
│   ├── Viewport.ts               # Pan/zoom
│   ├── Camera.ts                 # Transforms
│   ├── Bounds.ts                 # Bounding boxes
│   └── index.ts
│
├── layers/
│   ├── LayerManager.ts           # Layer orchestration
│   ├── Layer.ts                  # Individual layer
│   ├── LayerConfig.ts            # Layer types/configs
│   └── index.ts
│
├── rendering/
│   ├── Renderer.ts               # Main renderer
│   ├── Registry.ts               # Primitive registry
│   ├── ElementFactory.ts         # Element creation
│   ├── RenderPipeline.ts         # Batch rendering
│   ├── primitives/
│   │   ├── shapes/               # Shape drawers
│   │   ├── paths/                # Path drawers
│   │   ├── arrows/               # Arrow drawers
│   │   ├── labels/               # Text rendering
│   │   ├── effects/              # Visual effects
│   │   └── index.ts
│   └── index.ts
│
├── elements/
│   ├── BaseElement.ts            # Abstract base
│   ├── Node.ts                   # Node wrapper
│   ├── Edge.ts                   # Edge wrapper
│   ├── Label.ts                  # Standalone label
│   ├── nodes/                    # Node shapes
│   │   ├── NodeShapeBase.ts
│   │   ├── CircleNode.ts
│   │   ├── RectNode.ts
│   │   ├── PolygonNode.ts
│   │   └── index.ts
│   ├── edges/                    # Edge shapes
│   │   ├── EdgeShapeBase.ts
│   │   ├── LineEdge.ts
│   │   ├── BezierEdge.ts
│   │   ├── OrthogonalEdge.ts
│   │   └── index.ts
│   ├── labels/                   # Label implementations
│   │   ├── TextLabel.ts
│   │   └── index.ts
│   └── index.ts
│
├── scene/
│   ├── SceneGraph.ts             # Element tree
│   ├── ElementManager.ts         # CRUD operations
│   ├── QueryEngine.ts            # Search/filter
│   ├── Relationships.ts          # Node-edge tracking
│   ├── SpatialIndex.ts           # Performance optimization
│   └── index.ts
│
├── interaction/
│   ├── InteractionManager.ts     # Event coordinator
│   ├── SelectionManager.ts       # Selection logic
│   ├── DragManager.ts            # Drag & drop
│   ├── HoverManager.ts           # Hover effects
│   └── index.ts
│
├── layout/ (optional)
│   ├── LayoutEngine.ts
│   ├── ForceLayout.ts
│   └── index.ts
│
├── types/
│   ├── common.ts                 # Shared types
│   ├── elements.ts               # Element types
│   ├── styles.ts                 # Style types
│   └── index.ts
│
├── utils/
│   ├── math.ts                   # Math utilities
│   ├── geometry.ts               # Geometry calculations
│   └── index.ts
│
└── index.ts                      # Main export
```

### Groups Package (`packages/canvas-groups/`)
```
packages/canvas-groups/src/
├── GroupBase.ts                  # Abstract group base
├── RectGroup.ts                  # Rectangular group
├── ConvexHullGroup.ts            # Auto-fitting group
├── CollapsibleGroup.ts           # Expandable group
├── GroupManager.ts               # Group lifecycle
├── types.ts                      # Group types
└── index.ts                      # Exports
```

### Annotations Package (`packages/canvas-annotations/`)
```
packages/canvas-annotations/src/
├── AnnotationBase.ts             # Abstract annotation base
├── TextAnnotation.ts             # Text annotations
├── ShapeAnnotation.ts            # Shape markup
├── Callout.ts                    # Callout/leader lines
├── Highlighter.ts                # Region highlights
├── ArrowAnnotation.ts            # Directional arrows
├── AnnotationManager.ts          # Annotation lifecycle
├── types.ts                      # Annotation types
└── index.ts                      # Exports
```

### Layout Package (`packages/canvas-layout/`)
```
packages/canvas-layout/
├── package.json
├── src/
│   ├── index.ts                  # Main export
│   ├── LayoutEngine.ts           # Layout coordinator
│   ├── BaseLayout.ts             # Abstract layout base
│   │
│   ├── layout-d3/                # D3 force layouts
│   │   ├── ForceLayout.ts
│   │   ├── ForceAtlas2.ts
│   │   └── index.ts
│   │
│   ├── layout-elk/               # Eclipse Layout Kernel
│   │   ├── ELKLayout.ts
│   │   ├── LayeredLayout.ts
│   │   └── index.ts
│   │
│   ├── layout-dagre/             # Dagre layouts
│   │   ├── DagreLayout.ts
│   │   └── index.ts
│   │
│   └── layout-custom/            # Custom layouts
│       ├── CircularLayout.ts
│       ├── GridLayout.ts
│       ├── TreeLayout.ts
│       └── index.ts
``` │   ├── labels/               # Text rendering
│   │   ├── effects/              # Visual effects
│   │   └── index.ts
│   └── index.ts
│
├── elements/
│   ├── BaseElement.ts            # Abstract base
│   ├── Node.ts                   # Node wrapper
│   ├── Edge.ts                   # Edge wrapper
│   ├── Group.ts                  # Group container
│   ├── Label.ts                  # Standalone label
│   ├── Annotation.ts             # Custom annotations
│   ├── nodes/                    # Node shapes
│   │   ├── NodeShapeBase.ts
│   │   ├── CircleNode.ts
│   │   ├── RectNode.ts
│   │   ├── PolygonNode.ts
│   │   └── index.ts
│   ├── edges/                    # Edge shapes
│   │   ├── EdgeShapeBase.ts
│   │   ├── LineEdge.ts
│   │   ├── BezierEdge.ts
│   │   ├── OrthogonalEdge.ts
│   │   └── index.ts
│   ├── groups/                   # Group implementations
│   │   ├── RectGroup.ts
│   │   └── index.ts
│   ├── labels/                   # Label implementations
│   │   ├── TextLabel.ts
│   │   └── index.ts
│   └── index.ts
│
├── scene/
│   ├── SceneGraph.ts             # Element tree
│   ├── ElementManager.ts         # CRUD operations
│   ├── QueryEngine.ts            # Search/filter
│   ├── Relationships.ts          # Node-edge tracking
│   ├── SpatialIndex.ts           # Performance optimization
│   └── index.ts
│
├── interaction/
│   ├── InteractionManager.ts     # Event coordinator
│   ├── SelectionManager.ts       # Selection logic
│   ├── DragManager.ts            # Drag & drop
│   ├── HoverManager.ts           # Hover effects
│   └── index.ts
│
├── layout/ (optional)
│   ├── LayoutEngine.ts
│   ├── ForceLayout.ts
│   └── index.ts
│
├── types/
│   ├── common.ts                 # Shared types
│   ├── elements.ts               # Element types
│   ├── styles.ts                 # Style types
│   └── index.ts
│
├── utils/
│   ├── math.ts                   # Math utilities
│   ├── geometry.ts               # Geometry calculations
│   └── index.ts
│
└── index.ts                      # Main export
```

---

## Migration Strategy

### Phase 1: Layer Abstraction (Week 1)
1. Create `LayerManager` class
2. Move layer creation from Canvas to LayerManager
3. Add dynamic layer support

### Phase 2: Renderer Refactor (Week 2)
1. Move `Registry` from `canvas/` to `rendering/`
2. Move `primitives/` under `rendering/`
3. Consolidate renderer logic

### Phase 3: Style System (Week 2-3)
1. Create `StyleManager` class
2. Implement `StyleResolver` for style computation
3. Add `ThemeManager` for theme support
4. Add style update methods to Canvas API

### Phase 4: Processor Pipeline (Week 3-4)
1. Create `ProcessorPipeline` orchestrator
2. Implement `BaseProcessor` abstract class
3. Build built-in processors:
   - StyleByPropertyProcessor
   - StyleByNeighborsProcessor
   - ZoomBasedVisibilityProcessor
4. Add processor registration API

### Phase 5: Scene Graph (Week 4-5)
1. Create `SceneGraph` module
2. Extract element tracking from Renderer
3. Add relationship tracking
4. Implement query engine
5. Integrate with StyleManager and Processors

### Phase 6: Element Abstraction (Week 5-6)
1. Create `BaseElement` abstraction
2. Refactor nodes/edges to use BaseElement
3. Add Label element type
4. Create ElementFactory

### Phase 7: Interaction (Week 6-7)
1. Create InteractionManager
2. Extract selection/drag logic
3. Add hover management
4. Integrate with Processors

### Phase 8: Extension Packages (Week 7-8)
1. Create `@canvas/layout` package structure
   - Setup monorepo for layout-d3, layout-elk, layout-dagre
2. Create `@canvas/groups` package
   - Implement GroupBase, RectGroup, ConvexHullGroup
3. Create `@canvas/annotations` package
   - Implement AnnotationBase, TextAnnotation, Callout

---

## Key Benefits

### ✅ **Clear Separation of Concerns**
- Each module has a single, well-defined responsibility
- Easy to understand what lives where

### ✅ **Extensibility**
- New element types: Just extend `BaseElement`
- New layers: Use `LayerManager.create()`
## Package Dependencies

```
### ✅ **Developer Experience**
```typescript
// Core API - Clean and intuitive
canvas.scene.addNode({ id: 'n1', x: 100, y: 100, shape: 'circle' });
canvas.layers.create('custom-overlay', { zIndex: 100 });
canvas.interaction.selection.select(['n1', 'n2']);
canvas.viewport.fitContent();

// Dynamic styling
canvas.style.update('n1', { fill: 0xFF0000, size: 50 });
canvas.style.setTheme('dark');

// Processors for custom behaviors
canvas.processors.add(new StyleByPropertyProcessor({
  property: 'type',
  colorMap: { user: 0xFF0000, system: 0x0000FF }
}));

canvas.processors.add(new ZoomBasedVisibilityProcessor({
  showLabelsAbove: 0.5
}));

// Optional extensions - Only import what you need
import { RectGroup } from '@canvas/groups';
import { Callout } from '@canvas/annotations';
import { ForceLayout } from '@canvas/layout/layout-d3';

const group = new RectGroup({ id: 'g1', children: ['n1', 'n2'] });
canvas.scene.addGroup(group);

const note = new Callout({ target: 'n1', text: 'Important!' });
canvas.scene.addAnnotation(note);

const layout = new ForceLayout({ strength: -500 });
await layout.apply(canvas);
```

### ✅ **Tree-Shakeable & Lightweight**
- Core package: Only nodes, edges, labels (~100KB)
- Groups package: +20KB (only if needed)
- Annotations package: +30KB (only if needed)
- No dead code in production bundles
- **Core** has no dependencies on extension packages
- **Groups** and **Annotations** depend on Core interfaces
- Users only install what they need

---

## Open Questions

1. **Processor execution order?**
   - Option A: User defines explicit order
   - Option B: Processors declare dependencies (before/after)
   - Option C: Priority-based (0-100)

2. **HTML vs Canvas labels?**
   - Support both: `TextLabel` (canvas) and `HTMLLabel` (DOM overlay) in Core

3. **Animation system?**
   - Add `animation/` module in Core for transitions (position, opacity, etc.)
   - Or separate `@canvas/animations` package?

4. **State management?**
   - Keep internal for now
   - Consider exposing adapters for Redux/MobX in v2

5. **StyleManager + Processors coordination?**
   - StyleManager handles direct style updates
   - Processors can trigger StyleManager updates
   - Clear separation: StyleManager = "how", Processors = "when/why"

6. **Other extension packages?**
   - `@canvas/minimap` - Overview + navigation
   - `@canvas/timeline` - Time-series visualization
   - `@canvas/export` - PNG/SVG/PDF export
   - `@canvas/themes` - Pre-built theme packs
   - `@canvas/analysis` - Graph metrics and analytics
```

---

## Open Questions

1. **Where should Layout live?**
   - Option A: Separate `layout` module (recommended)
   - Option B: Part of `scene` module
   - Option C: Separate package `@canvas/layouts`

2. **Should Groups be first-class citizens?**
   - Yes, they have unique behaviors (contain other elements, expandable)

3. **HTML vs Canvas labels?**
   - Support both: `TextLabel` (canvas) and `HTMLLabel` (DOM overlay)

4. **Animation system?**
   - Add `animation/` module for transitions (position, opacity, etc.)

5. **State management?**
   - Keep internal or expose Redux/MobX-like store?

---

## Next Steps

Would you like me to:
1. **Start implementing Layer abstraction** (easiest, immediate value)
2. **Create detailed API specs** for each module
3. **Build migration scripts** to refactor existing code
4. **Start with Scene Graph** (most impactful for extensibility)

Let me know which direction you'd like to go!
