# BackgroundLayer

A camera-affected backdrop — solid color, grid, or dot pattern — that pans and zooms with the rest of the world. Extends `WorldLayer`.

::: warning Status
Planned. Not yet implemented in `@invana/canvas`. Use a custom `WorldLayer` subclass in the meantime.
:::

## Planned shape

```ts
import { BackgroundLayer } from '@invana/canvas/toolkit';

canvas.layers.add(new BackgroundLayer({
  id: 'background',
  zIndex: -1000,
  pattern: 'grid',     // 'solid' | 'grid' | 'dots'
  color: 0xfafafa,
  gridSize: 24,
  gridColor: 0xe5e5e5,
}));
```

See [Layers overview](./).
