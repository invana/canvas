# Plugin-Based Layer Architecture

## Overview

The Canvas now supports a **plugin-based layer architecture** that allows dynamic extension through plugins. Each plugin can register its own layer groups, enabling modular functionality like groups, annotations, minimap, timeline, and more.

## Key Features

✅ **Layer Groups** - Organize related layers (e.g., shapes + labels)  
✅ **Plugin System** - Plugins can dynamically register layer groups  
✅ **Z-Index Management** - Automatic allocation in blocks of 100  
✅ **Transform Inheritance** - Automatic position sync via PixiJS Container hierarchy  
✅ **Layer Controls** - Show/hide entire layer groups  
✅ **Type-Safe** - Full TypeScript support

## Architecture

```
Viewport (scene container)
  └── LayerManager
      ├── core-edges (z: 100-199)
      │   ├── shapes (z: 100)
      │   └── labels (z: 101)
      ├── core-nodes (z: 200-299)
      │   ├── shapes (z: 200)
      │   └── labels (z: 201)
      ├── plugin-groups (z: 300-399)
      │   ├── shapes (z: 300)
      │   └── labels (z: 301)
      └── plugin-annotations (z: 400-499)
          ├── shapes (z: 400)
          └── labels (z: 401)
```

## Core API

### LayerManager

Central manager for all layers with plugin registration support.

```typescript
class LayerManager {
  // Register a new layer group (core or plugin)
  registerGroup(config: LayerGroupConfig): LayerGroup;
  
  // Get a layer group
  getGroup(groupId: string): LayerGroup | undefined;
  
  // Get a specific layer
  getLayer(groupId: string, layerName: string): Layer | undefined;
  
  // Show/hide layer group
  setGroupVisibility(groupId: string, visible: boolean): void;
  
  // Set interactive state
  setGroupInteractive(groupId: string, interactive: boolean): void;
  
  // Unregister a group
  unregisterGroup(groupId: string): void;
}
```

### LayerGroup

A group of related layers (e.g., node shapes + labels).

```typescript
class LayerGroup {
  readonly id: string;
  readonly baseZIndex: number;
  
  // Create a layer in this group
  createLayer(name: string, zIndex: number): Layer;
  
  // Get a layer by name
  getLayer(name: string): Layer | undefined;
  
  // Get all layers
  getAllLayers(): Layer[];
  
  // Show/hide all layers
  setVisible(visible: boolean): void;
  
  // Set interactive state
  setInteractive(interactive: boolean): void;
}
```

## Plugin System

### Plugin Interface

```typescript
interface CanvasPlugin {
  // Unique plugin ID
  readonly id: string;
  
  // Plugin name
  readonly name: string;
  
  // Layer groups this plugin needs
  readonly layerGroups: LayerGroupConfig[];
  
  // Initialize plugin with canvas instance
  init(canvas: Canvas): void | Promise<void>;
  
  // Cleanup when plugin is removed
  destroy?(): void;
}

interface LayerGroupConfig {
  id: string;                // e.g., 'plugin-groups'
  baseZIndex?: number;       // Auto-allocated if not provided
  layers: string[];          // e.g., ['shapes', 'labels']
}
```

### Creating a Plugin

```typescript
import type { Canvas, CanvasPlugin } from '@aspect-ui/canvas-core';
import { Container, Graphics } from 'pixi.js';

export class MyPlugin implements CanvasPlugin {
  readonly id = 'my-plugin';
  readonly name = 'My Custom Plugin';
  readonly layerGroups = [
    {
      id: 'plugin-my-feature',
      layers: ['shapes', 'labels', 'overlays']
    }
  ];

  private _shapeLayer: Container | null = null;

  async init(canvas: Canvas): Promise<void> {
    // Get layers
    const group = canvas.layerManager.getGroup('plugin-my-feature');
    this._shapeLayer = group?.getLayer('shapes')?.container ?? null;
    
    // Setup your plugin...
  }

  destroy(): void {
    // Cleanup...
  }
}
```

### Using Plugins

```typescript
import { Canvas, GroupsPlugin } from '@aspect-ui/canvas-core';

const canvas = new Canvas({
  container: document.getElementById('app')!,
});

await canvas.init();

// Register plugin
const groupsPlugin = new GroupsPlugin();
await canvas.registerPlugin(groupsPlugin);

// Use plugin
groupsPlugin.addGroup({
  id: 'team-a',
  nodeIds: ['n1', 'n2', 'n3'],
  x: 100,
  y: 100,
  width: 200,
  height: 150,
  style: {
    fill: '#e3f2fd',
    fillAlpha: 0.3,
    stroke: '#2196f3',
    strokeWidth: 2,
  }
});
```

### Canvas Plugin Methods

```typescript
// Register a plugin
await canvas.registerPlugin(plugin, { autoInit: true });

// Register multiple plugins
await canvas.registerPlugins([plugin1, plugin2]);

// Get a plugin
const plugin = canvas.getPlugin<MyPlugin>('my-plugin');

// Check if plugin is registered
if (canvas.hasPlugin('my-plugin')) {
  // ...
}

// Unregister a plugin
canvas.unregisterPlugin('my-plugin');
```

## Example: GroupsPlugin

The `GroupsPlugin` demonstrates the plugin system by adding group/cluster functionality.

```typescript
import { Canvas, GroupsPlugin } from '@aspect-ui/canvas-core';

const canvas = new Canvas({ container });
await canvas.init();

const groupsPlugin = new GroupsPlugin();
await canvas.registerPlugin(groupsPlugin);

// Add a group
groupsPlugin.addGroup({
  id: 'team-a',
  nodeIds: ['n1', 'n2', 'n3'],
  x: 100,
  y: 100,
  width: 200,
  height: 150,
  label: 'Team A',
  style: {
    fill: '#e3f2fd',
    fillAlpha: 0.3,
    stroke: '#2196f3',
    strokeWidth: 2,
  }
});

// Remove a group
groupsPlugin.removeGroup('team-a');

// Clear all groups
groupsPlugin.clearAll();
```

## Layer Controls

```typescript
// Show/hide layer groups
canvas.layerManager.setGroupVisibility('core-edges', false);
canvas.layerManager.setGroupVisibility('plugin-groups', true);

// Set interactive state
canvas.layerManager.setGroupInteractive('core-nodes', true);

// Get all groups
const groups = canvas.layerManager.getAllGroups();
for (const [id, group] of groups) {
  console.log(`${id}: z-index ${group.baseZIndex}`);
}
```

## Z-Index Allocation

Layers are organized in z-index blocks:

| Layer Group | Z-Index Range | Usage |
|------------|---------------|-------|
| **core-edges** | 100-199 | Edge shapes and labels |
| **core-nodes** | 200-299 | Node shapes and labels |
| **Plugins** | 300+ | Auto-allocated in blocks of 100 |

Example:
- `plugin-groups`: 300-399
- `plugin-annotations`: 400-499
- `plugin-minimap`: 500-599
- `plugin-timeline`: 600-699

Within each group, sub-layers typically use:
- `shapes`: baseZIndex + 0
- `labels`: baseZIndex + 1

## Transform Inheritance

**Key Insight**: PixiJS Container children automatically inherit parent transforms!

All layers are children of the same viewport, so:
- ✅ **Camera zoom/pan** - Automatic for all layers
- ✅ **Position inheritance** - Automatic from parent containers
- ❌ **No manual sync needed** - PixiJS handles it

```typescript
// All layers are children of viewport.content
viewport.content
  ├── core-edges:shapes
  ├── core-edges:labels
  ├── core-nodes:shapes
  ├── core-nodes:labels
  ├── plugin-groups:shapes
  └── plugin-groups:labels

// When camera moves:
viewport.x = 100;  // All children move automatically!
viewport.scale.x = 2;  // All children zoom automatically!
```

## Performance Benefits

1. **Render Batching** - Similar elements render together
2. **Culling** - Can hide entire layer groups at once
3. **Selective Updates** - Update only affected layers
4. **Plugin Isolation** - Plugins don't interfere with core

## Migration from Old System

The old `LayerManager` API is **completely replaced**. Update your code:

**Before:**
```typescript
const layerManager = new LayerManager(container);
const nodeLayer = layerManager.getLayerByType('nodes');
```

**After:**
```typescript
const layerManager = new LayerManager(container);
const nodeGroup = layerManager.getGroup('core-nodes');
const nodeLayer = nodeGroup?.getLayer('shapes');
```

## Future Plugins

Potential plugins to build:

- **AnnotationsPlugin** - Text annotations, arrows, highlights
- **MiniMapPlugin** - Overview map with navigation
- **TimelinePlugin** - Temporal visualization
- **SelectionPlugin** - Advanced selection tools
- **LayoutPlugin** - Force-directed, hierarchical layouts
- **FilterPlugin** - Visual filtering controls
- **MetricsPlugin** - Performance monitoring overlay

## API Reference

### Types

```typescript
// Plugin types
export type {
  CanvasPlugin,
  LayerGroupConfig,
  PluginRegistrationOptions
} from '@aspect-ui/canvas-core';

// Layer types
export {
  Layer,
  LayerGroup,
  LayerManager
} from '@aspect-ui/canvas-core';

// Example plugin
export {
  GroupsPlugin,
  type GroupConfig
} from '@aspect-ui/canvas-core';
```

## Examples

See the Storybook stories:
- `PluginSystem.stories.ts` - Full examples
- Story: "Plugin Layer System" - Basic plugin usage
- Story: "Toggle Plugin Layers" - Layer visibility controls
- Story: "Multiple Plugins" - Plugin management

## Implementation Status

✅ **Phase 1: Core Layer System** (Completed)
- LayerManager with plugin support
- LayerGroup for organizing layers
- Plugin registration API

✅ **Phase 2: Example Plugin** (Completed)
- GroupsPlugin demonstrating plugin pattern
- Z-index allocation system
- Layer visibility controls

⏳ **Phase 3: Label Separation** (Future)
- Separate label layers
- LabelManager for position sync
- Event-driven label updates

⏳ **Phase 4: More Plugins** (Future)
- AnnotationsPlugin
- MiniMapPlugin
- Additional plugin examples

## Contributing

To create a new plugin:

1. Implement the `CanvasPlugin` interface
2. Define your layer groups in `layerGroups`
3. Initialize layers in `init(canvas)`
4. Add your functionality
5. Cleanup in `destroy()` (optional)

Example template:

```typescript
export class MyPlugin implements CanvasPlugin {
  readonly id = 'my-plugin';
  readonly name = 'My Plugin';
  readonly layerGroups = [
    { id: 'plugin-my-feature', layers: ['shapes', 'labels'] }
  ];

  async init(canvas: Canvas): Promise<void> {
    // Get layers and setup
  }

  destroy(): void {
    // Cleanup
  }
}
```

## License

Part of @aspect-ui/canvas-core package.
