# Canvas

`Canvas` is the top-level orchestrator. It creates and wires all internal subsystems — renderer, camera, layer manager, plugin system, and event bus — then exposes only clean, typed handles.

## Constructor

```ts
new Canvas(options: CanvasOptions)
```

### `CanvasOptions`

| Property | Type | Default | Description |
|---|---|---|---|
| `container` | `HTMLElement` | required | DOM element the canvas is mounted into |
| `width` | `number` | `container.clientWidth \| 800` | Initial canvas width in pixels |
| `height` | `number` | `container.clientHeight \| 600` | Initial canvas height in pixels |
| `autoResize` | `boolean` | `true` | Automatically resize when the container changes size |
| `backgroundColor` | `string \| number` | `0x1a1a2e` | Renderer clear color |
| `antialias` | `boolean` | `true` | Enable antialiasing |
| `plugins` | `PluginConfig[]` | — | Plugins to register at init time |

## Lifecycle

```ts
const canvas = new Canvas({ container, width: 800, height: 600 });

// Must be awaited. Creates renderer, camera, layers, and registers options.plugins.
await canvas.init();
```

Never call any method on `canvas` before `init()` resolves.

## Public properties

| Property | Type | Description |
|---|---|---|
| `canvas.plugins` | `PluginSystem` | Register, retrieve, and manage plugins |
| `canvas.events` | `EventBus` | Typed event bus shared by all subsystems |
| `canvas.camera` | `CameraAPI` | Pan, zoom, fit, animate the viewport |
| `canvas.layers` | `LayerManager` | Show/hide/reorder z-ordered layers |

## Registering plugins after init

```ts
const canvas = new Canvas({ container });
await canvas.init();

// Register at any time after init
await canvas.plugins.register(new BackgroundPlugin({ type: 'solid', color: '#212121' }));
await canvas.plugins.register(new ShapePlugin());
```

## Passing plugins at construction time

```ts
const canvas = new Canvas({
  container,
  plugins: [
    new BackgroundPlugin({ type: 'pattern', patternType: 'grid' }),
  ],
});
await canvas.init();
// BackgroundPlugin is already registered when init() resolves
```

## Resize

By default (`autoResize: true`) the canvas observes the container element with a `ResizeObserver` and automatically keeps the renderer and camera in sync when the container changes size — no extra code needed.

```ts
// autoResize is true by default — nothing to do
const canvas = new Canvas({ container });
await canvas.init();
```

To manage resizing manually, opt out and call `canvas.resize()` yourself:

```ts
const canvas = new Canvas({ container, autoResize: false });
await canvas.init();

window.addEventListener('resize', () => {
  canvas.resize(container.clientWidth, container.clientHeight);
});
```

### `canvas:resize` event

Fired whenever the canvas is resized — whether by `autoResize` or a manual `canvas.resize()` call.

```ts
canvas.events.on('canvas:resize', ({ width, height }) => {
  console.log('canvas resized to', width, height);
});
```
