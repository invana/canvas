# Interface: PixiRendererOptions

`@invana/renderer-pixijs` — the PixiJS drawing backend for `@invana/canvas`.

**Everything that touches `pixi.js` in this repo lives here.** The engine
orchestrates, `@invana/graph` describes, this package draws.

```ts
import { Canvas } from '@invana/canvas-core';
import { PixiRenderer } from '@invana/renderer-pixijs';

const canvas = new Canvas();
await canvas.init({ container: el, renderer: new PixiRenderer({ events: canvas.events }) });
```

`renderer` is optional — omitting it makes `Canvas.init` resolve this package
with a lazy `import()`, which is why `@invana/canvas` declares it an
**optional peer** rather than a dependency (design D1, §4.6).

What is *not* here, deliberately: interaction state, the hit index (picking is
interaction, not drawing — D5), connector routing and path styles (geometry
answers must not need a backend — §5), and any domain concept. If something
here can only be expressed in pixi terms, that is a bug in the contract.

## Properties

### events

> **events**: [`CanvasEventBus`](../../../canvas/src/classes/CanvasEventBus.md)

The canvas-wide bus. A renderer publishes lifecycle and input onto it
(`canvas:renderer:fallback` when a WebGPU render crash forces a downgrade);
it never reads engine state from it.

***

### hitFloorPx?

> `optional` **hitFloorPx?**: `number`

Per-shape hit floor forwarded to each surface's primitives renderer. Engine
policy that surfaces need at construction; see `PrimitivesRendererOptions`.
