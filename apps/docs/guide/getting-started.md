# Getting Started

## Installation

`@invana/canvas` is an ES module package. Install it alongside its peer dependency:

```bash
npm install @invana/canvas pixi.js
# or
pnpm add @invana/canvas pixi.js
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

## Adding elements

```ts
import { Canvas, ElementPlugin } from '@invana/canvas';

const canvas = new Canvas({ container, width: 800, height: 600 });
await canvas.init();

const elements = new ElementPlugin({ fitOnRender: true });
await canvas.plugins.register(elements);

elements.addSolid('circle', {
  id: 'n1',
  x: 0,
  y: 0,
  radius: 30,
  style: { fill: '#3fcbeb', stroke: '#ffffff', strokeWidth: 2 },
  interactive: true,
  draggable: true,
});

canvas.events.on('element:click', ({ elementId }) => {
  console.log('clicked', elementId);
});
```

## TypeScript

The package ships full TypeScript declarations. Import types directly from `@invana/canvas`:

```ts
import type { CanvasOptions, CanvasPlugin, PluginContext } from '@invana/canvas';
```
