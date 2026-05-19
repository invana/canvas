# Getting Started

This guide walks you through standing up a Canvas, mounting a Layer, drawing shapes, and wiring camera input. By the end you'll have a working pan-and-zoom scene with a couple of shapes connected by a line.

::: tip Implementation status
The engine kernel — `Canvas`, `Layer` bases, `PrimitivesRenderer`, the five camera-input behaviours — has shipped. Domain packages (`@invana/graph`, the layout packages, datasets) are skeleton-only at the moment. See [Package status](./packages.md) for what each package actually exports today.
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

`@invana/canvas` ships under two subpath exports:

| Subpath | What's inside |
|---|---|
| `@invana/canvas` | `Canvas`, `Camera`, base classes (`Layer`, `WorldLayer`, `ScreenLayer`, `Behaviour`), `LayerRegistry`, `BehaviourRegistry`, `CanvasEventBus`, `Store`, `ColumnStore`, `DirtyBatcher`, the five built-in behaviours, and a full re-export of the primitives surface. |
| `@invana/canvas/primitives` | `PrimitivesRenderer` and its base classes / built-in shapes / connectors / markers / routers / anchors / path styles / decorations. The granular subpath when you want to keep imports tight. |

Everyday application code mostly imports from `@invana/canvas`. Reach for `/primitives` when you're authoring a custom shape, connector, decoration, router, or anchor.

## Step 1 — create and initialise the Canvas

`Canvas` is the engine root. It owns the pixi `Application`, the tick loop, the camera, the registries, and the event bus.

```ts
import { Canvas } from '@invana/canvas';

const canvas = new Canvas({ id: 'main' });

await canvas.init({
  container: document.getElementById('canvas-root')!,
  preference: 'webgpu', // pixi falls back to webgl/canvas if unavailable
  autoResize: true,
});
```

`init` is async because pixi's renderer creation is async. Once it resolves, `canvas.world`, `canvas.stage`, `canvas.camera`, `canvas.layers`, and `canvas.behaviours` are all live.

Listen for the backend pixi resolved:

```ts
canvas.events.on('renderer:initialised', ({ backend, capabilities }) => {
  console.log(`rendering on ${backend}`, capabilities);
});
```

## Step 2 — define a Layer

Most diagram content lives on a `WorldLayer` — camera-affected, panning and zooming with the user's view. Subclass it, compose a `PrimitivesRenderer` inside `onMount`, and your layer can draw shapes and connectors.

```ts
import { WorldLayer, type WorldLayerHit, type CanvasContext } from '@invana/canvas';
import { PrimitivesRenderer } from '@invana/canvas/primitives';

interface DemoOptions {
  /* layer-specific config goes here */
}

interface DemoState {
  hoveredId: string | null;
}

class DemoLayer extends WorldLayer<DemoOptions, DemoState> {
  renderer!: PrimitivesRenderer;

  protected createState(): DemoState {
    return { hoveredId: null };
  }

  protected onMount(ctx: CanvasContext): void {
    this.renderer = new PrimitivesRenderer({
      container: this.container,   // root from WorldLayer
      camera: ctx.camera,
    });

    this.renderer.addShape('a', {
      kind: 'circle',
      x: -120, y: 0,
      radius: 32,
      fill: 0x4f46e5,
      stroke: { color: 0x1e1b4b, width: 2 },
    });

    this.renderer.addShape('b', {
      kind: 'rect',
      x: 60, y: -24,
      width: 120, height: 48,
      cornerRadius: 8,
      fill: 0x10b981,
    });

    this.renderer.addConnector('a-b', {
      kind: 'connector',
      source: { kind: 'shape', shapeId: 'a', anchor: 'boundary' },
      target: { kind: 'shape', shapeId: 'b', anchor: 'boundary' },
      router: 'straight',
      stroke: { color: 0x111827, width: 2 },
    });
  }

  protected onUnmount(): void {
    this.renderer.destroy();
  }

  hitTest(worldX: number, worldY: number): WorldLayerHit | null {
    const hit = this.renderer.hitTest(worldX, worldY);
    return hit ? { id: hit.id, kind: hit.kind } : null;
  }

  override getBounds() {
    return super.getBounds();
  }
}
```

## Step 3 — mount the Layer

```ts
const demo = new DemoLayer({ id: 'demo', options: {} });
canvas.layers.add(demo);
```

`LayerRegistry.add` calls `layer.mount(ctx)`, fires `layer:added` on the bus, and the next tick will draw the shapes you registered.

## Step 4 — fit the camera to content

After adding shapes, centre the viewport on whatever you drew:

```ts
canvas.camera.fitContent(demo.getBounds(), 100);
```

The `100` is screen-pixel padding around the bounding rect.

## Step 5 — register and enable camera-input behaviours

Behaviours don't auto-enable. Register each one, then explicitly enable it.

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

Toggle later with `canvas.behaviours.setEnabled('pan', false)`.

## Step 6 — tear down

```ts
canvas.destroy();
```

`destroy` is idempotent. It unmounts every layer, destroys every behaviour, drops the world subtree, clears bus subscriptions, and destroys the pixi `Application`.

## Where to next

- [Architecture](./architecture.md) — the Layer / Behaviour / Layout / Renderer mental model.
- [Canvas & Camera](./canvas.md) — engine root and projection.
- [Layers](./layers.md) — `WorldLayer` vs `ScreenLayer`, picking the right base.
- [Behaviours](./behaviours.md) — the five built-in input behaviours, options, and gesture conflicts.
- [Primitives renderer](./primitives.md) — shapes, connectors, markers, routers, anchors, decorations, badges.
- [Events](./events.md) — typed events + the tap channel for telemetry.
