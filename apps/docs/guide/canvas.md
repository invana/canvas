# Canvas & Camera

`Canvas` is the engine root. It owns the pixi `Application`, the single RAF tick, the camera, the registries, and the event bus. `Camera` is a typed pan/zoom/projection facade over the underlying `pixi-viewport` `Viewport`.

## Creating a Canvas

```ts
import { Canvas } from '@invana/canvas';

const canvas = new Canvas({ id: 'main' });
```

The constructor is synchronous and lightweight — it builds the event bus but no pixi resources. The full set of `CanvasOptions`:

| Option | Default | Description |
|---|---|---|
| `id` | `'canvas'` | Stable identifier used as the source id on event envelopes. Override when running multiple Canvas instances in one document. |
| `container` | — | DOM element pixi mounts its `<canvas>` into. Required by `init()`. |
| `preference` | `'webgpu'` | Preferred renderer backend (`'webgpu' \| 'webgl' \| 'canvas'`). Pixi falls back via its own logic. |
| `width` / `height` | `container.clientWidth` / `clientHeight` | Viewport size in CSS pixels. |
| `resolution` | `window.devicePixelRatio` | Device pixel ratio. |
| `antialias` | `true` | GPU MSAA. Auto-disabled on the Canvas backend. |
| `opaque` | `false` | `true` skips per-frame alpha blend. |
| `backgroundColor` | `0` | Only visible when `opaque: true`. |
| `powerPreference` | `'high-performance'` | GPU power hint. |
| `hello` | `false` | Suppress pixi's "PixiJS X.X.X" startup log. |
| `autoResize` | `false` | Track container size with `ResizeObserver` and keep the renderer + camera in sync. |

## Two init paths

### Production: `canvas.init(opts)`

Creates a pixi `Application`, mounts its canvas into `opts.container`, wires the ticker, and fires `'renderer:initialised'` on the bus.

```ts
await canvas.init({
  container: document.getElementById('canvas-root')!,
  preference: 'webgpu',
  antialias: true,
  autoResize: true,
});

console.log(canvas.isInitialised); // true
console.log(canvas.application);   // pixi Application
```

### Headless / tests: `canvas.initWithStage(stage, w, h)`

Skips pixi's `Application`. Caller supplies a pre-built `Container` as the stage. Useful for unit tests of the layer / behaviour / dirty / state pipeline without a GPU renderer.

```ts
import { Container } from 'pixi.js';

const stage = new Container();
canvas.initWithStage(stage, 800, 600);
```

## What's available after init

| Field | Type | Notes |
|---|---|---|
| `canvas.world` | `Container` (a `pixi-viewport` `Viewport`) | World root. Camera-transformed. `WorldLayer`s mount roots here. |
| `canvas.stage` | `Container` | The pixi stage. `ScreenLayer`s mount roots here directly. |
| `canvas.camera` | `Camera` | Pan / zoom / projection API. |
| `canvas.layers` | `LayerRegistry` | `add`, `remove`, `get<T>(id)`, `byZOrder()`. |
| `canvas.behaviours` | `BehaviourRegistry` | `register`, `unregister`, `setEnabled`, `get<T>(id)`. |
| `canvas.events` | `CanvasEventBus` | Typed events + tap channel. |
| `canvas.context` | `CanvasContext` | Bundled handle handed to every layer / behaviour at mount. |

## The tick

`canvas.tickOnce(dt?)` runs a single frame manually — useful in tests. In production pixi's `Ticker` calls `tick` for you once per `requestAnimationFrame`.

Per tick:

1. `camera.tick(dt)` — advances pixi-viewport animation plugins (decelerate, snap).
2. Walk `layers.byZOrder()`.
3. Skip invisible layers; flush dirty ones; tick layer animations.

## Teardown

```ts
canvas.destroy();
```

Idempotent. Unmounts every layer (which destroys their pixi roots), destroys every behaviour, drops bus subscriptions, destroys the pixi `Application`.

---

## Camera

`canvas.camera` is the projection API. All transform math delegates to the underlying `Viewport`; reach for `canvas.camera.viewport` only when you need a pixi-viewport-specific method (`viewport.drag`, `viewport.snap`, etc. — that's what behaviours do).

### Reading

```ts
canvas.camera.scale;          // current uniform scale (number)
canvas.camera.x;              // world-origin x in screen pixels
canvas.camera.y;              // world-origin y in screen pixels
canvas.camera.screenWidth;    // current viewport width
canvas.camera.screenHeight;   // current viewport height
canvas.camera.getVisibleBounds(); // world-space rect currently in view
```

### Panning

```ts
canvas.camera.pan(dx, dy);            // by delta in screen pixels
canvas.camera.setPosition(x, y);      // absolute world-origin offset
```

### Zooming

```ts
canvas.camera.setZoom(2);             // absolute, anchored at viewport centre
canvas.camera.zoomAt(1.2, sx, sy);    // multiply by factor, anchor at screen (sx, sy)
```

`zoomAt` holds the world point under the screen anchor in place — the gesture every mouse-wheel zoom expects.

### Fitting

```ts
canvas.camera.fitContent(worldRect, padding);
```

Scales so the rect is fully visible (limited by the smaller axis), centres it. `padding` is in screen pixels — defaults to `24`.

### Projection

```ts
const { x: wx, y: wy } = canvas.camera.toWorld(screenX, screenY);
const { x: sx, y: sy } = canvas.camera.toScreen(worldX, worldY);
```

Uniform scale, no rotation:

```
screen.x = world.x * scale + tx
screen.y = world.y * scale + ty
```

### Resize

```ts
canvas.camera.resize(800, 600);
```

Called automatically when `autoResize: true`. Forwards to the underlying viewport so its hit-area and plugin math stay correct.

### Clamping

`minScale` / `maxScale` are clamped at construction (`0.01` / `100` by default). `setZoom`, `zoomAt`, and `fitContent` all clamp before assigning — so you cannot zoom past the configured limits regardless of which path you reach for.

## Events fired by the camera

| Event | Payload | When |
|---|---|---|
| `'camera:pan'` | `{ x, y }` | Any pan, including via `pixi-viewport` plugins. |
| `'camera:zoom'` | `{ scale, centerX, centerY }` | Any zoom. |
| `'renderer:initialised'` | `{ backend, capabilities }` | Once `init` / `initWithStage` completes. |

Both pan and zoom flow through the tap channel — telemetry sees every camera change.
