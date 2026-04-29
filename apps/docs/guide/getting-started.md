# Getting Started

## Installation

`@invana/canvas` is an ES module package. Install it with your preferred package manager:

```bash
npm install @invana/canvas
# or
pnpm add @invana/canvas
```

For graph visualization (nodes, edges, layouts) install the graph data plugin too:

```bash
npm install @invana/plugins-graph-data
# or
pnpm add @invana/plugins-graph-data
```

## Basic setup

```ts
import { Canvas } from '@invana/canvas';

const container = document.getElementById('app') as HTMLElement;

const canvas = new Canvas({
  container,
  width: container.clientWidth,
  height: container.clientHeight,
  backgroundColor: '#1a1a2e',
});

await canvas.init();
```

`canvas.init()` is **async** — it initialises the WebGPU/WebGL renderer, camera, and layer manager. All other calls must come after `await canvas.init()`.

## Adding a background

```ts
import { Canvas, BackgroundPlugin } from '@invana/canvas';

const canvas = new Canvas({ container, width: 800, height: 600 });
await canvas.init();

await canvas.plugins.register(
  new BackgroundPlugin({
    type: 'pattern',
    patternType: 'dots',
    backgroundColor: '#1a1a2e',
    color: '#595959',
    spacing: 30,
    alpha: 0.6,
  })
);
```

## Adding graph elements

```ts
import { Canvas } from '@invana/canvas';
import { GraphDataPlugin } from '@invana/plugins-graph-data';

const canvas = new Canvas({ container, width: 800, height: 600 });
await canvas.init();

const graph = new GraphDataPlugin({ fitOnRender: true });
await canvas.plugins.register(graph);

graph.setData({
  nodes: [
    { id: 'n1', x: 0,   y: 0,   shape: 'circle', size: 40, label: 'A' },
    { id: 'n2', x: 200, y: 0,   shape: 'circle', size: 40, label: 'B' },
  ],
  edges: [
    { id: 'e1', source: 'n1', target: 'n2', pathType: 'bezier' },
  ],
});

canvas.events.on('graph:click', ({ elementId }) => {
  console.log('clicked', elementId);
});
```

## TypeScript

The package ships full TypeScript declarations. Import types directly from `@invana/canvas`:

```ts
import type { CanvasOptions, CanvasPlugin, PluginContext } from '@invana/canvas';
```
