# Plugin Usage



### Basic Example

```typescript
import { Canvas, GraphDataPlugin, PluginRegistry } from '@invana/canvas-core';
import { D3ForceLayoutPlugin } from '@invana/layouts-d3-force';

// Register plugins
PluginRegistry.register('graph-data', GraphDataPlugin);
PluginRegistry.register('layout-d3-force', D3ForceLayoutPlugin);

// Create canvas with declarative config
const canvas = new Canvas({
  container: document.getElementById('app'),
  plugins: [
    {
      plugin: 'graph-data',
      key: 'graph',
      options: {
        data: {
          nodes: [
            { id: 'n1', x: 0, y: 0, shape: 'circle' },
            { id: 'n2', x: 0, y: 0, shape: 'circle' },
            { id: 'n3', x: 0, y: 0, shape: 'circle' },
          ],
          edges: [
            { id: 'e1', source: 'n1', target: 'n2' },
            { id: 'e2', source: 'n2', target: 'n3' },
          ],
        },
      },
    },
    {
      plugin: 'layout-d3-force',
      key: 'layout',
      options: {
        charge: -300,
        linkDistance: 100,
        collisionRadius: 30,
        animate: true,
      },
    },
  ],
});

await canvas.init();

// Start layout
const layoutPlugin = canvas.getPlugin('layout');
await layoutPlugin.start();
```

### Imperative Example

```typescript
import { Canvas, GraphDataPlugin } from '@invana/canvas-core';
import { D3ForceLayoutPlugin } from '@invana/layouts-d3-force';

const canvas = new Canvas({ container: document.getElementById('app') });
await canvas.init();

// Add graph data
const graphPlugin = new GraphDataPlugin();
await canvas.registerPlugin(graphPlugin);
graphPlugin.setData({
  nodes: [
    { id: 'n1', x: 0, y: 0, shape: 'circle' },
    { id: 'n2', x: 0, y: 0, shape: 'circle' },
    { id: 'n3', x: 0, y: 0, shape: 'circle' },
  ],
  edges: [
    { id: 'e1', source: 'n1', target: 'n2' },
    { id: 'e2', source: 'n2', target: 'n3' },
  ],
});

// Add layout plugin
const layoutPlugin = new D3ForceLayoutPlugin({
  charge: -300,
  linkDistance: 100,
  collisionRadius: 30,
  animate: true,
});
await canvas.registerPlugin(layoutPlugin);

// Run layout
await layoutPlugin.start();
```