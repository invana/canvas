# CLAUDE.md — @invana/canvas

High-performance WebGPU-first canvas rendering engine and graph visualization toolkit. WebGL2 fallback is automatic. Built as a pnpm monorepo with Turbo.

---

## Refactor Status

**Active branch: `version/redesign`**

A parallel new architecture is being built without disturbing anything that already works:

| Path | Package | Purpose | Status |
|---|---|---|---|
| `packages/canvas-core` | `@invana/canvas-core` | Legacy engine (do not break) | Stable |
| `packages/canvas-core-new` | `@invana/canvas-core-new` | New architecture (active development) | In progress |
| `apps/storybook` | `@canvas/storybook` | Legacy stories (port 6006) | Stable |
| `apps/storybook-new` | `@canvas/storybook-new` | New-arch stories (port 6007) | In progress |

**All new work goes into `canvas-core-new` + `storybook-new`. Do not modify `canvas-core` or `storybook`.**

### New Architecture Goals (docs/architecture-plan.md)

1. **Hide PixiJS behind the public API** — no `pixi.js` imports for consumers; `CameraAPI` interface instead of pixi-viewport class; no raw `Container`/`Graphics` in plugin signatures.
2. **Rename `primitives/` → `graphics-utils/`** — internal only, not exported.
3. **Full typed event system** — `EventBus<CanvasEventMap>`, all payloads typed, no `any`; `camera:*` replaces `viewport:*`.
4. **Lean Canvas orchestrator** (~150 lines) delegates to: `Renderer` (internal), `Camera`, `LayerManager`, `PluginSystem`, `EventBus`.
5. **Split graph viz into `packages/graph-canvas`** (`@invana/graph-canvas`) — `GraphDataPlugin`, all node/edge elements, interaction plugins live there. `canvas-core-new` stays generic.
6. **pixi.js upgraded to `^8.18.1`**.
7. Performance (implemented progressively): `cullable`, `cacheAsTexture`, `renderGroup`, dirty-flag batching, RBush culling, LOD by zoom, RenderTexture pooling, WebWorker layout, GPU instancing.

---

## Monorepo Structure

```
packages/
  canvas-core/         @invana/canvas-core      — legacy engine (stable, do not touch)
  canvas-core-new/     @invana/canvas-core-new  — NEW architecture (active)
  canvas-utils/        @invana/canvas-utils      — math, color, geometry utilities
  layouts-d3-force/    @invana/layouts-d3-force  — D3 force layout plugin
  example-datasets/    @invana/example-datasets  — sample graph datasets
  typescript-config/   @repo/typescript-config   — shared tsconfig
  eslint-config/       @repo/eslint-config       — shared ESLint config
apps/
  storybook/           @canvas/storybook         — legacy stories (port 6006, stable)
  storybook-new/       @canvas/storybook-new     — NEW stories (port 6007, active)
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

# Run legacy storybook
pnpm --filter @canvas/storybook dev      # → http://localhost:6006

# Run new storybook
pnpm --filter @canvas/storybook-new dev  # → http://localhost:6007

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
pnpm --filter @invana/canvas-core-new build
pnpm --filter @canvas/storybook-new dev
```

---

## New Architecture (canvas-core-new)

### canvas-core-new/src layout

```
core/           Canvas.ts — lean orchestrator (~150 lines)
rendering/      Renderer.ts — internal PixiJS Application wrapper (never exported)
camera/         CameraAPI.ts (interface), Camera.ts (implementation)
layers/         types.ts (Layer / LayerManager interfaces), LayerManager.ts
plugins/        types.ts (CanvasPlugin / PluginContext), PluginSystem.ts
                builtin/  BackgroundPlugin
events/         EventBus.ts
graphics-utils/ shapes/, paths/, arrows/, labels/, effects/, fills/
                (internal only — not re-exported from index.ts)
types/          canvas.ts, events.ts, index.ts
utils/          EventEmitter.ts
index.ts        public exports
```

### Canvas initialisation (new API)

```typescript
import { Canvas, BackgroundPlugin } from '@invana/canvas-core-new';

const canvas = new Canvas({
  container,
  width: 800,
  height: 600,
  backgroundColor: '#1a1a2e',
});

await canvas.init();

// Plugins are instances, not string keys
const bg = new BackgroundPlugin({
  key: 'bg',
  type: 'pattern',
  patternType: 'dots',
  backgroundColor: '#1a1a2e',
});
await canvas.plugins.register(bg);
```

### Public sub-systems

| Property | Type | Notes |
|---|---|---|
| `canvas.camera` | `CameraAPI` | pan, zoom, fit, toWorld/toScreen |
| `canvas.layers` | `LayerManager` | show/hide layers, set opacity/zIndex |
| `canvas.plugins` | `PluginSystem` | register, get, unregister |
| `canvas.events` | `EventBus` | typed event bus, no PixiJS events |

### CameraAPI

```typescript
canvas.camera.pan(dx, dy);
canvas.camera.panTo(worldX, worldY);
canvas.camera.zoom(scale);
canvas.camera.fitContent(padding);
canvas.camera.toWorld(screenX, screenY);  // → Point
canvas.camera.toScreen(worldX, worldY);  // → Point
canvas.camera.animate({ x, y, scale, duration });
```

### Event bus

```typescript
canvas.events.on('camera:zoom', ({ scale, center }) => { ... });
canvas.events.on('canvas:clicked', ({ worldX, worldY, originalEvent }) => { ... });
canvas.events.on('plugin:registered', ({ pluginId }) => { ... });
canvas.events.on('layer:visibility-changed', ({ layerId, visible }) => { ... });
```

### Writing a plugin

```typescript
import type { CanvasPlugin, PluginContext } from '@invana/canvas-core-new';

export class MyPlugin implements CanvasPlugin {
  readonly id = 'my-plugin';

  register(ctx: PluginContext): void {
    const layer = ctx.createLayer({ id: 'my-layer', zIndex: 10 });
    ctx.events.on('canvas:clicked', ({ worldX, worldY }) => {
      // draw on layer ...
    });
  }

  destroy(): void { /* cleanup */ }
}
```

---

## Legacy API (canvas-core — do not change)

### Canvas initialization

```typescript
import { Canvas, GraphDataPlugin } from '@invana/canvas-core';

const canvas = new Canvas({
  container,
  width: 800,
  height: 600,
  behavior: 'default',
  plugins: [
    { plugin: 'background', key: 'my-bg', options: { type: 'pattern', patternType: 'dots', backgroundColor: '#212121' } }
  ]
});

await canvas.init();

const graphPlugin = new GraphDataPlugin({ fitOnRender: true, fitPadding: 50 });
await canvas.registerPlugin(graphPlugin);
```

### Graph data

```typescript
graphPlugin.setData({
  nodes: [{ id: 'n1', x: 0, y: 0, shape: 'circle', size: 40, label: 'Node' }],
  edges: [{ id: 'e1', source: 'n1', target: 'n2', pathType: 'bezier' }]
});
```

---

## Build System

All packages use **tsup** outputting ES modules with `.d.ts` and sourcemaps. `pixi.js` is kept external.

```typescript
// tsup.config.ts pattern
{
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  external: ['pixi.js']
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

## Storybook (new — storybook-new)

Stories live in `apps/storybook-new/stories/` mirroring the same folder structure:

```
canvas/
  usage/          — simple-usage, multiple-instances
  styling/        — theming, background
  animation/      — camera animations
plugins/          — plugin demos
```

Dev server: `pnpm --filter @canvas/storybook-new dev` → http://localhost:6007

Story pattern — use `createContainer()` from `src/div-utils.ts`:

```typescript
import { Canvas } from '@invana/canvas-core-new';
import { createContainer } from '../../../src/div-utils.js';

export const MyStory: Story = {
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;
    const canvas = new Canvas({ container });
    await canvas.init();
    // ...
  }
};
```

---

## Coding Instructions

1. **New work only in `canvas-core-new` and `storybook-new`**. Never modify `canvas-core` or `storybook`.
2. **No PixiJS imports in plugins or stories** — use only the public API from `@invana/canvas-core-new`.
3. **No direct access to `this._viewport`, `this._renderer`, or raw `Container`/`Graphics`** outside of `canvas-core-new` internals.
4. **For drawing graphics, use `graphics-utils/`** functions — never call `new Graphics()` or `new Container()` directly in plugins.
5. **Events go through `canvas.events`** (`EventBus`) — never subscribe to raw PixiJS events from outside the core.
6. **Plugins implement `CanvasPlugin`** interface: `id`, `register(ctx)`, `destroy()`.
7. **`graphics-utils/` is internal only** — it is not re-exported from `index.ts`.
