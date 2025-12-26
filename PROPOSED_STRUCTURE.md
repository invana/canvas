# Proposed Code Structure After Refactor

## Root Structure
```
canvas/
├── packages/
│   ├── canvas-core/          # Main package (nodes, edges, labels)
│   ├── canvas-groups/        # Extension: Group containers
│   ├── canvas-annotations/   # Extension: Annotation tools
│   ├── canvas-utils/         # Utilities (existing)
│   └── ui/                   # UI components (existing)
├── apps/
│   └── storybook/           # Dev/demo environment
└── ...
```

---

## Package 1: `@canvas/core` (Main Package)

### File Structure (Re-using Existing Code)
```
packages/canvas-core/
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── src/
    ├── index.ts                      # Main export
    │
    ├── core/                         # Application lifecycle (NEW)
    │   ├── Canvas.ts                 # ← Move from canvas/Canvas.ts
    │   ├── Config.ts                 # Configuration management (NEW)
    │   └── index.ts
    │
    ├── viewport/                     # Pan/Zoom/Camera (REFACTOR)
    │   ├── Viewport.ts               # ← Move from canvas/Viewport.ts
    │   ├── Camera.ts                 # Coordinate transforms (NEW)
    │   ├── Bounds.ts                 # Bounding box calculations (NEW)
    │   └── index.ts
    │
    ├── layers/                       # Layer management (NEW)
    │   ├── LayerManager.ts           # Create/order/show/hide layers
    │   ├── Layer.ts                  # Individual layer wrapper
    │   ├── LayerConfig.ts            # Layer configuration types
    │   └── index.ts
    │
    ├── rendering/                    # Rendering engine (REFACTOR)
    │   ├── Renderer.ts               # ← Move from canvas/Renderer.ts
    │   ├── Registry.ts               # ← Move from canvas/Registry.ts
    │   ├── ElementFactory.ts         # Factory for creating elements (NEW)
    │   └── index.ts
    │
    ├── primitives/                   # ← KEEP AS-IS (existing)
    │   ├── shapes/
    │   │   ├── circle.ts             # Existing: drawCircle
    │   │   ├── ellipse.ts            # Existing: drawEllipse
    │   │   ├── rect.ts               # Existing: drawRect
    │   │   ├── roundedRect.ts        # Existing: drawRoundedRect
    │   │   ├── polygon.ts            # Existing: drawPolygon (triangle, diamond, etc.)
    │   │   ├── types.ts              # Existing: ShapeStyle, ShapeDrawFn
    │   │   └── index.ts
    │   ├── paths/
    │   │   ├── line.ts               # Existing: drawLine
    │   │   ├── bezier.ts             # Existing: drawAutoBezier
    │   │   ├── orthogonal.ts         # Existing: drawOrthogonalPath
    │   │   ├── types.ts              # Existing: PathStyle, Point, Direction
    │   │   └── index.ts
    │   ├── arrows/
    │   │   ├── triangle.ts           # Existing: triangle arrow
    │   │   ├── circle.ts             # Existing: circle arrow
    │   │   ├── diamond.ts            # Existing: diamond arrow
    │   │   ├── square.ts             # Existing: square arrow
    │   │   ├── types.ts              # Existing: ArrowType, ArrowStyle
    │   │   └── index.ts
    │   ├── labels/
    │   │   ├── label.ts              # Existing: createPositionedLabel
    │   │   ├── types.ts              # Existing: LabelStyle, LabelPosition
    │   │   └── index.ts
    │   ├── effects/
    │   │   ├── ripple.ts             # Existing: drawRippleEffect
    │   │   ├── glow.ts               # Existing: drawGlow
    │   │   ├── types.ts              # Existing effect types
    │   │   └── index.ts
    │   └── index.ts
    │
    ├── elements/                     # ← RENAME from ui-shapes (structure preserved)
    │   ├── BaseShape.ts              # ← KEEP AS-IS from ui-shapes/BaseShape.ts
    │   ├── nodes/
    │   │   ├── NodeShapeBase.ts      # ← KEEP AS-IS (existing abstract base)
    │   │   ├── CircleNode.ts         # ← KEEP AS-IS (existing)
    │   │   ├── EllipseNode.ts        # ← KEEP AS-IS (existing)
    │   │   ├── RectNode.ts           # ← KEEP AS-IS (existing)
    │   │   ├── RoundedRectNode.ts    # ← KEEP AS-IS (existing)
    │   │   ├── PolygonNode.ts        # ← KEEP AS-IS (existing)
    │   │   ├── createNode.ts         # ← KEEP AS-IS (existing factory)
    │   │   └── index.ts
    │   ├── edges/
    │   │   ├── EdgeShapeBase.ts      # ← KEEP AS-IS (existing abstract base)
    │   │   ├── LineEdge.ts           # ← KEEP AS-IS (existing)
    │   │   ├── BezierEdge.ts         # ← KEEP AS-IS (existing)
    │   │   ├── OrthogonalEdge.ts     # ← KEEP AS-IS (existing)
    │   │   ├── createEdge.ts         # ← KEEP AS-IS (existing factory)
    │   │   └── index.ts
    │   ├── labels/                   # Labels as first-class (NEW)
    │   │   ├── TextLabel.ts          # Canvas text label (NEW)
    │   │   └── index.ts
    │   └── index.ts
    │
    ├── scene/                        # Scene graph (NEW)
    │   ├── SceneGraph.ts             # Element tree/graph
    │   ├── ElementManager.ts         # CRUD operations
    │   ├── QueryEngine.ts            # Search/filter elements
    │   ├── Relationships.ts          # Node-edge connections
    │   ├── SpatialIndex.ts           # Performance optimization
    │   └── index.ts
    │
    ├── interaction/                  # User interactions (NEW - extract from shapes)
    │   ├── InteractionManager.ts     # Event coordinator
    │   ├── SelectionManager.ts       # Element selection
    │   ├── DragManager.ts            # Drag & drop logic
    │   ├── HoverManager.ts           # Hover state management
    │   └── index.ts
    │
    ├── style/                        # Style management (NEW)
    │   ├── StyleManager.ts           # Style orchestrator
    │   ├── StyleResolver.ts          # Resolve styles
    │   ├── ThemeManager.ts           # Theme management
    │   ├── StyleCache.ts             # Performance cache
    │   └── index.ts
    │
    ├── processors/                   # Extensible processor pipeline (NEW)
    │   ├── ProcessorPipeline.ts      # Processor execution
    │   ├── ProcessorRegistry.ts      # Processor type registry
    │   ├── BaseProcessor.ts          # Abstract processor
    │   ├── StyleByPropertyProcessor.ts
    │   ├── StyleByNeighborsProcessor.ts
    │   ├── ZoomBasedVisibilityProcessor.ts
    │   ├── ConditionalStyleProcessor.ts
    │   ├── InteractionFilterProcessor.ts
    │   └── index.ts
    │
    ├── types/                        # Shared types (NEW - consolidate)
    │   ├── common.ts                 # Common types
    │   ├── elements.ts               # Element types
    │   ├── styles.ts                 # Style types
    │   ├── events.ts                 # Event types
    │   └── index.ts
    │
    └── utils/                        # Utilities (NEW)
        ├── math.ts                   # Math helpers
        ├── geometry.ts               # Geometric calculations
        ├── colors.ts                 # Color utilities
        └── index.ts
```

### What We KEEP (Existing Code - No Changes)

#### Primitives Module (100% preserved)
All pure drawing functions stay exactly as they are:
- `primitives/shapes/` - drawCircle, drawRect, drawEllipse, drawPolygon, etc.
- `primitives/paths/` - drawLine, drawAutoBezier, drawOrthogonalPath
- `primitives/arrows/` - triangle, circle, diamond, square arrows
- `primitives/labels/` - createPositionedLabel, LabelStyle
- `primitives/effects/` - drawRippleEffect, drawGlow

#### UI-Shapes (Rename to elements/, keep internals)
- `BaseShape.ts` - Abstract base class (KEEP)
- `nodes/NodeShapeBase.ts` - Abstract node base with dragging, selection, hover, ripple (KEEP)
- `nodes/CircleNode.ts`, `EllipseNode.ts`, `RectNode.ts`, `RoundedRectNode.ts`, `PolygonNode.ts` (KEEP)
- `nodes/createNode.ts` - Factory function (KEEP)
- `edges/EdgeShapeBase.ts` - Abstract edge base with arrows, tangents (KEEP)
- `edges/LineEdge.ts`, `BezierEdge.ts`, `OrthogonalEdge.ts` (KEEP)
- `edges/createEdge.ts` - Factory function (KEEP)

#### Canvas Module (Move + Extend)
- `Registry.ts` - Move to `rendering/Registry.ts` (KEEP all existing code)
- `Renderer.ts` - Move to `rendering/Renderer.ts` (KEEP + extend with new methods)
- `Viewport.ts` - Move to `viewport/Viewport.ts` (KEEP)
- `Canvas.ts` - Move to `core/Canvas.ts` (KEEP + extend with new APIs)

### Key Files

#### `src/index.ts` - Main Export (Updated to include existing)
```typescript
// Core
export { Canvas } from './core/Canvas';
export type { CanvasConfig, CanvasData, ProcessorConfig } from './core/Canvas';

// Viewport
export { Viewport } from './viewport/Viewport';
export type { ViewportOptions } from './viewport/Viewport';

// Primitives (EXISTING - fully preserved)
export * from './primitives';
// Re-exports: drawCircle, drawRect, drawEllipse, drawPolygon, drawLine, 
//             drawAutoBezier, drawOrthogonalPath, drawArrow, drawRippleEffect,
//             createPositionedLabel, etc.

// Elements (renamed from ui-shapes)
export { BaseShape } from './elements/BaseShape';
export type { BaseShapeData, BaseShapeStyle, BaseShapeOptions } from './elements/BaseShape';

// Nodes (EXISTING - fully preserved)
export { NodeShapeBase } from './elements/nodes/NodeShapeBase';
export type { NodeData, NodeStyle, NodeShapeOptions, Point, Bounds } from './elements/nodes/NodeShapeBase';
export { CircleNode } from './elements/nodes/CircleNode';
export { EllipseNode } from './elements/nodes/EllipseNode';
export { RectNode } from './elements/nodes/RectNode';
export { RoundedRectNode } from './elements/nodes/RoundedRectNode';
export { PolygonNode } from './elements/nodes/PolygonNode';
export { createNode } from './elements/nodes/createNode';

// Edges (EXISTING - fully preserved)
export { EdgeShapeBase } from './elements/edges/EdgeShapeBase';
export type { EdgeData, EdgeStyle, EdgeShapeOptions, EdgeTangents } from './elements/edges/EdgeShapeBase';
export { LineEdge } from './elements/edges/LineEdge';
export { BezierEdge } from './elements/edges/BezierEdge';
export { OrthogonalEdge } from './elements/edges/OrthogonalEdge';
export { createEdge } from './elements/edges/createEdge';

// Rendering
export { Renderer } from './rendering/Renderer';
export { Registry } from './rendering/Registry';
export type { NodeInput, EdgeInput } from './rendering/Renderer';

// Scene
export { SceneGraph } from './scene/SceneGraph';

// Style (NEW)
export { StyleManager } from './style/StyleManager';
export type { ComputedStyle, StyleFilter } from './style/StyleManager';

// Processors (NEW)
export { ProcessorPipeline } from './processors/ProcessorPipeline';
export { BaseProcessor } from './processors/BaseProcessor';
export { StyleByPropertyProcessor } from './processors/StyleByPropertyProcessor';
export { StyleByNeighborsProcessor } from './processors/StyleByNeighborsProcessor';
export { ZoomBasedVisibilityProcessor } from './processors/ZoomBasedVisibilityProcessor';

// Types
export type * from './types';
```

#### `src/core/Canvas.ts` - Main Orchestrator (Extended from existing)
```typescript
/**
 * Canvas.ts
 * 
 * Extended from existing canvas/Canvas.ts
 * Adds: StyleManager, ProcessorPipeline, declarative config
 * Keeps: All existing PixiJS app, viewport, registry, renderer logic
 */

import { Application, Container } from 'pixi.js';
import { Viewport } from '../viewport/Viewport';
import { LayerManager } from '../layers/LayerManager';
import { Renderer } from '../rendering/Renderer';
import { Registry } from '../rendering/Registry';
import { SceneGraph } from '../scene/SceneGraph';
import { InteractionManager } from '../interaction/InteractionManager';
import { StyleManager } from '../style/StyleManager';
import { ProcessorPipeline } from '../processors/ProcessorPipeline';

// EXISTING node/edge types from ui-shapes
import { createNode, type NodeData, type NodeStyle } from '../elements/nodes';
import { createEdge, type EdgeData, type EdgeStyle } from '../elements/edges';

export interface CanvasConfig {
  container: HTMLElement;
  width: number;
  height: number;
  
  // Processor configuration (NEW)
  processors?: ProcessorConfig[];
  
  // Style configuration (NEW)
  theme?: string | ThemeConfig;
  styles?: StyleConfig;
  
  // Viewport configuration (EXISTING)
  viewport?: ViewportConfig;
  
  // Other existing options...
}

export interface ProcessorConfig {
  type: string;
  enabled?: boolean;
  priority?: number;
  options: Record<string, any>;
}

export class Canvas {
  // EXISTING - preserved
  private app: Application;
  private _viewport: Viewport;
  private _registry: Registry;
  private _renderer: Renderer;
  
  // Layers
  private nodeLayer: Container;
  private edgeLayer: Container;
  private labelLayer: Container;
  
  // NEW - added
  private layerManager: LayerManager;
  private scene: SceneGraph;
  private interaction: InteractionManager;
  
  // Public APIs
  public style: StyleManager;
  public processors: ProcessorPipeline;
  
  // EXISTING - preserved accessors
  get viewport(): Viewport { return this._viewport; }
  get registry(): Registry { return this._registry; }
  get renderer(): Renderer { return this._renderer; }

  constructor(config: CanvasConfig) {
    // EXISTING - preserved initialization
    this.app = new Application();
    
    // EXISTING - viewport
    this._viewport = new Viewport({
      screenWidth: config.width,
      screenHeight: config.height,
      ...config.viewport
    });
    
    // EXISTING - registry with all primitives
    this._registry = new Registry();
    
    // NEW - layer manager
    this.layerManager = new LayerManager(this._viewport);
    
    // NEW - style manager
    this.style = new StyleManager(config.theme, config.styles);
    
    // NEW - scene graph
    this.scene = new SceneGraph();
    
    // NEW - processor pipeline
    this.processors = new ProcessorPipeline(this.style, this.scene);
    
    // EXISTING - renderer (extended with style manager)
    this._renderer = new Renderer({
      registry: this._registry,
      nodeLayer: this.nodeLayer,
      edgeLayer: this.edgeLayer,
      labelLayer: this.labelLayer,
      styleManager: this.style,  // NEW integration
    });
    
    // NEW - interactions
    this.interaction = new InteractionManager(this._viewport, this.scene);
    
    // NEW - register processors from config
    if (config.processors) {
      this.registerProcessorsFromConfig(config.processors);
    }
  }

  // EXISTING - preserved
  async init() {
    await this.app.init({
      resizeTo: this.config.container,
      backgroundColor: 0xffffff,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      preference: 'webgpu',
    });
    
    this.config.container.appendChild(this.app.canvas);
    this.app.stage.addChild(this._viewport);
    
    // EXISTING - setup layers
    this.setupLayers();
    
    // EXISTING - setup events
    this.setupEventListeners();
    
    // NEW - run processors on init
    await this.processors.execute('init');
  }

  // EXISTING - preserved
  private setupLayers() {
    this.edgeLayer = new Container();
    this.nodeLayer = new Container();
    this.labelLayer = new Container();
    
    this._viewport.addChild(this.edgeLayer);
    this._viewport.addChild(this.nodeLayer);
    this._viewport.addChild(this.labelLayer);
  }

  // NEW - processor configuration
  private registerProcessorsFromConfig(configs: ProcessorConfig[]) {
    configs.forEach(config => {
      if (config.enabled === false) return;
      
      const processor = this.processors.createFromConfig(config);
      if (processor) {
        this.processors.add(processor, config.priority);
      }
    });
  }

  // EXISTING - preserved (uses existing createNode factory)
  addNode(data: NodeData, style?: NodeStyle) {
    const node = this._renderer.addNode(data, style);
    this.scene.add(node);
    
    // NEW - run processors
    this.processors.execute('node-added', { element: node });
    
    return node;
  }

  // EXISTING - preserved (uses existing createEdge factory)
  addEdge(data: EdgeData, style?: EdgeStyle) {
    const edge = this._renderer.addEdge(data, style);
    this.scene.add(edge);
    
    // NEW - run processors
    this.processors.execute('edge-added', { element: edge });
    
    return edge;
  }

  // EXISTING - preserved
  updateNode(nodeId: string, updates: Partial<NodeData>) {
    this._renderer.updateNode(nodeId, updates);
  }

  // EXISTING - preserved
  updateEdge(edgeId: string, updates: Partial<EdgeData>) {
    this._renderer.updateEdge(edgeId, updates);
  }

  // NEW - style API
  updateNodeStyle(nodeId: string, style: Partial<NodeStyle>) {
    this.style.update(nodeId, style);
    this._renderer.updateNode(nodeId);
  }

  // NEW - processor config API
  updateProcessorConfig(type: string, options: Record<string, any>) {
    this.processors.updateConfig(type, options);
  }

  // NEW - toggle processor
  toggleProcessor(type: string, enabled: boolean) {
    if (enabled) {
      this.processors.enable(type);
    } else {
      this.processors.disable(type);
    }
  }

  // NEW - scene queries
  query(filters: QueryFilters) {
    return this.scene.query(filters);
  }

  // EXISTING - preserved
  render(data: CanvasData) {
    // Existing render logic...
  }

  // EXISTING - preserved
  destroy() {
    this.app.destroy(true);
  }

  // ... more existing methods preserved
}
```

#### `src/layers/LayerManager.ts`
```typescript
import { Container } from 'pixi.js';
import { Layer } from './Layer';

export class LayerManager {
  private layers: Map<string, Layer> = new Map();
  private layerOrder: string[] = [];

  constructor(private viewport: Container) {}

  create(name: string, options?: LayerOptions): Layer {
    const layer = new Layer(name, options);
    this.layers.set(name, layer);
    this.layerOrder.push(name);
    this.viewport.addChild(layer.container);
    return layer;
  }

  get(name: string): Layer | undefined {
    return this.layers.get(name);
  }

  reorder(order: string[]) {
    // Reorder layers by z-index
  }

  show(name: string) {
    this.layers.get(name)?.show();
  }

  hide(name: string) {
    this.layers.get(name)?.hide();
  }
}
```

#### `src/scene/SceneGraph.ts`
```typescript
export class SceneGraph {
  private elements: Map<string, BaseElement> = new Map();
  private relationships: Map<string, string[]> = new Map();
  private spatialIndex: SpatialIndex;

  add(element: BaseElement) {
    this.elements.set(element.id, element);
    this.spatialIndex.insert(element);
  }

  remove(id: string) {
    const element = this.elements.get(id);
    if (element) {
      this.elements.delete(id);
      this.spatialIndex.remove(element);
    }
  }

  query(filters: QueryFilters): BaseElement[] {
    // Search by type, properties, spatial location
  }

  getConnectedEdges(nodeId: string): Edge[] {
    const edgeIds = this.relationships.get(nodeId) || [];
    return edgeIds.map(id => this.elements.get(id) as Edge);
  }
}
```

#### `src/style/StyleManager.ts`
```typescript
export class StyleManager {
  private styles: Map<string, ComputedStyle> = new Map();
  private cache: StyleCache = new StyleCache();
  private resolver: StyleResolver = new StyleResolver();
  private theme: ThemeManager = new ThemeManager();

  // Update style for single element
  update(elementId: string, style: Partial<Style>) {
    const current = this.styles.get(elementId) || {};
    const updated = { ...current, ...style };
    this.styles.set(elementId, updated);
    this.cache.invalidate(elementId);
  }

  // Update style for multiple elements
  updateMany(elementIds: string[], style: Partial<Style>) {
    elementIds.forEach(id => this.update(id, style));
  }

  // Apply style rule based on conditions
  applyRule(filter: StyleFilter, style: Partial<Style>) {
    // Apply style to all elements matching filter
    // e.g., { type: 'node', property: 'degree > 5' }
  }

  // Get computed style (includes theme, state, overrides)
  get(elementId: string, state?: ElementState): ComputedStyle {
    const cached = this.cache.get(elementId, state);
    if (cached) return cached;

    const resolved = this.resolver.resolve(
      elementId,
      this.theme.current,
      state
    );
    this.cache.set(elementId, state, resolved);
    return resolved;
  }

  // Theme management
  setTheme(themeName: string) {
    this.theme.setActive(themeName);
    this.cache.clear(); // Invalidate all cached styles
  }
}
```

#### `src/processors/ProcessorPipeline.ts`
```typescript
import { ProcessorRegistry } from './ProcessorRegistry';

export class ProcessorPipeline {
  private processors: Map<string, BaseProcessor> = new Map();
  private processorOrder: string[] = [];
  private registry: ProcessorRegistry = new ProcessorRegistry();

  constructor(
    private styleManager: StyleManager,
    private sceneGraph: SceneGraph
  ) {
    // Register built-in processors
    this.registerBuiltInProcessors();
  }

  private registerBuiltInProcessors() {
    this.registry.register('style-by-property', StyleByPropertyProcessor);
    this.registry.register('style-by-neighbors', StyleByNeighborsProcessor);
    this.registry.register('zoom-visibility', ZoomBasedVisibilityProcessor);
    this.registry.register('conditional-style', ConditionalStyleProcessor);
    this.registry.register('interaction-filter', InteractionFilterProcessor);
  }

  // Create processor from configuration
  createFromConfig(config: ProcessorConfig): BaseProcessor | null {
    const ProcessorClass = this.registry.get(config.type);
    if (!ProcessorClass) {
      console.warn(`Unknown processor type: ${config.type}`);
      return null;
    }
    
    return new ProcessorClass(config.options);
  }

  // Add processor programmatically (low-level API)
  add(processor: BaseProcessor, priority: number = 50) {
    processor.setPriority(priority);
    this.processors.set(processor.name, processor);
    this.processorOrder.push(processor.name);
    this.sortProcessors();
  }

  // Remove processor
  remove(nameOrInstance: string | BaseProcessor) {
    const name = typeof nameOrInstance === 'string' 
      ? nameOrInstance 
      : nameOrInstance.name;
    
    this.processors.delete(name);
    this.processorOrder = this.processorOrder.filter(n => n !== name);
  }

  // Update processor configuration dynamically
  updateConfig(type: string, options: Record<string, any>) {
    const processor = this.processors.get(type);
    if (processor && 'updateOptions' in processor) {
      (processor as any).updateOptions(options);
    }
  }

  // Enable processor
  enable(type: string) {
    const processor = this.processors.get(type);
    if (processor) {
      processor.enabled = true;
    }
  }

  // Disable processor
  disable(type: string) {
    const processor = this.processors.get(type);
    if (processor) {
      processor.enabled = false;
    }
  }

  // Get processor instance
  get(type: string): BaseProcessor | undefined {
    return this.processors.get(type);
  }

  // Get all processor configurations (for UI)
  getConfigs(): ProcessorConfigInfo[] {
    return Array.from(this.processors.entries()).map(([name, processor]) => ({
      type: name,
      enabled: processor.enabled,
      priority: processor.priority,
      options: processor.getOptions ? processor.getOptions() : {},
      schema: processor.getOptionsSchema ? processor.getOptionsSchema() : null,
    }));
  }

  // Execute all processors for a given event
  async execute(event: string, context?: ProcessorContext) {
    const applicableProcessors = this.processorOrder
      .map(name => this.processors.get(name)!)
      .filter(p => p.enabled && p.shouldProcess(event, context));

    for (const processor of applicableProcessors) {
      await processor.process(event, context, {
        styleManager: this.styleManager,
        sceneGraph: this.sceneGraph,
      });
    }
  }

  private sortProcessors() {
    this.processorOrder.sort((a, b) => {
      const procA = this.processors.get(a)!;
      const procB = this.processors.get(b)!;
      return procB.priority - procA.priority;
    });
  }

  // Register custom processor type (for extensions)
  registerType(type: string, ProcessorClass: typeof BaseProcessor) {
    this.registry.register(type, ProcessorClass);
  }
}
```

#### `src/processors/BaseProcessor.ts`
```typescript
export abstract class BaseProcessor {
  public priority: number = 50;
  public enabled: boolean = true;

  abstract name: string;
  abstract process(
    event: string,
    context: ProcessorContext,
    services: ProcessorServices
  ): void | Promise<void>;

  // Override to control when processor runs
  shouldProcess(event: string, context?: ProcessorContext): boolean {
    return true;
  }

  setPriority(priority: number) {
    this.priority = priority;
  }

  // Override to support dynamic configuration updates
#### `src/processors/StyleByPropertyProcessor.ts`
```typescript
export class StyleByPropertyProcessor extends BaseProcessor {
  name = 'style-by-property';

  constructor(private options: {
    property: string;
    colorMap?: Record<string, number>;
    sizeMap?: Record<string, number>;
  }) {
    super();
  }

  shouldProcess(event: string): boolean {
    return ['init', 'node-added', 'data-updated'].includes(event);
  }

  process(event: string, context: ProcessorContext, services: ProcessorServices) {
    const { sceneGraph, styleManager } = services;
    const nodes = sceneGraph.query({ type: 'node' });

    nodes.forEach(node => {
      const value = node.data[this.options.property];
      
      if (this.options.colorMap && value in this.options.colorMap) {
        styleManager.update(node.id, {
          fill: this.options.colorMap[value]
        });
      }

      if (this.options.sizeMap && value in this.options.sizeMap) {
        styleManager.update(node.id, {
          size: this.options.sizeMap[value]
        });
      }
    });
  }

  // Support dynamic configuration
  updateOptions(options: Record<string, any>) {
    this.options = { ...this.options, ...options };
  }

  getOptions() {
    return { ...this.options };
  }

  getOptionsSchema(): ProcessorOptionsSchema {
    return {
      type: 'object',
      properties: {
        property: {
          type: 'string',
          title: 'Property Name',
          description: 'Node property to map colors/sizes from',
        },
        colorMap: {
          type: 'object',
          title: 'Color Mapping',
          description: 'Map property values to colors',
          additionalProperties: { type: 'number' },
        },
        sizeMap: {
          type: 'object',
          title: 'Size Mapping',
          description: 'Map property values to sizes',
          additionalProperties: { type: 'number' },
        },
      },
      required: ['property'],
    };
  }
}
#### `src/processors/StyleByNeighborsProcessor.ts`
```typescript
export class StyleByNeighborsProcessor extends BaseProcessor {
  name = 'style-by-neighbors';

  constructor(private options: {
    sizeScale?: (degree: number) => number;
    colorScale?: (degree: number) => number;
    maxSize?: number;
  }) {
    super();
  }

  shouldProcess(event: string): boolean {
    return ['init', 'edge-added', 'edge-removed'].includes(event);
  }

  process(event: string, context: ProcessorContext, services: ProcessorServices) {
    const { sceneGraph, styleManager } = services;
    const nodes = sceneGraph.query({ type: 'node' });

    nodes.forEach(node => {
      const edges = sceneGraph.getConnectedEdges(node.id);
      const degree = edges.length;

      if (this.options.sizeScale) {
        let size = this.options.sizeScale(degree);
        if (this.options.maxSize) {
          size = Math.min(size, this.options.maxSize);
        }
        styleManager.update(node.id, { size });
      }

      if (this.options.colorScale) {
        const color = this.options.colorScale(degree);
        styleManager.update(node.id, { fill: color });
      }
    });
  }

  updateOptions(options: Record<string, any>) {
    this.options = { ...this.options, ...options };
  }

  getOptions() {
    return {
      // Serialize functions as strings for UI
      sizeScale: this.options.sizeScale?.toString(),
      colorScale: this.options.colorScale?.toString(),
      maxSize: this.options.maxSize,
    };
  }

  getOptionsSchema(): ProcessorOptionsSchema {
    return {
      type: 'object',
      properties: {
        sizeScale: {
          type: 'string',
          title: 'Size Scale Function',
          description: 'Function to calculate size from degree: (degree) => size',
          default: '(degree) => 30 + degree * 5',
        },
        maxSize: {
          type: 'number',
          title: 'Maximum Size',
          description: 'Maximum node size',
          default: 100,
        },
        colorScale: {
          type: 'string',
          title: 'Color Scale Function',
          description: 'Function to calculate color from degree: (degree) => color',
        },
      },
    };
  }
}
```onstructor(private options: {
    sizeScale?: (degree: number) => number;
    colorScale?: (degree: number) => number;
    maxSize?: number;
  }) {
    super();
  }

  shouldProcess(event: string): boolean {
    return ['init', 'edge-added', 'edge-removed'].includes(event);
  }

  process(event: string, context: ProcessorContext, services: ProcessorServices) {
    const { sceneGraph, styleManager } = services;
    const nodes = sceneGraph.query({ type: 'node' });

    nodes.forEach(node => {
      const edges = sceneGraph.getConnectedEdges(node.id);
      const degree = edges.length;

      if (this.options.sizeScale) {
        let size = this.options.sizeScale(degree);
        if (this.options.maxSize) {
          size = Math.min(size, this.options.maxSize);
        }
        styleManager.update(node.id, { size });
      }

      if (this.options.colorScale) {
        const color = this.options.colorScale(degree);
        styleManager.update(node.id, { fill: color });
      }
    });
  }
}
```

#### `src/processors/ZoomBasedVisibilityProcessor.ts`
```typescript
export class ZoomBasedVisibilityProcessor extends BaseProcessor {
  name = 'zoom-based-visibility';

  constructor(private options: {
    showLabelsAbove?: number;
    showDetailsAbove?: number;
    hideEdgesBelow?: number;
  }) {
    super();
  }

  shouldProcess(event: string): boolean {
    return ['zoom', 'init'].includes(event);
  }

  process(event: string, context: ProcessorContext, services: ProcessorServices) {
    const { sceneGraph, styleManager } = services;
    const currentZoom = context.zoom || 1.0;

    // Handle label visibility
    if (this.options.showLabelsAbove) {
      const labels = sceneGraph.query({ type: 'label' });
      labels.forEach(label => {
        const visible = currentZoom >= this.options.showLabelsAbove!;
        styleManager.update(label.id, { visible });
      });
    }

    // Handle edge visibility
    if (this.options.hideEdgesBelow) {
      const edges = sceneGraph.query({ type: 'edge' });
      edges.forEach(edge => {
        const visible = currentZoom >= this.options.hideEdgesBelow!;
        styleManager.update(edge.id, { visible });
      });
    }

    // Handle node detail level
    if (this.options.showDetailsAbove) {
      const nodes = sceneGraph.query({ type: 'node' });
      nodes.forEach(node => {
        const showDetails = currentZoom >= this.options.showDetailsAbove!;
        styleManager.update(node.id, {
          showBadges: showDetails,
          showSecondaryLabel: showDetails
        });
      });
    }
  }
}
```

---

## Package 2: `@canvas/layout` (Extension - Moved from Core)

### File Structure
```
packages/canvas-layout/
├── package.json              # Peer dependency: @canvas/core
├── tsconfig.json
├── README.md
└── src/
    ├── index.ts              # Main export
    ├── LayoutEngine.ts       # Layout coordinator
    ├── BaseLayout.ts         # Abstract layout base
    │
    ├── layout-d3/            # D3 force-directed layouts
    │   ├── ForceLayout.ts
    │   ├── ForceAtlas2.ts
    │   ├── package.json      # Can be separate sub-package
    │   └── index.ts
    │
    ├── layout-elk/           # Eclipse Layout Kernel
    │   ├── ELKLayout.ts
    │   ├── LayeredLayout.ts
    │   ├── package.json      # Can be separate sub-package
    │   └── index.ts
    │
    ├── layout-dagre/         # Dagre layouts
    │   ├── DagreLayout.ts
    │   ├── package.json      # Can be separate sub-package
    │   └── index.ts
    │
    └── layout-custom/        # Custom layouts
        ├── CircularLayout.ts
        ├── GridLayout.ts
        ├── TreeLayout.ts
        └── index.ts
```

### Key Files

#### `src/index.ts`
```typescript
// Main exports
export { LayoutEngine } from './LayoutEngine';
export { BaseLayout } from './BaseLayout';

// Re-export all layouts
export * from './layout-d3';
export * from './layout-elk';
export * from './layout-dagre';
export * from './layout-custom';
```

#### `src/BaseLayout.ts`
```typescript
import type { Canvas } from '@canvas/core';

export abstract class BaseLayout {
  constructor(protected options: LayoutOptions) {}

  abstract name: string;
  
  // Apply layout to canvas
  abstract apply(canvas: Canvas): Promise<void>;
  
  // Stop layout (for continuous layouts like force)
  stop?(): void;
  
  // Update layout parameters
  updateOptions(options: Partial<LayoutOptions>): void {
    this.options = { ...this.options, ...options };
  }
}
```

#### `src/layout-d3/ForceLayout.ts`
```typescript
import { BaseLayout } from '../BaseLayout';
import type { Canvas } from '@canvas/core';
import * as d3 from 'd3-force';

export class ForceLayout extends BaseLayout {
  name = 'force-directed';
  private simulation: d3.Simulation | null = null;

  constructor(options: {
    strength?: number;
    distance?: number;
    iterations?: number;
    center?: { x: number; y: number };
  }) {
    super(options);
  }

  async apply(canvas: Canvas): Promise<void> {
    const nodes = canvas.scene.query({ type: 'node' });
    const edges = canvas.scene.query({ type: 'edge' });

    this.simulation = d3.forceSimulation(nodes)
      .force('charge', d3.forceManyBody().strength(this.options.strength))
      .force('link', d3.forceLink(edges).distance(this.options.distance))
      .force('center', d3.forceCenter(this.options.center.x, this.options.center.y));

    // Run simulation
    for (let i = 0; i < this.options.iterations; i++) {
      this.simulation.tick();
    }

    // Update node positions in canvas
    nodes.forEach(node => {
      canvas.updateNodePosition(node.id, { x: node.x, y: node.y });
    });
  }

  stop() {
    if (this.simulation) {
      this.simulation.stop();
    }
  }
}
```

#### `package.json`
```json
{
  "name": "@canvas/layout",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "peerDependencies": {
    "@canvas/core": "workspace:*"
  },
  "dependencies": {
    "d3-force": "^3.0.0",
    "elkjs": "^0.9.0",
    "dagre": "^0.8.5"
  },
  "optionalDependencies": {
    "d3-force": "^3.0.0",
    "elkjs": "^0.9.0",
    "dagre": "^0.8.5"
  }
}
```

---

## Package 3: `@canvas/groups` (Extension)

### File Structure
```
packages/canvas-groups/
├── package.json              # Peer dependency: @canvas/core
├── tsconfig.json
├── tsup.config.ts
└── src/
    ├── index.ts              # Main export
    ├── GroupBase.ts          # Abstract group base
    ├── RectGroup.ts          # Rectangular group
    ├── ConvexHullGroup.ts    # Auto-fitting group
    ├── CollapsibleGroup.ts   # Expandable/collapsible
    ├── GroupManager.ts       # Group lifecycle
    ├── types.ts              # Group types
    └── utils/
        ├── bounds.ts         # Bounding box calculations
        └── convexHull.ts     # Convex hull algorithm
```

### Key Files

#### `src/index.ts`
```typescript
export { GroupBase } from './GroupBase';
export { RectGroup } from './RectGroup';
export { ConvexHullGroup } from './ConvexHullGroup';
export { CollapsibleGroup } from './CollapsibleGroup';
export { GroupManager } from './GroupManager';
export type * from './types';
```

#### `src/GroupBase.ts`
```typescript
import { Container, Graphics } from 'pixi.js';
import type { BaseElement } from '@canvas/core';

export abstract class GroupBase extends Container {
  protected children: BaseElement[] = [];
  protected background: Graphics = new Graphics();

  constructor(public id: string, protected options: GroupOptions) {
    super();
  }

  abstract updateBounds(): void;
  abstract expand(): void;
  abstract collapse(): void;

  addChild(element: BaseElement) {
    this.children.push(element);
    this.updateBounds();
  }

  removeChild(elementId: string) {
    this.children = this.children.filter(e => e.id !== elementId);
    this.updateBounds();
  }
}
```

#### `package.json`
```json
{
  "name": "@canvas/groups",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "peerDependencies": {
    "@canvas/core": "workspace:*",
    "pixi.js": "^8.14.3"
  }
}
```

---

## Package 3: `@canvas/annotations` (Extension)

### File Structure
```
packages/canvas-annotations/
├── package.json              # Peer dependency: @canvas/core
├── tsconfig.json
├── tsup.config.ts
└── src/
    ├── index.ts              # Main export
    ├── AnnotationBase.ts     # Abstract annotation base
    ├── TextAnnotation.ts     # Rich text annotation
    ├── ShapeAnnotation.ts    # Freeform shapes
    ├── Callout.ts            # Leader line + text
    ├── Highlighter.ts        # Region highlighter
    ├── ArrowAnnotation.ts    # Directional arrows
    ├── AnnotationManager.ts  # Annotation lifecycle
    ├── types.ts              # Annotation types
    └── utils/
        ├── textFormat.ts     # Text formatting
        └── leader.ts         # Leader line calculations
```

### Key Files

#### `src/index.ts`
```typescript
export { AnnotationBase } from './AnnotationBase';
export { TextAnnotation } from './TextAnnotation';
## Usage Examples

### 1. Declarative Configuration (High-Level - For UI Settings)
```typescript
import { Canvas } from '@canvas/core';

const canvas = new Canvas({
  container: document.getElementById('app'),
  width: 800,
  height: 600,
  
  // Configure processors declaratively
  processors: [
    {
      type: 'style-by-property',
      enabled: true,
      priority: 100,
      options: {
        property: 'type',
        colorMap: {
          user: 0xFF0000,
          system: 0x0000FF,
          service: 0x00FF00,
        }
      }
    },
    {
      type: 'style-by-neighbors',
      enabled: true,
      priority: 90,
      options: {
        sizeScale: '(degree) => 30 + degree * 5',  // String for serialization
        maxSize: 100,
      }
    },
    {
      type: 'zoom-visibility',
      enabled: true,
      priority: 80,
      options: {
        showLabelsAbove: 0.5,
        showDetailsAbove: 1.5,
        hideEdgesBelow: 0.3,
      }
    }
  ],
  
  // Theme configuration
  theme: 'dark',
  
  // Style defaults
  styles: {
    node: {
      fill: 0x3B82F6,
      stroke: 0x1E40AF,
      strokeWidth: 2,
    },
    edge: {
      stroke: 0x64748B,
      strokeWidth: 1,
    }
  }
});

await canvas.init();

// Update processor config dynamically (for UI controls)
canvas.updateProcessorConfig('style-by-neighbors', {
  maxSize: 150,  // User changed slider
});

// Toggle processor on/off (for UI checkbox)
canvas.toggleProcessor('zoom-visibility', false);

// Get all processor configs (to build UI)
const processorConfigs = canvas.processors.getConfigs();
/*
[
  {
    type: 'style-by-property',
    enabled: true,
    priority: 100,
    options: { property: 'type', colorMap: {...} },
    schema: { type: 'object', properties: {...} }
  },
  ...
]
*/
```

### 2. Programmatic API (Low-Level - For Advanced Control)
```typescript
import { Canvas, StyleByPropertyProcessor, StyleByNeighborsProcessor } from '@canvas/core';

const canvas = new Canvas({ ... });
await canvas.init();

// Add processors programmatically
canvas.processors.add(new StyleByPropertyProcessor({
  property: 'type',
  colorMap: {
    user: 0xFF0000,
    system: 0x0000FF,
    service: 0x00FF00,
  }
}), 100);  // priority

canvas.processors.add(new StyleByNeighborsProcessor({
  sizeScale: (degree) => 30 + degree * 5,  // Actual function
  maxSize: 100
}), 90);

// Remove processor
const neighborProcessor = canvas.processors.get('style-by-neighbors');
canvas.processors.remove(neighborProcessor);
```

### 3. Hybrid Approach (Config + Runtime Additions)
```typescript
const canvas = new Canvas({
  // Base configuration from user settings
  processors: [
    {
      type: 'style-by-property',
      enabled: true,
      options: loadFromUserSettings('style-by-property')
    }
  ]
});

await canvas.init();

// Add custom processor at runtime
class CustomHighlightProcessor extends BaseProcessor {
  name = 'custom-highlight';
  // ... implementation
}

canvas.processors.add(new CustomHighlightProcessor(), 50);
```

### 4. Building UI Controls from Processor Schema
```typescript
const canvas = new Canvas({ ... });
await canvas.init();

// Get processor configurations for UI
const configs = canvas.processors.getConfigs();

configs.forEach(config => {
  // Use schema to generate UI controls
  const schema = config.schema;
  
  // Example: Generate form inputs
  Object.entries(schema.properties).forEach(([key, prop]) => {
    if (prop.type === 'number') {
      // Create slider/number input
      createNumberInput({
        label: prop.title,
        value: config.options[key],
        onChange: (value) => {
          canvas.updateProcessorConfig(config.type, {
            [key]: value
          });
        }
      });
    } else if (prop.type === 'object') {
      // Create key-value editor
      createObjectEditor({
        label: prop.title,
        value: config.options[key],
        onChange: (value) => {
          canvas.updateProcessorConfig(config.type, {
            [key]: value
          });
        }
      });
    }
  });
});
```

### 5. Saving/Loading Processor Configurations
```typescript
// Save configuration
const canvasConfig = {
  processors: canvas.processors.getConfigs().map(c => ({
    type: c.type,
    enabled: c.enabled,
    priority: c.priority,
    options: c.options,
  })),
  theme: 'dark',
  // ... other settings
};

localStorage.setItem('canvas-config', JSON.stringify(canvasConfig));

// Load configuration
const savedConfig = JSON.parse(localStorage.getItem('canvas-config'));
const canvas = new Canvas(savedConfig);
```

### 6. React Settings Panel Example
```typescript
import { Canvas } from '@canvas/core';
import { useState, useEffect } from 'react';

function ProcessorSettings({ canvas }) {
  const [configs, setConfigs] = useState([]);

  useEffect(() => {
    setConfigs(canvas.processors.getConfigs());
  }, [canvas]);

  const handleToggle = (type, enabled) => {
    canvas.toggleProcessor(type, enabled);
    setConfigs(canvas.processors.getConfigs());
  };

  const handleUpdate = (type, key, value) => {
    canvas.updateProcessorConfig(type, { [key]: value });
    setConfigs(canvas.processors.getConfigs());
  };

  return (
    <div className="settings-panel">
      <h3>Processors</h3>
      {configs.map(config => (
        <div key={config.type} className="processor-config">
          <label>
            <input 
              type="checkbox" 
              checked={config.enabled}
              onChange={(e) => handleToggle(config.type, e.target.checked)}
            />
            {config.type}
          </label>
          
          {config.enabled && (
            <div className="processor-options">
              {Object.entries(config.schema.properties).map(([key, prop]) => (
                <div key={key}>
                  <label>{prop.title}</label>
                  {prop.type === 'number' ? (
                    <input 
                      type="number" 
                      value={config.options[key]}
                      onChange={(e) => handleUpdate(config.type, key, +e.target.value)}
                    />
                  ) : prop.type === 'string' ? (
                    <input 
                      type="text" 
                      value={config.options[key]}
                      onChange={(e) => handleUpdate(config.type, key, e.target.value)}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## Basic Usage (Core Only)from './ArrowAnnotation';
export { AnnotationManager } from './AnnotationManager';
export type * from './types';
```

#### `src/Callout.ts`
```typescript
import { Container, Graphics, Text } from 'pixi.js';
import { AnnotationBase } from './AnnotationBase';

export class Callout extends AnnotationBase {
  private leaderLine: Graphics;
  private textBox: Text;

  constructor(options: CalloutOptions) {
    super(options);
    this.createLeaderLine();
    this.createTextBox();
  }

  private createLeaderLine() {
    // Draw line from target to text
  }

  private createTextBox() {
    // Create text with background
  }

  updatePosition(x: number, y: number) {
    // Update callout position and redraw leader
  }
}
```

---

## Usage Examples

### Basic Usage (Core Only)
```typescript
import { Canvas } from '@canvas/core';

const canvas = new Canvas({
  container: document.getElementById('app'),
  width: 800,
  height: 600,
});

await canvas.init();

// Add nodes and edges
canvas.addNode({ id: 'n1', x: 100, y: 100, shape: 'circle' });
canvas.addNode({ id: 'n2', x: 300, y: 200, shape: 'rect' });
canvas.addEdge({ id: 'e1', source: 'n1', target: 'n2', pathType: 'bezier' });

// Dynamic styling
canvas.style.update('n1', { fill: 0xFF0000, size: 50 });
canvas.style.updateMany(['n1', 'n2'], { stroke: 0x0000FF, strokeWidth: 3 });

// Query scene
const selectedNodes = canvas.query({ type: 'node', selected: true });
```

### With Style Processors
```typescript
import { Canvas, StyleByPropertyProcessor, StyleByNeighborsProcessor } from '@canvas/core';

const canvas = new Canvas({ ... });
await canvas.init();

// Color nodes by type
canvas.processors.add(new StyleByPropertyProcessor({
  property: 'type',
  colorMap: {
    user: 0xFF0000,    // Red for users
    system: 0x0000FF,  // Blue for systems
    service: 0x00FF00, // Green for services
  }
}));

// Size nodes by number of connections
canvas.processors.add(new StyleByNeighborsProcessor({
  sizeScale: (degree) => 30 + degree * 5,
  maxSize: 100
}));

// Add data - processors automatically apply
canvas.addNode({ id: 'n1', type: 'user', x: 100, y: 100 });
canvas.addNode({ id: 'n2', type: 'system', x: 200, y: 100 });
```

### With Zoom-Based Visibility
```typescript
import { Canvas, ZoomBasedVisibilityProcessor } from '@canvas/core';

const canvas = new Canvas({ ... });
await canvas.init();

// Control visibility based on zoom level
canvas.processors.add(new ZoomBasedVisibilityProcessor({
  showLabelsAbove: 0.5,      // Show labels when zoom > 0.5
  showDetailsAbove: 1.5,     // Show node badges/secondary labels when zoom > 1.5
  hideEdgesBelow: 0.3,       // Hide edges when zoom < 0.3 (performance)
}));

// Labels and details automatically show/hide on zoom
canvas.viewport.on('zoomed', (zoom) => {
  canvas.processors.execute('zoom', { zoom });
});
```

### With Custom Processor
```typescript
import { Canvas, BaseProcessor } from '@canvas/core';

// Create custom processor
class HighScoreProcessor extends BaseProcessor {
  name = 'high-score-highlighter';

  shouldProcess(event: string): boolean {
    return ['init', 'node-added', 'data-updated'].includes(event);
  }

  process(event, context, { sceneGraph, styleManager }) {
    const nodes = sceneGraph.query({ type: 'node' });
    
    nodes.forEach(node => {
      if (node.data.score > 0.8) {
        // Highlight high-score nodes
        styleManager.update(node.id, {
          glow: true,
          glowColor: 0xFFD700,
          strokeWidth: 4,
        });
      }
    });
  }
}

const canvas = new Canvas({ ... });
await canvas.init();

// Add custom processor
canvas.processors.add(new HighScoreProcessor(), 100); // priority 100
```

### With Layouts
```typescript
import { Canvas } from '@canvas/core';
import { ForceLayout } from '@canvas/layout/layout-d3';
import { ELKLayout } from '@canvas/layout/layout-elk';

const canvas = new Canvas({ ... });
await canvas.init();

// Add nodes/edges
canvas.render(graphData);

// Apply force-directed layout
const forceLayout = new ForceLayout({
  strength: -500,
  distance: 100,
  iterations: 300,
});
await forceLayout.apply(canvas);

// Or switch to hierarchical layout
const elkLayout = new ELKLayout({
  direction: 'DOWN',
  spacing: 80,
});
await elkLayout.apply(canvas);
```

### With Groups
```typescript
import { Canvas } from '@canvas/core';
import { RectGroup } from '@canvas/groups';

const canvas = new Canvas({ ... });
await canvas.init();

// Create nodes
canvas.addNode({ id: 'n1', x: 100, y: 100 });
canvas.addNode({ id: 'n2', x: 150, y: 150 });

// Create group
const group = new RectGroup({
  id: 'group-1',
  label: 'Module A',
  children: ['n1', 'n2'],
});
canvas.addGroup(group);
```

### With Annotations
```typescript
import { Canvas } from '@canvas/core';
import { Callout, Highlighter } from '@canvas/annotations';

const canvas = new Canvas({ ... });
await canvas.init();

// Add callout
const callout = new Callout({
  id: 'callout-1',
  target: 'n1',
  text: 'This is important!',
  position: { x: 200, y: 100 },
});
canvas.addAnnotation(callout);

// Highlight region
const highlight = new Highlighter({
  id: 'highlight-1',
  region: { x: 50, y: 50, width: 200, height: 150 },
  color: 0xFFFF00,
  alpha: 0.3,
});
canvas.addAnnotation(highlight);
```

---

## Migration Path

### Current Structure → New Structure Mapping

| **Current Location** | **New Location** | **Action** |
|---------------------|------------------|------------|
| `src/canvas/Canvas.ts` | `src/core/Canvas.ts` | MOVE + EXTEND |
| `src/canvas/Viewport.ts` | `src/viewport/Viewport.ts` | MOVE (as-is) |
| `src/canvas/Registry.ts` | `src/rendering/Registry.ts` | MOVE (as-is) |
| `src/canvas/Renderer.ts` | `src/rendering/Renderer.ts` | MOVE + EXTEND |
| `src/primitives/` | `src/primitives/` | **KEEP (no changes)** |
| `src/primitives/shapes/` | `src/primitives/shapes/` | **KEEP (no changes)** |
| `src/primitives/paths/` | `src/primitives/paths/` | **KEEP (no changes)** |
| `src/primitives/arrows/` | `src/primitives/arrows/` | **KEEP (no changes)** |
| `src/primitives/labels/` | `src/primitives/labels/` | **KEEP (no changes)** |
| `src/primitives/effects/` | `src/primitives/effects/` | **KEEP (no changes)** |
| `src/ui-shapes/BaseShape.ts` | `src/elements/BaseShape.ts` | RENAME folder only |
| `src/ui-shapes/nodes/NodeShapeBase.ts` | `src/elements/nodes/NodeShapeBase.ts` | RENAME folder only |
| `src/ui-shapes/nodes/CircleNode.ts` | `src/elements/nodes/CircleNode.ts` | RENAME folder only |
| `src/ui-shapes/nodes/EllipseNode.ts` | `src/elements/nodes/EllipseNode.ts` | RENAME folder only |
| `src/ui-shapes/nodes/RectNode.ts` | `src/elements/nodes/RectNode.ts` | RENAME folder only |
| `src/ui-shapes/nodes/RoundedRectNode.ts` | `src/elements/nodes/RoundedRectNode.ts` | RENAME folder only |
| `src/ui-shapes/nodes/PolygonNode.ts` | `src/elements/nodes/PolygonNode.ts` | RENAME folder only |
| `src/ui-shapes/nodes/createNode.ts` | `src/elements/nodes/createNode.ts` | RENAME folder only |
| `src/ui-shapes/edges/EdgeShapeBase.ts` | `src/elements/edges/EdgeShapeBase.ts` | RENAME folder only |
| `src/ui-shapes/edges/LineEdge.ts` | `src/elements/edges/LineEdge.ts` | RENAME folder only |
| `src/ui-shapes/edges/BezierEdge.ts` | `src/elements/edges/BezierEdge.ts` | RENAME folder only |
| `src/ui-shapes/edges/OrthogonalEdge.ts` | `src/elements/edges/OrthogonalEdge.ts` | RENAME folder only |
| `src/ui-shapes/edges/createEdge.ts` | `src/elements/edges/createEdge.ts` | RENAME folder only |
| (new) | `src/layers/LayerManager.ts` | CREATE NEW |
| (new) | `src/scene/SceneGraph.ts` | CREATE NEW |
| (new) | `src/interaction/InteractionManager.ts` | CREATE NEW |
| (new) | `src/style/StyleManager.ts` | CREATE NEW |
| (new) | `src/processors/ProcessorPipeline.ts` | CREATE NEW |

### Summary of Changes

#### ✅ PRESERVED (No Code Changes)
- **All primitives/** - 100% preserved
  - `shapes/circle.ts`, `ellipse.ts`, `rect.ts`, `roundedRect.ts`, `polygon.ts`
  - `paths/line.ts`, `bezier.ts`, `orthogonal.ts`
  - `arrows/triangle.ts`, `circle.ts`, `diamond.ts`, `square.ts`
  - `labels/label.ts`
  - `effects/ripple.ts`, `glow.ts`
  
- **All ui-shapes code** - 100% preserved (just rename folder to `elements/`)
  - `BaseShape.ts` - Abstract base class
  - `nodes/NodeShapeBase.ts` - Node base with drag, selection, hover, ripple
  - `nodes/CircleNode.ts`, `EllipseNode.ts`, `RectNode.ts`, `RoundedRectNode.ts`, `PolygonNode.ts`
  - `nodes/createNode.ts` - Factory function
  - `edges/EdgeShapeBase.ts` - Edge base with arrows, tangents
  - `edges/LineEdge.ts`, `BezierEdge.ts`, `OrthogonalEdge.ts`
  - `edges/createEdge.ts` - Factory function

- **Registry.ts** - All shape/path/arrow registrations preserved
- **Renderer.ts** - All addNode/addEdge/update logic preserved

#### 🔄 EXTENDED (Existing Code + New Features)
- **Canvas.ts** - Add: StyleManager, ProcessorPipeline, declarative config
- **Renderer.ts** - Add: StyleManager integration for style updates

#### 🆕 NEW MODULES
- `layers/LayerManager.ts` - Dynamic layer creation
- `scene/SceneGraph.ts` - Element tracking, queries, relationships
- `interaction/InteractionManager.ts` - Centralized interaction handling
- `style/StyleManager.ts` - Dynamic style management
- `processors/ProcessorPipeline.ts` - Extensible behavior customization

---

## Benefits of This Structure

✅ **Clear Module Boundaries**: Each directory has a single responsibility  
✅ **Extensible**: Add new element types without touching core  
✅ **Tree-Shakeable**: Core is ~100KB, groups/annotations are opt-in  
✅ **Type-Safe**: Strong TypeScript interfaces throughout  
✅ **Testable**: Each module can be unit tested independently  
✅ **Maintainable**: Easy to find and modify code  
✅ **Scalable**: Can grow to support new features (minimap, timeline, etc.)

---

## Next Steps

### Phase 1: Folder Restructure (No Code Changes)
1. Rename `ui-shapes/` → `elements/` 
2. Move `canvas/Canvas.ts` → `core/Canvas.ts`
3. Move `canvas/Viewport.ts` → `viewport/Viewport.ts`
4. Move `canvas/Registry.ts` → `rendering/Registry.ts`
5. Move `canvas/Renderer.ts` → `rendering/Renderer.ts`
6. Update all imports
7. **primitives/ stays exactly where it is**

### Phase 2: Layer Abstraction
1. Create `layers/LayerManager.ts`
2. Create `layers/Layer.ts`
3. Extract layer creation from Canvas to LayerManager

### Phase 3: Style System
1. Create `style/StyleManager.ts`
2. Create `style/StyleResolver.ts`
3. Create `style/ThemeManager.ts`
4. Integrate with Renderer

### Phase 4: Processor Pipeline
1. Create `processors/ProcessorPipeline.ts`
2. Create `processors/ProcessorRegistry.ts`
3. Create `processors/BaseProcessor.ts`
4. Create built-in processors
5. Add declarative config to Canvas

### Phase 5: Scene Graph
1. Create `scene/SceneGraph.ts`
2. Create `scene/QueryEngine.ts`
3. Create `scene/Relationships.ts`
4. Integrate with Canvas and Renderer

### Phase 6: Interaction Refactor
1. Create `interaction/InteractionManager.ts`
2. Create `interaction/SelectionManager.ts`
3. Create `interaction/DragManager.ts`
4. **Keep existing interaction code in NodeShapeBase** (optional extraction later)

### Phase 7: Extension Packages
1. Create `@canvas/layout` package
2. Create `@canvas/groups` package
3. Create `@canvas/annotations` package

Let me know which phase you'd like to start with!
