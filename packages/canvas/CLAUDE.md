# CLAUDE.md — packages/canvas (@invana/canvas)

Engine package. PixiJS is an internal implementation detail — never leaks to consumers.

## src layout

```
core/           Canvas.ts — lean orchestrator (~150 lines)
rendering/      Renderer.ts — internal PixiJS app wrapper (never exported)
camera/         CameraAPI.ts (interface), Camera.ts (impl)
layers/         types.ts, LayerManager.ts
plugins/        types.ts (CanvasPlugin/PluginContext), PluginSystem.ts
                builtin/  BackgroundPlugin
events/         EventBus.ts
graphics-utils/ shapes/, paths/, arrows/, labels/, effects/, fills/  ← INTERNAL ONLY
types/          canvas.ts, events.ts, index.ts
utils/          EventEmitter.ts
index.ts        public API surface
```

## Canvas init

```typescript
import { Canvas, BackgroundPlugin } from '@invana/canvas';

const canvas = new Canvas({ container, width: 800, height: 600, backgroundColor: '#1a1a2e' });
await canvas.init();

const bg = new BackgroundPlugin({ key: 'bg', type: 'pattern', patternType: 'dots', backgroundColor: '#1a1a2e' });
await canvas.plugins.register(bg);
```

## Public sub-systems

| Property | Type | Purpose |
|---|---|---|
| `canvas.camera` | `CameraAPI` | pan, zoom, fit, toWorld/toScreen, animate |
| `canvas.layers` | `LayerManager` | show/hide, opacity, zIndex |
| `canvas.plugins` | `PluginSystem` | register, get, unregister |
| `canvas.events` | `EventBus` | typed events, no raw PixiJS |

## CameraAPI

```typescript
canvas.camera.pan(dx, dy);
canvas.camera.panTo(worldX, worldY);
canvas.camera.zoom(scale);
canvas.camera.fitContent(padding);
canvas.camera.toWorld(screenX, screenY);   // → Point
canvas.camera.toScreen(worldX, worldY);    // → Point
canvas.camera.animate({ x, y, scale, duration });
```

## EventBus — key events

```typescript
canvas.events.on('camera:zoom', ({ scale, center }) => {});
canvas.events.on('canvas:clicked', ({ worldX, worldY, originalEvent }) => {});
canvas.events.on('plugin:registered', ({ pluginId }) => {});
canvas.events.on('layer:visibility-changed', ({ layerId, visible }) => {});
```

## Writing a plugin

```typescript
import type { CanvasPlugin, PluginContext } from '@invana/canvas';

export class MyPlugin implements CanvasPlugin {
  readonly id = 'my-plugin';

  register(ctx: PluginContext): void {
    const layer = ctx.createLayer({ id: 'my-layer', zIndex: 10 });
    ctx.events.on('canvas:clicked', ({ worldX, worldY }) => { /* draw on layer */ });
  }

  destroy(): void { /* cleanup */ }
}
```

## Rules

- `graphics-utils/` is **not** re-exported from `index.ts` — consumers use plugin API only.
- No `new Graphics()` / `new Container()` in plugin or story code.
- All PixiJS access lives inside `rendering/` and `graphics-utils/` only.
- tsup config: `entry: ['src/index.ts'], format: ['esm'], dts: true, external: ['pixi.js']`.
