# WheelZoomBehaviour

Scroll-wheel zooming around the cursor, via the pixi-viewport `wheel` plugin. By default any scroll wheel event zooms; flip `requireCtrl: true` for inline embeds where plain scroll should fall through to the page. Trackpad pinch is treated as zoom (not scroll) so two-finger pinch on macOS / Windows precision touchpads zooms the canvas.

## Usage

```ts
import { Canvas, WheelZoomBehaviour } from '@invana/canvas';

const canvas = await Canvas.init({ parent: document.body });

canvas.behaviours.register(
  new WheelZoomBehaviour({
    id: 'wheel-zoom',
    enabled: true,
    requireCtrl: false,      // true → only Ctrl+wheel zooms; plain scroll falls through
    percent: 0.1,            // 10% per tick
    smooth: false,           // false = snap; e.g. 8 = ease-out over 8 frames
  }),
);
```

The advertised gesture string is `'wheel'` (or `'ctrl+wheel'` when `requireCtrl: true`).

## Options

| Option | Type | Default | Notes |
|---|---|---|---|
| `id` | `string` | required | Behaviour id. |
| `enabled` | `boolean` | `false` | Pass `true` or call `enable()` after registration. |
| `requireCtrl` | `boolean` | `false` | If `true`, only `Ctrl+scroll` triggers zoom; plain scroll passes through to the browser. Recommended for inline canvases on a scrollable page. |
| `percent` | `number` | `0.1` | Zoom delta per wheel tick, as a fraction (`0.1` = 10%). |
| `smooth` | `false \| number` | `false` | `false` = instant snap. A positive integer (e.g. `8`) eases the zoom over that many frames. |
| `shortcuts` | `string[]` | derived | Override the gesture string used for conflict warnings. |

## Lifecycle

| Method | Effect |
|---|---|
| `register(b)` | Stores `ctx`. Wiring is deferred to `enable()`. |
| `enable()` | Calls `viewport.wheel({ percent, smooth, keyToPress?, trackpadPinch: true })`. |
| `disable()` | Removes the `wheel` plugin from the viewport. |

## Coexistence

- Pair with [`PinchZoomBehaviour`](/behaviours/pinch-zoom-behaviour) for native multi-touch pinch on touchscreens. The two cover different gestures: `WheelZoomBehaviour` handles trackpad pinch (which the OS reports as wheel events with `ctrlKey`), while `PinchZoomBehaviour` handles native touch pinch.
- Pair with [`DragPanBehaviour`](/behaviours/drag-pan-behaviour) for the standard drag-to-pan + wheel-to-zoom combo.

## Related

- [Engine → Behaviours](/guide/behaviours)
- [`PinchZoomBehaviour`](/behaviours/pinch-zoom-behaviour)
- [`KeyboardCameraInputBehaviour`](/behaviours/keyboard-camera-input-behaviour) — keyboard zoom via `+` / `-` / `0`.
