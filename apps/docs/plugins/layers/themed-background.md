# ThemedBackgroundLayer

A `BackgroundLayer` variant that resolves its colors from the active theme rather than taking literal hex values. Extends `WorldLayer`.

::: warning Status
Planned. Not yet implemented in `@invana/canvas`.
:::

## Planned shape

```ts
import { ThemedBackgroundLayer } from '@invana/canvas/toolkit';

canvas.layers.add(new ThemedBackgroundLayer({
  id: 'background',
  zIndex: -1000,
  pattern: 'grid',
  // colors pulled from the active theme tokens
}));
```

See [Layers overview](./).
