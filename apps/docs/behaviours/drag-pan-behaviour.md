# DragPanBehaviour

Pointer-drag panning of the camera, via the pixi-viewport `drag` plugin. Optionally restricted to a modifier key (Space / Shift / Alt) so plain drag stays free for other gestures like lasso or rubber-band select. Includes a momentum / decelerate plugin by default.

## Usage

```ts
import { Canvas, DragPanBehaviour } from '@invana/canvas';

const canvas = await Canvas.init({ parent: document.body });

canvas.behaviours.register(
  new DragPanBehaviour({
    id: 'pan',
    enabled: true,
    modifier: 'none',        // 'none' | 'space' | 'shift' | 'alt'
    mouseButtons: 'left',    // 'all' | 'left' | 'right' | 'middle'
    decelerate: true,        // momentum after pointer lift
  }),
);
```

The advertised gesture string is `'drag'` for `modifier: 'none'`, otherwise `'${modifier}+drag'` (e.g. `'space+drag'`). The registry uses this for conflict warnings against other behaviours.

## Options

| Option | Type | Default | Notes |
|---|---|---|---|
| `id` | `string` | required | Behaviour id used by `canvas.behaviours.get(id)`. |
| `enabled` | `boolean` | `false` | Behaviours never auto-enable. Pass `true` or call `enable()` after registration. |
| `modifier` | `'none' \| 'space' \| 'shift' \| 'alt'` | `'none'` | Modifier required during drag. `'space'` matches Figma / Sketch behaviour. |
| `mouseButtons` | `'all' \| 'left' \| 'right' \| 'middle'` | `'left'` | Forwarded to pixi-viewport's `drag` plugin. |
| `decelerate` | `boolean` | `true` | Add momentum deceleration on pointer lift. |
| `shortcuts` | `string[]` | derived from `modifier` | Override the gesture string used for conflict warnings. |

## Lifecycle

| Method | Effect |
|---|---|
| `register(b)` | Stores `ctx`. Wiring is deferred to `enable()` so disabling fully drops the pixi-viewport plugins. |
| `enable()` | Calls `viewport.drag({ … })` and `viewport.decelerate()` (when enabled). |
| `disable()` | Removes the `drag` and `decelerate` plugins from the viewport. |

## Coexistence

- Pair with [`WheelZoomBehaviour`](/behaviours/wheel-zoom-behaviour) and [`PinchZoomBehaviour`](/behaviours/pinch-zoom-behaviour) for the standard mouse + trackpad camera-input set.
- Pair with [`DragShapeBehaviour`](/behaviours/drag-shape-behaviour) — it pauses this behaviour's `drag` plugin while a shape is being moved, so the camera doesn't pan during a shape drag.

## Related

- [Engine → Behaviours](/guide/behaviours) — lifecycle, authoring custom behaviours, conflict warnings.
- [`KeyboardCameraInputBehaviour`](/behaviours/keyboard-camera-input-behaviour) — keyboard equivalent (arrow keys pan).
