# Getting Started

This guide stands up a `Canvas`, mounts a `Layer`, draws two shapes and a connector between them, and wires camera input. By the end you have a working pan-and-zoom scene.

If what you actually want is a **graph** — nodes, edges, a layout that places them — skip to [Track 2](#track-2-a-graph-in-react). The engine track below is what you use when you are drawing something that is *not* a graph, or authoring your own layer.

## Installation

```bash
npm install @invana/canvas
# or
pnpm add @invana/canvas
```

That is the whole install for the engine track. `pixi.js` arrives transitively: `@invana/canvas` depends on `@invana/renderer-pixijs` (the drawing backend), which depends on `pixi.js`. You do **not** install pixi yourself, and you never import it.

::: warning ESM only
Every published `@invana/*` package is ESM only — `"type": "module"`, an ESM build, and an `exports` map with no `require` condition. Bundlers and modern Node handle this transparently; `require()` works on **Node 20.19+ / 22.12+** (via `require(esm)`) and fails below that. There is no CJS build and there will not be one — a second build across lockstep packages would let a consumer mixing `require` and `import` load two copies of the registries and the spec store.
:::

## What you import from where

`@invana/canvas` has a **single entry point**. There is no `@invana/canvas/primitives` subpath — the exports map has only `.`.

| Package | You import it when |
|---|---|
| `@invana/canvas` | Always on the engine track. `Canvas`, `Camera`, `Layer` / `WorldLayer` / `ScreenLayer`, `Behaviour` + the built-in behaviours, `BackgroundLayer` / `DevInfoLayer` / `LayersPanelLayer`, the registries, the event bus, the spec vocabulary, and the store. It re-exports the whole `@invana/canvas-core` surface, so one import covers the engine. |
| `@invana/renderer-pixijs` | Rarely — for backend-shaped helpers the contract doesn't carry, e.g. `arrowMarkerSpec`. |
| `@invana/graph` | Nodes and edges: `GraphCanvas`, `GraphLayer`, `MiniMapLayer`, and the graph behaviours. |
| `@invana/graph-layout-*` | One layout algorithm each — `d3-force`, `elkjs`, `d3-hierarchy`, `d3-sankey`, `geometric`. |
| `@invana/canvas-react` | Declarative React roots and hooks (headless — draws no UI of its own). |
| `@invana/canvas-ui` | The React UI kit — toolbars, panels, settings editors, `GraphCanvasApp`. |

You should never need `@invana/canvas-core` or `@invana/canvas-store` directly; `@invana/canvas` re-exports both.

## Track 1 — the engine

### Step 1 — create and initialise the Canvas

`Canvas` is the engine root. It owns the tick loop, the camera, the registries, the event bus, and the renderer lifecycle — but no drawing library: the backend stands the surface up behind the `IRenderer` contract.

```ts
import { Canvas } from '@invana/canvas';

const canvas = new Canvas({ id: 'main' });

await canvas.init({
  container: document.getElementById('canvas-root')!,
  preference: 'webgpu', // 'webgpu' (default) | 'webgl' | 'canvas'
  autoResize: true,
});
```

`init` is async because renderer creation is async. Once it resolves, `canvas.camera`, `canvas.layers`, `canvas.behaviours`, and `canvas.events` are live.

`preference` reaches the backend verbatim: `'canvas'` mounts the 2D backend rather than being folded into `'webgl'`. Listen for which backend actually mounted:

```ts
canvas.events.on('canvas:renderer:ready', ({ backend, capabilities }) => {
  console.log(`rendering on ${backend}`, capabilities);
});
```

PixiJS's WebGPU renderer can crash at *render* time on some driver combinations, which no init-time guard catches. When that happens the engine halts its loop and emits `'canvas:renderer:fallback'` so the host can degrade to WebGL — `@invana/canvas-react`'s `<Canvas>` does this for you.

### Step 2 — define a Layer

Diagram content lives on a `WorldLayer` — camera-affected, panning and zooming with the view. A layer never constructs a display object. It asks its **surface** for a drawing device (`this.surface.primitives`, an `IElementRenderer`) and adds shapes and connectors through it.

```ts
import { WorldLayer, type IElementRenderer } from '@invana/canvas';

class DemoLayer extends WorldLayer {
  renderer!: IElementRenderer;

  protected createState() {
    return {};
  }

  protected onMount(): void {
    this.renderer = this.surface.primitives;

    this.renderer.addShape('a', {
      kind: 'circle',
      x: -150, y: 0,
      radius: 28,
      fill: { kind: 'solid', color: 0x4f9cf9 },
      stroke: { color: 0x1e40af, width: 2 },
    });

    this.renderer.addShape('b', {
      kind: 'rect',
      x: 90, y: -24,
      width: 120, height: 48,
      cornerRadius: 8,
      fill: { kind: 'solid', color: 0x10b981 },
    });

    this.renderer.addConnector('a-to-b', {
      kind: 'connector',
      router: 'straight',
      source: { kind: 'shape', shapeId: 'a', anchor: 'boundary' },
      target: { kind: 'shape', shapeId: 'b', anchor: 'boundary' },
      stroke: { color: 0x111827, width: 2 },
    });
  }

  hitTest() {
    return null;
  }
}
```

Two things worth naming:

- **`fill` is a paint object**, not a bare colour: `{ kind: 'solid', color: 0x4f9cf9 }`.
- **Draw order is layer order.** For edges below nodes, use two `WorldLayer` instances, not one layer with internal z-fiddling.

For transient gesture visuals (a hover outline, a marquee box) reach for `this.surface.overlay('label')` instead — anything durable is a spec.

### Step 3 — mount the Layer

```ts
const demo = new DemoLayer({ id: 'demo', options: {} });
canvas.layers.add(demo);
```

`LayerRegistry.add` calls `layer.mount(ctx)`, fires `layer:added` on the bus, and the next tick draws what you registered.

### Step 4 — fit the camera to content

```ts
canvas.camera.fitContent(demo.getBounds(), 100);
```

The `100` is screen-pixel padding around the bounding rect.

### Step 5 — register and enable behaviours

Behaviours never auto-enable. Register each one, then enable it explicitly.

```ts
import {
  DragPanBehaviour,
  WheelZoomBehaviour,
  PinchZoomBehaviour,
  KeyboardCameraInputBehaviour,
} from '@invana/canvas';

canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
canvas.behaviours.register(new WheelZoomBehaviour({ id: 'wheel-zoom', enabled: true }));
canvas.behaviours.register(new PinchZoomBehaviour({ id: 'pinch-zoom', enabled: true }));
canvas.behaviours.register(new KeyboardCameraInputBehaviour({ id: 'keyboard', enabled: true }));
```

Toggle later with `canvas.behaviours.setEnabled('pan', false)`.

### Step 6 — tear down

```ts
canvas.destroy();
```

`destroy` is idempotent: it unmounts every layer, destroys every behaviour, clears bus subscriptions, and tears the renderer down.

## Track 2 — a graph in React

For nodes and edges, `@invana/graph` supplies the domain layer and `@invana/canvas-react` the declarative root. Install those alongside their peers (`react`, `react-dom`, `pixi.js`, and the layout packages you use — see `@invana/canvas-react`'s `peerDependencies` for the current list):

```bash
npm install @invana/canvas @invana/graph @invana/canvas-react \
            @invana/graph-layout-d3-force pixi.js react react-dom
```

You pass plain `{ nodes, edges }` JSON with **no positions** — `<GraphCanvas>` auto-runs `config.activeLayout`, and the layout places every node:

```tsx
import {
  GraphCanvas,
  GraphLayer,
  BackgroundLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
  D3ForceLayout,
} from '@invana/canvas-react';
import type { CanvasConfig } from '@invana/canvas';
import type { GraphData } from '@invana/graph';

const DATA: GraphData = {
  nodes: [
    { id: 'hub', type: 'Hub' },
    { id: 'a', type: 'Leaf' },
    { id: 'b', type: 'Leaf' },
  ],
  edges: [
    { id: 'e-a', source: 'hub', target: 'a', type: 'LINK' },
    { id: 'e-b', source: 'hub', target: 'b', type: 'LINK' },
  ],
};

// `activeLayout` names the layout to run; the id matches <D3ForceLayout id="force">.
const CONFIG: CanvasConfig = {
  activeLayout: 'force',
  layouts: { force: { charge: { strength: -220 }, link: { distance: 80 } } },
};

export function App() {
  return (
    <GraphCanvas autoResize config={CONFIG}>
      <BackgroundLayer id="bg" type="pattern" patternType="dots" />
      {/* The GraphLayer must be declared before the layout that targets it. */}
      <GraphLayer id="graph" data={DATA} />
      <D3ForceLayout id="force" targetLayerId="graph" />
      <DragPanBehaviour id="pan" />
      <WheelZoomBehaviour id="wheel" />
    </GraphCanvas>
  );
}
```

`type` is **required** on every node and edge. For a full application shell — toolbars, panels, settings editors — reach for `GraphCanvasApp` from `@invana/canvas-ui`, which is built on this same root.

## Where to next

- [Architecture](./architecture.md) — the Layer / Behaviour / Layout / Renderer mental model.
- [Packages](./packages.md) — what each package is and when you need it.
- [Canvas & Camera](./canvas.md) — engine root and projection.
- [Layers](./layers.md) — `WorldLayer` vs `ScreenLayer`, picking the right base.
- [Behaviours](./behaviours.md) — the built-in input behaviours, options, and gesture conflicts.
- [Primitives](./primitives.md) — shapes, connectors, markers, routers, anchors, decorations, badges.
- [Events](./events.md) — typed events and the tap channel for telemetry.
- [API Reference](/api/) — generated from the source.
