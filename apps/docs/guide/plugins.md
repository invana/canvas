# Plugin System

Every feature in `@invana/canvas` is a plugin. The `PluginSystem` (exposed as `canvas.plugins`) manages registration, lifecycle, and retrieval.

## The `CanvasPlugin` interface

Every plugin must implement this interface:

```ts
interface CanvasPlugin {
  readonly id: string;
  register(ctx: PluginContext): void | Promise<void>;
  destroy(): void;
  enable?(): void;   // optional
  disable?(): void;  // optional
}
```

| Method | Required | Description |
|---|---|---|
| `id` | yes | Unique string identifier for this plugin instance |
| `register(ctx)` | yes | Called once when the plugin is added. Set up layers, subscriptions, etc. |
| `destroy()` | yes | Called when the plugin is removed or canvas is destroyed |
| `enable()` | no | Resume the plugin without full re-registration |
| `disable()` | no | Pause the plugin without destroying it |

## `PluginContext`

`register(ctx)` receives a `PluginContext` with safe handles to all canvas subsystems:

```ts
interface PluginContext {
  camera: CameraAPI;
  layers: LayerManager;
  events: EventBus;
  canvasElement: HTMLCanvasElement;
  createLayer(options: { id: string; zIndex: number; label?: string }): Container;
  createScreenLayer(options: { id: string; zIndex: number }): Container;
}
```

No raw PixiJS objects are exposed except the opaque `Container` returned by `createLayer` / `createScreenLayer` — which plugins receive only to attach their own graphics.

## Registering plugins

```ts
// After canvas.init()
await canvas.plugins.register(new BackgroundPlugin({ type: 'solid' }));
```

Throws if the plugin `id` is already registered, or if `canvas.init()` has not been called.

## Retrieving a plugin

```ts
const bg = canvas.plugins.get<BackgroundPlugin>('background');
```

Returns `undefined` if not found. Cast to a specific type with the generic parameter.

## Checking and listing

```ts
canvas.plugins.has('background');  // boolean
canvas.plugins.list();             // CanvasPlugin[]
```

## Enable / disable

```ts
canvas.plugins.setEnabled('background', false); // calls plugin.disable() if implemented
canvas.plugins.setEnabled('background', true);  // calls plugin.enable() if implemented
```

## Unregistering

```ts
await canvas.plugins.unregister('background');
// plugin.destroy() is called; 'plugin:destroyed' is emitted
```

## Writing a custom plugin

```ts
import type { CanvasPlugin, PluginContext } from '@invana/canvas';

export class MyPlugin implements CanvasPlugin {
  readonly id = 'my-plugin';
  private _ctx!: PluginContext;

  register(ctx: PluginContext): void {
    this._ctx = ctx;
    const layer = ctx.createLayer({ id: 'my-layer', zIndex: 15 });
    // attach your graphics to `layer`
    ctx.events.on('canvas:clicked', (e) => {
      console.log('canvas clicked at', e.worldX, e.worldY);
    });
  }

  destroy(): void {
    // clean up subscriptions, graphics, etc.
  }
}

await canvas.plugins.register(new MyPlugin());
```
