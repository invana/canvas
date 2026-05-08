# DevInfoLayer

A glued-to-corner overlay showing FPS, camera position/zoom, and draw-call counts. Extends `ScreenLayer`, so it stays anchored to a screen corner regardless of camera.

Useful during development. Add it once and forget about it.

::: warning Status
Planned. Not yet implemented in `@invana/canvas`.
:::

## Planned shape

```ts
import { DevInfoLayer } from '@invana/canvas';

canvas.layers.add(new DevInfoLayer({
  id: 'dev-info',
  zIndex: 9999,
  corner: 'top-right',  // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}));
```

See [Layers overview](./).
