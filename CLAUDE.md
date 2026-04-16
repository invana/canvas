# CLAUDE.md — @invana/canvas

High-performance WebGPU-first canvas rendering engine and graph visualization toolkit. WebGL2 fallback is automatic. Built as a pnpm monorepo with Turbo.

---

## Monorepo Structure

```
packages/
  canvas-core/         @invana/canvas-core    — core rendering engine
  canvas-utils/        @invana/canvas-utils   — math, color, geometry utilities
  layouts-d3-force/    @invana/layouts-d3-force — D3 force layout plugin
  example-datasets/    @invana/example-datasets — sample graph datasets
  typescript-config/   @repo/typescript-config  — shared tsconfig
  eslint-config/       @repo/eslint-config      — shared ESLint config
apps/
  storybook/           @canvas/storybook        — interactive docs (port 6006)
```

---

## Common Commands

```bash
# Install
pnpm install

# Build all packages
pnpm build

# Dev (watch mode for all packages)
pnpm dev

# Run storybook
pnpm storybook

# Type-check
pnpm check-types

# Lint
pnpm lint

# Format
pnpm format

# Clean everything
pnpm clean
```

Per-package:
```bash
pnpm --filter @invana/canvas-core build
pnpm --filter storybook dev
```

---

## Architecture

```
Canvas (core orchestrator)
  ├── Viewport        pan/zoom via pixi-viewport
  ├── LayerManager    z-indexed LayerGroups → Layers
  ├── PluginRegistry  static registry of plugin classes
  ├── Renderer        manages node/edge render lifecycle
  ├── Registry        shape/path/arrow drawer registry
  ├── ProcessorPipeline  sequential event processors
  └── Style           function-based styling system
        ↓
Elements (RendererNodeBase / RendererEdgeBase)
  ├── Nodes: Circle, Rect, Ellipse, HTML, Star, Polygon variants
  └── Edges: Line, Bezier, Orthogonal
        ↓
Primitives (pure PixiJS.Graphics functions)
  ├── shapes/   circle, rect, ellipse, polygon, star, roundedRect
  ├── paths/    line, bezier, orthogonal
  ├── arrows/
  ├── labels/
  ├── effects/  halos
  └── fills/
```

### canvas-core/src layout

```
core/           Canvas.ts — main class
defaults/       canvas, nodes, edges, labels defaults
elements/       RendererBase, nodes/, edges/
layers/         Layer, LayerGroup, LayerManager
plugins/        all built-in plugins + PluginRegistry + types
primitives/     shapes/, paths/, arrows/, labels/, fills/
processors/     BaseProcessor, ProcessorPipeline, ProcessorRegistry, builtins
rendering/      Registry (shape/path registry), Renderer
style/          FunctionBasedStyle
types/          states
utils/          EventEmitter
viewport/       Viewport
index.ts        all public exports
```

---

## Key APIs

### Canvas initialization

```typescript
import { Canvas, GraphDataPlugin } from '@invana/canvas-core';

const canvas = new Canvas({
  container,                 // HTMLElement
  width: 800,
  height: 600,
  behavior: 'default',       // 'default' | 'minimal' | 'full' | false
  plugins: [
    {
      plugin: 'background',
      key: 'my-bg',
      options: { type: 'pattern', patternType: 'dots', backgroundColor: '#212121' }
    }
  ]
});

await canvas.init();

const graphPlugin = new GraphDataPlugin({ fitOnRender: true, fitPadding: 50 });
await canvas.registerPlugin(graphPlugin);
```

### Graph data

```typescript
graphPlugin.setData({
  nodes: [
    { id: 'n1', x: 0, y: 0, shape: 'circle', size: 40, label: 'Node' }
  ],
  edges: [
    { id: 'e1', source: 'n1', target: 'n2', pathType: 'bezier' }
  ]
});
```

### Styling

Properties accept static values or functions:

```typescript
graphPlugin.setStyles({
  node: {
    fill: '#3fcbeb',
    stroke: (node) => node.selected ? '#ff0000' : '#ffffff',
    strokeWidth: 2,
  },
  edge: {
    stroke: '#58a6ff',
    strokeWidth: 2,
  }
});
```

State-based styles via `DEFAULT_NODE_STATE_STYLES` (ACTIVE, SELECTED, HIGHLIGHTED, DISABLED, MUTED).

### Plugin system

```typescript
// Register a custom plugin
PluginRegistry.register('my-plugin', MyPluginClass);

// Use in Canvas config
const canvas = new Canvas({
  plugins: ['my-plugin', { plugin: 'my-plugin', key: 'p2', options: {} }]
});

// Retrieve at runtime
const plugin = canvas.getPlugin('my-plugin');
```

### Built-in plugins

| Plugin | Key |
|---|---|
| `GraphDataPlugin` | — |
| `BackgroundPlugin` | `background` |
| `DragElementPlugin` | — |
| `DragCanvasPlugin` | — |
| `ZoomControlPlugin` | — |
| `ClickSelectPlugin` | — |
| `HoverActivatePlugin` | — |
| `FocusElementPlugin` | — |
| `MiniMapPlugin` | — |
| `GroupsPlugin` | — |

### Layer architecture

```typescript
const layers: LayerGroupConfig[] = [
  { id: 'graph-edges', zIndex: 1, layers: [{ id: 'edges', type: 'shapes' }] },
  { id: 'graph-nodes', zIndex: 2, layers: [{ id: 'nodes', type: 'shapes' }, { id: 'badges', type: 'badges' }] }
];
```

### D3 Force layout

```typescript
import { D3ForceLayoutPlugin } from '@invana/layouts-d3-force';

const layout = new D3ForceLayoutPlugin({
  charge: -300,
  linkDistance: 100,
  collisionRadius: 30,
  animate: true,
  iterations: 300
});
await canvas.registerPlugin(layout);
await layout.start();
```

### Utilities

```typescript
import { math, vec2, color, geometry } from '@invana/canvas-utils';

math.clamp(v, min, max);
vec2.normalize({ x, y });
color.lighten('#3fcbeb', 20);
geometry.calculateEdgeEndpoints(source, target, ...);
```

### Example datasets

```typescript
import { lesMiserablesDataRaw, generateRandomTree } from '@invana/example-datasets';
// lesMiserablesDataRaw: { nodes[], links[] }  — 77 nodes, 254 edges
// generateRandomTree(): ICanvasData
```

---

## Build System

All packages use **tsup** outputting ES modules with `.d.ts` and sourcemaps. `pixi.js` is kept external in canvas-core.

```typescript
// tsup.config.ts pattern
{
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  external: ['pixi.js']   // canvas-core only
}
```

Turbo pipeline: `build` depends on `^build` (deps first), outputs to `dist/**`.

---

## TypeScript Config

All packages extend `@repo/typescript-config/base.json`. Path alias `@/*` maps to `./src/*`.

```json
{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

---

## Storybook

Stories live in `apps/storybook/stories/` organized as:

```
canvas/
  usage/          — simple-usage, multiple-instances
  behavior/       — behavior presets
  styling/        — theming, background, nodes
  animation/      — viewport animations
elements/         — node/edge shape demos
examples/         — full feature examples
layouts/          — D3 force layout examples
```

Storybook dev server: `pnpm storybook` → http://localhost:6006

Story pattern — always use `createContainer()` from `@/div-utils` and the `play` async function:

```typescript
import { Canvas, GraphDataPlugin } from '@invana/canvas-core';
import { createContainer } from '@/div-utils';

export const MyStory: Story = {
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;
    // canvas setup here
  }
};
```

## instructions

1. Always use public api exposed by canvas for events, avoid accessing events from `this._viewport` or `shapes` directly
2. for drawing any new graphics, always using primitives/, so dont call Container or Graphics of pixi.js
