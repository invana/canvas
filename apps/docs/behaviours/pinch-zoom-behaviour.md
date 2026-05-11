# PinchZoomBehaviour

Two-finger pinch-to-zoom for native touch input, via the pixi-viewport `pinch` plugin. Handles real touch pinches; trackpad pinch on macOS / Windows precision touchpads is delivered to the browser as wheel events and is handled by [`WheelZoomBehaviour`](/behaviours/wheel-zoom-behaviour) instead — pair the two for full coverage across touchscreens, touchpads, and mice.

By default a pinch both zooms and centres the viewport on the midpoint between the two fingers. Set `noDrag: true` if you have a separate [`DragPanBehaviour`](/behaviours/drag-pan-behaviour) and don't want the pinch to also pan.

## Usage

```ts
import { Canvas, PinchZoomBehaviour } from '@invana/canvas';

const canvas = await Canvas.init({ parent: document.body });

canvas.behaviours.register(
  new PinchZoomBehaviour({
    id: 'pinch-zoom',
    enabled: true,
    noDrag: false,           // true = pinch only zooms, doesn't centre
    percent: 0.1,
  }),
);
```

The advertised gesture string is `'pinch'`.

## Options

| Option | Type | Default | Notes |
|---|---|---|---|
| `id` | `string` | required | Behaviour id. |
| `enabled` | `boolean` | `false` | Pass `true` or call `enable()` after registration. |
| `noDrag` | `boolean` | `false` | Suppress the implicit pan that accompanies a pinch. Useful when a separate `DragPanBehaviour` already handles panning. |
| `percent` | `number` | `0.1` | Zoom-speed multiplier. |
| `shortcuts` | `string[]` | `['pinch']` | Override the gesture string used for conflict warnings. |

## Lifecycle

| Method | Effect |
|---|---|
| `register(b)` | Stores `ctx`. Wiring is deferred to `enable()`. |
| `enable()` | Calls `viewport.pinch({ noDrag, percent })`. |
| `disable()` | Removes the `pinch` plugin from the viewport. |

## Coexistence

- Pair with [`WheelZoomBehaviour`](/behaviours/wheel-zoom-behaviour) so trackpad pinch and touchscreen pinch both work.
- Pair with [`DragPanBehaviour`](/behaviours/drag-pan-behaviour). When both are enabled, set `noDrag: true` here so pinch only zooms and `DragPanBehaviour` owns the pan gesture.

## Related

- [Engine → Behaviours](/guide/behaviours)
- [`WheelZoomBehaviour`](/behaviours/wheel-zoom-behaviour)
