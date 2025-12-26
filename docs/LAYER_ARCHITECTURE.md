# Plugin-Based Layer Architecture

## Executive Summary

**You're absolutely right!** PixiJS Container children automatically inherit parent transforms (position, scale, rotation). We don't need manual position syncing - labels added to a separate layer just need to track their parent node via a reference, not manual position updates.

This document outlines a **plugin-based layer system** where:
1. Core provides node/edge shape + label layers
2. Plugins can register their own layer groups
3. High-performance by default with automatic transform inheritance

---

## Key Insight: PixiJS Transform Inheritance

### How PixiJS Containers Work
```typescript
// Parent-child relationship in PixiJS
const parent = new Container();
parent.x = 100;
parent.y = 200;

const child = new Graphics();
child.x = 10; // Relative to parent
child.y = 20;

parent.addChild(child);
// Child renders at (110, 220) in world space automatically!
```

### For Separate Layers
```typescript
// Node in node layer
nodeLayer.addChild(node);
node.x = 100;
node.y = 200;

// Label in label layer (NOT child of node)
labelLayer.addChild(label);
label.x = 100; // Same as node
label.y = 200;

// When node moves:
node.x = 300;
label.x = 300; // Must update (but still NO transform calculation!)

// PixiJS handles:
// - Camera zoom/pan automatically (both are children of viewport)
// - No need to calculate screen coords
// - Just copy x/y values
```

**Key Point**: Separate layers still share the same viewport parent, so camera transforms are automatic. We only sync `x, y` values, not full transform math!

---

## Architecture Overview

```
Canvas (root)
└── Viewport (camera, handles pan/zoom)
    └── Scene Container (sortableChildren: true)
        ├── LayerGroup: "core-edges" (zIndex: 100)
        │   ├── Layer: "edge-shapes" (zIndex: 100)
        │   └── Layer: "edge-labels" (zIndex: 101)
        ├── LayerGroup: "core-nodes" (zIndex: 200)
        │   ├── Layer: "node-shapes" (zIndex: 200)
        │   └── Layer: "node-labels" (zIndex: 201)
        ├── LayerGroup: "plugin-groups" (zIndex: 300)
        │   ├── Layer: "group-shapes" (zIndex: 300)
        │   └── Layer: "group-labels" (zIndex: 301)
        └── LayerGroup: "plugin-annotations" (zIndex: 400)
            ├── Layer: "annotation-shapes" (zIndex: 400)
            └── Layer: "annotation-labels" (zIndex: 401)
```

### Z-Index Strategy
- **Core edges**: 100-199
- **Core nodes**: 200-299
- **Plugin layers**: 300+ (allocated in blocks of 100)
- Labels always +1 from their shape layer (auto-render on top)

---

## Core API

### 1. LayerManager (Core)

```typescript
/**
 * Manages all layers in the canvas
 * Plugins can register layer groups
 */
export class LayerManager {
  private _scene: Container;
  private _groups: Map<string, LayerGroup> = new Map();
  private _nextZIndex: number = 300; // Start for plugins

  constructor(scene: Container) {
    this._scene = scene;
    this._scene.sortableChildren = true;
    
    // Register core layers
    this.registerGroup('core-edges', {
      baseZIndex: 100,
      layers: ['shapes', 'labels']
    });
    
    this.registerGroup('core-nodes', {
      baseZIndex: 200,
      layers: ['shapes', 'labels']
    });
  }

  /**
   * Register a new layer group (used by plugins)
   * @returns LayerGroup instance for plugin use
   */
  registerGroup(groupId: string, config: LayerGroupConfig): LayerGroup {
    const baseZIndex = config.baseZIndex ?? this.allocateZIndex();
    const group = new LayerGroup(groupId, baseZIndex);
    
    // Create layers
    config.layers.forEach((layerName, index) => {
      const layer = group.createLayer(layerName, baseZIndex + index);
      this._scene.addChild(layer.container);
    });
    
    this._groups.set(groupId, group);
    return group;
  }

  /**
   * Get a layer group by ID
   */
  getGroup(groupId: string): LayerGroup | undefined {
    return this._groups.get(groupId);
  }

  /**
   * Get a specific layer
   */
  getLayer(groupId: string, layerName: string): Layer | undefined {
    return this._groups.get(groupId)?.getLayer(layerName);
  }

  /**
   * Allocate z-index block for plugin
   */
  private allocateZIndex(): number {
    const zIndex = this._nextZIndex;
    this._nextZIndex += 100; // Allocate in blocks of 100
    return zIndex;
  }

  /**
   * Show/hide entire layer group
   */
  setGroupVisibility(groupId: string, visible: boolean): void {
    this._groups.get(groupId)?.setVisible(visible);
  }

  /**
   * Get all groups (for debugging/inspection)
   */
  getAllGroups(): Map<string, LayerGroup> {
    return new Map(this._groups);
  }
}
```

### 2. LayerGroup

```typescript
/**
 * A group of related layers (e.g., nodes shapes + labels)
 */
export class LayerGroup {
  private _id: string;
  private _baseZIndex: number;
  private _layers: Map<string, Layer> = new Map();

  constructor(id: string, baseZIndex: number) {
    this._id = id;
    this._baseZIndex = baseZIndex;
  }

  get id(): string {
    return this._id;
  }

  get baseZIndex(): number {
    return this._baseZIndex;
  }

  /**
   * Create a new layer in this group
   */
  createLayer(name: string, zIndex: number): Layer {
    const layer = new Layer(`${this._id}:${name}`, zIndex);
    this._layers.set(name, layer);
    return layer;
  }

  /**
   * Get a layer by name
   */
  getLayer(name: string): Layer | undefined {
    return this._layers.get(name);
  }

  /**
   * Get all layers in this group
   */
  getAllLayers(): Layer[] {
    return Array.from(this._layers.values());
  }

  /**
   * Show/hide all layers in group
   */
  setVisible(visible: boolean): void {
    this._layers.forEach(layer => layer.visible = visible);
  }

  /**
   * Set interactive state for all layers
   */
  setInteractive(interactive: boolean): void {
    this._layers.forEach(layer => layer.interactive = interactive);
  }
}
```

### 3. Layer (Enhanced)

```typescript
/**
 * Individual layer for rendering
 */
export class Layer {
  public readonly name: string;
  public readonly container: Container;
  private _zIndex: number;
  private _visible: boolean = true;
  private _interactive: boolean = false;

  constructor(name: string, zIndex: number) {
    this.name = name;
    this._zIndex = zIndex;
    this.container = new Container();
    this.container.label = `layer:${name}`;
    this.container.sortableChildren = false; // No sorting within layer
    this.container.zIndex = zIndex;
    this.container.visible = true;
  }

  // ... existing methods (visible, interactive, add, remove, clear)
}
```

### 4. Canvas Integration

```typescript
export class Canvas {
  private _layerManager: LayerManager | null = null;

  async init(): Promise<void> {
    // ... existing setup
    
    // Create layer manager with scene container
    this._layerManager = new LayerManager(this._viewport!.world);
    
    // Get core layers
    const nodeGroup = this._layerManager.getGroup('core-nodes')!;
    const edgeGroup = this._layerManager.getGroup('core-edges')!;
    
    this._nodeLayer = nodeGroup.getLayer('shapes')!.container;
    this._nodeLabels = nodeGroup.getLayer('labels')!.container;
    this._edgeLayer = edgeGroup.getLayer('shapes')!.container;
    this._edgeLabels = edgeGroup.getLayer('labels')!.container;
    
    // Create renderer with layers
    this._renderer = new Renderer({
      registry: this._registry,
      nodeShapeLayer: this._nodeLayer,
      nodeLabelLayer: this._nodeLabels,
      edgeShapeLayer: this._edgeLayer,
      edgeLabelLayer: this._edgeLabels,
    });
  }

  /**
   * Get layer manager (for plugins)
   */
  get layerManager(): LayerManager {
    if (!this._layerManager) {
      throw new Error('Canvas not initialized');
    }
    return this._layerManager;
  }
}
```

---

## Plugin System

### Plugin Interface

```typescript
/**
 * Plugin that can add layers and functionality
 */
export interface CanvasPlugin {
  /** Unique plugin ID */
  readonly id: string;
  
  /** Plugin name */
  readonly name: string;
  
  /** Layer groups this plugin needs */
  readonly layerGroups: LayerGroupConfig[];
  
  /**
   * Initialize plugin with canvas instance
   */
  init(canvas: Canvas): void | Promise<void>;
  
  /**
   * Cleanup when plugin is removed
   */
  destroy?(): void;
}

/**
 * Layer group configuration
 */
export interface LayerGroupConfig {
  /** Group ID (e.g., 'plugin-groups') */
  id: string;
  
  /** Optional base z-index (auto-allocated if not provided) */
  baseZIndex?: number;
  
  /** Layer names (e.g., ['shapes', 'labels']) */
  layers: string[];
}
```

### Example Plugin: Groups

```typescript
/**
 * Plugin for rendering node groups/clusters
 */
export class GroupsPlugin implements CanvasPlugin {
  readonly id = 'groups';
  readonly name = 'Node Groups';
  readonly layerGroups: LayerGroupConfig[] = [
    {
      id: 'plugin-groups',
      // baseZIndex auto-allocated (will be 300)
      layers: ['shapes', 'labels']
    }
  ];

  private _canvas: Canvas | null = null;
  private _groupManager: GroupManager | null = null;

  async init(canvas: Canvas): Promise<void> {
    this._canvas = canvas;
    
    // Register layers
    const layerManager = canvas.layerManager;
    const groupLayers = layerManager.registerGroup('plugin-groups', {
      layers: ['shapes', 'labels']
    });
    
    // Create group manager
    this._groupManager = new GroupManager({
      shapeLayer: groupLayers.getLayer('shapes')!.container,
      labelLayer: groupLayers.getLayer('labels')!.container,
    });
  }

  /**
   * Add a group shape
   */
  addGroup(config: GroupConfig): Group {
    if (!this._groupManager) {
      throw new Error('Plugin not initialized');
    }
    return this._groupManager.createGroup(config);
  }

  /**
   * Remove a group
   */
  removeGroup(id: string): void {
    this._groupManager?.removeGroup(id);
  }

  destroy(): void {
    this._groupManager?.destroy();
    this._groupManager = null;
  }
}
```

### Example Plugin: Annotations

```typescript
/**
 * Plugin for text annotations, arrows, highlights
 */
export class AnnotationsPlugin implements CanvasPlugin {
  readonly id = 'annotations';
  readonly name = 'Annotations';
  readonly layerGroups: LayerGroupConfig[] = [
    {
      id: 'plugin-annotations',
      layers: ['shapes', 'labels', 'arrows'] // Custom layer config
    }
  ];

  private _canvas: Canvas | null = null;
  private _annotationManager: AnnotationManager | null = null;

  async init(canvas: Canvas): Promise<void> {
    this._canvas = canvas;
    
    const layerManager = canvas.layerManager;
    const annotLayers = layerManager.registerGroup('plugin-annotations', {
      layers: ['shapes', 'labels', 'arrows']
    });
    
    this._annotationManager = new AnnotationManager({
      shapeLayer: annotLayers.getLayer('shapes')!.container,
      labelLayer: annotLayers.getLayer('labels')!.container,
      arrowLayer: annotLayers.getLayer('arrows')!.container,
    });
  }

  /**
   * Add text annotation
   */
  addTextAnnotation(config: TextAnnotationConfig): Annotation {
    return this._annotationManager!.addText(config);
  }

  /**
   * Add arrow annotation
   */
  addArrowAnnotation(config: ArrowConfig): Annotation {
    return this._annotationManager!.addArrow(config);
  }

  destroy(): void {
    this._annotationManager?.destroy();
  }
}
```

---

## Usage Examples

### Core Usage (No Plugins)

```typescript
const canvas = new Canvas({
  container: document.getElementById('app')!,
});

await canvas.init();

// Render nodes (shapes and labels in separate layers automatically)
canvas.render({
  nodes: [
    { id: 'n1', x: 100, y: 100, label: 'Node 1' },
    { id: 'n2', x: 300, y: 200, label: 'Node 2' },
  ],
  edges: [
    { id: 'e1', source: 'n1', target: 'n2', label: 'connects' }
  ]
});

// Control core layers
canvas.layerManager.setGroupVisibility('core-nodes', false); // Hide all nodes
canvas.layerManager.getLayer('core-nodes', 'labels')!.visible = false; // Hide only labels
```

### With Groups Plugin

```typescript
import { GroupsPlugin } from '@aspect-ui/canvas-groups';

const canvas = new Canvas({ container: document.getElementById('app')! });
const groupsPlugin = new GroupsPlugin();

await canvas.init();
await canvas.registerPlugin(groupsPlugin);

// Add groups
const group1 = groupsPlugin.addGroup({
  id: 'g1',
  nodeIds: ['n1', 'n2', 'n3'],
  label: 'Team A',
  style: {
    fill: '#e3f2fd',
    stroke: '#2196f3',
    strokeWidth: 2,
  }
});

// Groups render BEHIND nodes (zIndex 300 < 200)
// Group labels render on separate layer (zIndex 301)
```

### With Annotations Plugin

```typescript
import { AnnotationsPlugin } from '@aspect-ui/canvas-annotations';

const canvas = new Canvas({ container: document.getElementById('app')! });
const annotPlugin = new AnnotationsPlugin();

await canvas.init();
await canvas.registerPlugin(annotPlugin);

// Add text annotation
annotPlugin.addTextAnnotation({
  id: 'note1',
  x: 200,
  y: 100,
  text: 'Important!',
  style: {
    fill: '#ff9800',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

// Add arrow
annotPlugin.addArrowAnnotation({
  id: 'arrow1',
  from: { x: 100, y: 100 },
  to: { x: 300, y: 200 },
  label: 'Points to this'
});

// Annotations render on top (zIndex 400+)
```

### Multiple Plugins

```typescript
const canvas = new Canvas({ container: document.getElementById('app')! });

// Register multiple plugins
await canvas.registerPlugins([
  new GroupsPlugin(),
  new AnnotationsPlugin(),
  new MiniMapPlugin(),
  new TimelinePlugin(),
]);

// Each plugin gets its own z-index block:
// - core-edges: 100-199
// - core-nodes: 200-299
// - groups: 300-399
// - annotations: 400-499
// - minimap: 500-599
// - timeline: 600-699

// Toggle plugins on/off
canvas.layerManager.setGroupVisibility('plugin-groups', false);
canvas.layerManager.setGroupVisibility('plugin-annotations', false);
```

---

## Performance Benefits

### 1. **Automatic Transform Inheritance** ✅
- No manual position calculation
- PixiJS handles all transforms via scene graph
- Just copy `x, y` values between shape and label

### 2. **Render Batching** ✅
```typescript
// All node shapes render in one batch
nodeShapeLayer.children.forEach(render); // Batch 1

// All node labels render in one batch  
nodeLabelLayer.children.forEach(render); // Batch 2

// Instead of alternating shape-label-shape-label (breaks batches)
```

### 3. **Culling Optimization** ✅
```typescript
// Cull entire layer if off-screen
if (!labelLayer.isVisible()) {
  skipRendering(labelLayer); // Skip all labels at once
}
```

### 4. **Selective Updates** ✅
```typescript
// Update only labels when text changes
node.updateLabel(); // Only modifies label layer
// No need to redraw node shape

// Update only shapes when style changes
node.updateStyle(); // Only modifies shape layer
// Labels untouched
```

### 5. **Plugin Isolation** ✅
- Each plugin has dedicated layers
- No interference with core rendering
- Can disable entire plugin layer group for performance

---

## Implementation Plan

### Phase 1: Core Layer System (3-4 days)
- [ ] Implement `LayerManager`
- [ ] Implement `LayerGroup`
- [ ] Enhance existing `Layer` class
- [ ] Integrate with `Canvas`
- [ ] Update `Renderer` for separate label layers
- [ ] Tests for layer management

### Phase 2: Label Separation (2-3 days)
- [ ] Extract label logic from `NodeShapeBase`
- [ ] Create `LabelManager` for separate layer
- [ ] Implement label position syncing (just copy x, y)
- [ ] Update on node move/zoom
- [ ] Tests for label rendering

### Phase 3: Plugin System (2-3 days)
- [ ] Define `CanvasPlugin` interface
- [ ] Implement `Canvas.registerPlugin()`
- [ ] Implement plugin lifecycle (init, destroy)
- [ ] Z-index allocation system
- [ ] Tests for plugin registration

### Phase 4: Example Plugins (3-4 days)
- [ ] Create `@aspect-ui/canvas-groups` package
- [ ] Create `@aspect-ui/canvas-annotations` package
- [ ] Documentation for plugin development
- [ ] Example plugin templates

### Phase 5: Documentation & Polish (2 days)
- [ ] API documentation
- [ ] Migration guide
- [ ] Performance benchmarks
- [ ] Storybook examples

**Total: 12-16 days**

---

## Migration Path

### Backward Compatibility
```typescript
// Old code still works (embedded labels)
const canvas = new Canvas({
  labelStrategy: 'embedded' // default
});

// Opt-in to new system
const canvas = new Canvas({
  labelStrategy: 'layer' // separate layers
});
```

### Gradual Migration
1. **v1.x**: Current embedded labels (stable)
2. **v2.0**: Add layer system + plugin API (embedded still default)
3. **v2.1**: Make layer strategy default (embedded deprecated)
4. **v3.0**: Remove embedded strategy

---

## Open Questions

### 1. Label Position Sync Strategy
**Option A: On Transform (Recommended)**
```typescript
// Update label when node position changes
node.on('transform', () => {
  labelManager.updatePosition(node.id, node.x, node.y);
});
```

**Option B: Per Frame**
```typescript
// Update all labels every frame (ticker)
app.ticker.add(() => {
  labelManager.syncAllPositions();
});
```

**Recommendation**: Option A - event-driven, more efficient

### 2. Label Visibility at Zoom Levels
```typescript
// Auto-hide labels at extreme zoom levels?
canvas.on('zoomed', (zoom) => {
  if (zoom < 0.3) {
    labelLayer.visible = false; // Too zoomed out
  } else if (zoom > 5) {
    labelLayer.visible = false; // Too zoomed in
  } else {
    labelLayer.visible = true;
  }
});
```

### 3. Plugin Dependencies
Should plugins be able to depend on other plugins?
```typescript
class AdvancedGroupsPlugin implements CanvasPlugin {
  readonly dependencies = ['groups', 'annotations'];
  // ...
}
```

---

## Summary

### Key Design Decisions
1. ✅ **Separate layers for shapes and labels** (performance + features)
2. ✅ **Plugin-based architecture** (extensibility)
3. ✅ **Automatic z-index allocation** (avoid conflicts)
4. ✅ **LayerGroup pattern** (logical grouping)
5. ✅ **No manual transform calculation** (PixiJS handles it)
6. ✅ **Event-driven label sync** (efficient updates)

### Benefits
- 🚀 Better performance for large graphs
- 🎨 Easier to add advanced features
- 🔌 Plugin ecosystem support
- 📦 Clean separation of concerns
- 🛡️ Type-safe plugin API
- 📈 Scales to complex visualizations

### Ready to Implement?
This architecture supports:
- ✅ Core node/edge rendering
- ✅ Plugin-based extensions
- ✅ Groups plugin
- ✅ Annotations plugin
- ✅ Future plugins (minimap, timeline, etc.)
- ✅ High performance by default
- ✅ No manual transform math

---

**Document Version**: 2.0  
**Date**: 2025-12-27  
**Status**: Architecture Proposal
