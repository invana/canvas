# Getting Started

This guide walks you through standing up a Canvas, mounting a Layer, and wiring camera input. By the end you'll have a working scene you can pan, zoom, and extend.

::: tip Implementation status
The architecture (Layer / Behaviour / Layout / Renderer) is defined and the engine kernel has shipped. Domain layers (`GraphLayer`, `MiniMapLayer`) and layouts (`D3ForceLayout`, `ElkLayout`) are still being built. The examples below use what's actually exported today.
:::

## Installation

```bash
pnpm add @invana/canvas pixi.js
# or
npm install @invana/canvas pixi.js
# or
yarn add @invana/canvas pixi.js
```

`pixi.js` is a peer dependency — install it alongside the canvas package.

## What you import from where

`@invana/canvas` ships under three subpaths so consumers can pull only what they need:

| Subpath | Contains |
|---|---|
| `@invana/canvas` | `Canvas`, base classes (`Layer`, `WorldLayer`, `ScreenLayer`, `Behaviour`), `Camera`, registries, store, events |
| `@invana/canvas/renderers/shapes` | `ShapesRenderer` + base interfaces + built-in shapes / connectors / markers / decorations |
| `@invana/canvas/toolkit` | Built-in layers and camera-input behaviours (`BackgroundLayer`, `DevInfoLayer`, `DragPanBehaviour`, `WheelZoomBehaviour`, …) |

For the kernel essentials, you can also import behaviours / `ShapesRenderer` directly from `@invana/canvas` — both paths re-export the same symbols.

## Step 1 — create and initialise the Canvas

```ts
import { Canvas } from '@invana/canvas';

const canvas = new Canvas();

await canvas.init({
  container: document.getElementById('canvas-container')!,
  width: 800,
  height: 600,
  preference: 'webgpu',  // falls back to webgl, then canvas
  autoResize: true,
});
```

`init()` is async because it negotiates a GPU backend through PixiJS. After it resolves, `canvas.events`, `canvas.camera`, `canvas.layers`, and `canvas.behaviours` are all available.

The `'renderer:initialised'` event fires when init completes, with the resolved backend:

```ts
canvas.events.on('renderer:initialised', ({ backend }) => {
  console.log('Running on', backend);  // 'webgpu' | 'webgl' | 'canvas'
});
```

## Step 2 — wire camera input

**Behaviours never auto-enable.** A fresh canvas has no input wired up — pan, zoom, and keyboard navigation are all opt-in. Register the ones you want:

```ts
import {
  DragPanBehaviour,
  WheelZoomBehaviour,
  PinchZoomBehaviour,
  KeyboardCameraInputBehaviour,
} from '@invana/canvas';

canvas.behaviours.register(
  new DragPanBehaviour({ id: 'pan', enabled: true }),
);
canvas.behaviours.register(
  new WheelZoomBehaviour({ id: 'wheel-zoom', enabled: true }),
);
canvas.behaviours.register(
  new PinchZoomBehaviour({ id: 'pinch-zoom', enabled: true }),
);
canvas.behaviours.register(
  new KeyboardCameraInputBehaviour({ id: 'keyboard', enabled: true }),
);
```

Note `enabled: true` on each — without it, the behaviour is registered but inactive.

Toggle later from a UI handler:

```ts
canvas.behaviours.setEnabled('pan', false);
canvas.behaviours.setEnabled('lasso', true);
```

## Step 3 — add a Layer

A Layer is the unit of rendered output. The kernel ships abstract base classes (`Layer`, `WorldLayer`, `ScreenLayer`); the toolkit (and `@invana/graph`) ship concrete ones.

The simplest custom Layer paints a circle directly:

```ts
import { WorldLayer, draw } from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';

interface DotsState {
  color: number;
}

class DotsLayer extends WorldLayer<{}, DotsState> {
  protected createState(): DotsState {
    return { color: 0x3b82f6 };
  }

  protected onMount(_ctx: CanvasContext): void {
    const g = this.createGraphics('dots');
    draw.drawCircle(g, { kind: 'circle', x: 0, y: 0, r: 40, fill: this.state.getState().color });
    draw.drawCircle(g, { kind: 'circle', x: 100, y: 50, r: 20, fill: 0xef4444 });
  }

  hitTest(_worldX: number, _worldY: number) {
    return null;  // not interactive in this example
  }
}

canvas.layers.add(new DotsLayer({ id: 'dots', options: {} }));
```

`createGraphics(label?)` returns a pixi `Graphics` attached to this layer's root container. Use the `draw.*` helpers to paint into it without importing `pixi.js` directly.

## Step 4 — listen to events

Every Layer has its own typed event emitter (`layer.events`). Canvas-wide events live on `canvas.events`:

```ts
canvas.events.on('camera:zoom', ({ scale }) => {
  console.log('zoom is now', scale);
});

canvas.events.on('layer:added', ({ id }) => {
  console.log('mounted', id);
});
```

Layer events do **not** bubble to canvas events. If you want canvas-wide observability, use the telemetry tap:

```ts
canvas.events.tap((event) => {
  console.log(event.type, event.payload);  // 'layer:dots:...'
});
```

See [the events guide](/guide/events) for the full hierarchy.

## Step 5 — react to state changes

Layer state is observable. Subscribe and project changes into your UI:

```ts
const dots = canvas.layers.get<DotsLayer>('dots')!;

dots.state.subscribe((s) => {
  document.body.style.background = `#${s.color.toString(16)}`;
});
```

In a domain layer like `GraphLayer`, this is how an inspector pane reacts to selection — same pattern.

## Composing multiple Layers

`canvas.layers.add()` mounts a Layer; `zIndex` controls draw order. Lower z draws below, higher above:

```ts
canvas.layers.add(new BackgroundLayer({ id: 'bg', options: { pattern: 'dots' }, zIndex: 0 }));
canvas.layers.add(new GraphLayer({ id: 'graph', options: { ... }, zIndex: 10 }));
canvas.layers.add(new MiniMapLayer({ id: 'minimap', options: { sourceLayerId: 'graph' } }));
```

`MiniMapLayer` is a `ScreenLayer` — it stays glued to the viewport regardless of camera. `BackgroundLayer` and `GraphLayer` are `WorldLayer`s — they pan and zoom with the user's view.

When a Layer reads from a peer (a minimap reading the graph it mirrors), pass the source layer's id as an explicit option. Don't infer "the only graph layer."

## Cleanup

```ts
canvas.destroy();
```

`destroy()` unmounts every Layer, destroys every Behaviour, drops the pixi `Application`, and clears the event bus. It's idempotent — safe to call twice.

## Next steps

- [Architecture overview](/guide/architecture) — the three-concept model
- [Layers](/guide/layers) — state vs data, dirty/flush, hit testing
- [Behaviours](/guide/behaviours) — scope, defaults, gesture conflicts
- [Layouts](/guide/layouts) — pure functions from data to positions
- [Renderers](/guide/renderers) — `ShapesRenderer` and decorations
- [Events](/guide/events) — three-tier hierarchy and telemetry tap
