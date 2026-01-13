# @invana/layouts-d3-force

D3 force-directed graph layout plugin for `@invana/canvas-core`.

## Installation

```bash
pnpm add @invana/layouts-d3-force
```

## Usage

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

## Configuration

### D3ForceLayoutOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `charge` | `number` | `-300` | Charge force strength (negative = repulsion) |
| `linkDistance` | `number` | `100` | Target distance between connected nodes |
| `collisionRadius` | `number` | `30` | Radius for collision detection |
| `centerStrength` | `number` | `0.1` | Strength of centering force |
| `alphaDecay` | `number` | `0.0228` | How quickly simulation cools down |
| `velocityDecay` | `number` | `0.4` | Friction/damping factor |
| `animate` | `boolean` | `true` | Enable real-time animation |
| `iterations` | `number` | `300` | Max iterations if `animate: false` |

## API

### Methods

#### `start(): Promise<void>`
Start the layout simulation. Returns a promise that resolves when complete.

```typescript
await layoutPlugin.start();
```

#### `stop(): void`
Stop the running simulation.

```typescript
layoutPlugin.stop();
```

#### `setOptions(options: Partial<D3ForceLayoutOptions>): void`
Update layout options dynamically. Reheats and restarts the simulation.

```typescript
layoutPlugin.setOptions({
  charge: -500,
  linkDistance: 150,
});
```

#### `getOptions(): D3ForceLayoutOptions`
Get current options.

```typescript
const options = layoutPlugin.getOptions();
console.log(options.charge); // -300
```

#### `isRunning(): boolean`
Check if simulation is currently running.

```typescript
if (layoutPlugin.isRunning()) {
  console.log('Layout in progress...');
}
```

## Animation Modes

### Real-time Animation (Default)
```typescript
const layoutPlugin = new D3ForceLayoutPlugin({
  animate: true, // nodes move smoothly in real-time
});
await layoutPlugin.start(); // Promise resolves when simulation ends
```

### Static Layout (Fast)
```typescript
const layoutPlugin = new D3ForceLayoutPlugin({
  animate: false, // compute all at once
  iterations: 300, // run 300 iterations synchronously
});
await layoutPlugin.start(); // Completes immediately
```

## License

Apache-2.0
