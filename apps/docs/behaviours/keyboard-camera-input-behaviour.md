# KeyboardCameraInputBehaviour

Keyboard-driven camera pan, zoom, and reset. Useful for accessibility and for power-user scenes.

Listens on `document`, so the canvas does not need keyboard focus. When the active `event.target` is an `<input>`, `<textarea>`, or `<select>` the keypress falls through unhandled — typing into form fields never moves the camera.

Arrow-key direction follows the **scroll metaphor**: `ArrowUp` pans the viewport so you see content *above* the current view (i.e. the camera moves down by `panStep` world pixels).

## Usage

```ts
import { Canvas, KeyboardCameraInputBehaviour } from '@invana/canvas';

const canvas = await Canvas.init({ parent: document.body });

canvas.behaviours.register(
  new KeyboardCameraInputBehaviour({
    id: 'keyboard',
    enabled: true,
    panStep: 40,              // pixels per arrow press
    zoomFactor: 1.1,          // 10% per +/- press
    keymap: {                 // each field merges with the defaults
      panUp:    ['ArrowUp', 'KeyW'],
      panDown:  ['ArrowDown', 'KeyS'],
      panLeft:  ['ArrowLeft', 'KeyA'],
      panRight: ['ArrowRight', 'KeyD'],
    },
  }),
);
```

## Default keymap

| Action | Keys |
|---|---|
| Pan up | `ArrowUp` |
| Pan down | `ArrowDown` |
| Pan left | `ArrowLeft` |
| Pan right | `ArrowRight` |
| Zoom in | `+`, `=`, `NumpadAdd` |
| Zoom out | `-`, `NumpadSubtract` |
| Reset zoom to 1:1 | `0`, `Numpad0` |

`keymap` is shallow-merged with the defaults — overriding `panUp` does not affect `zoomIn`. Each entry accepts both `KeyboardEvent.key` values (e.g. `'ArrowUp'`, `'+'`) and `KeyboardEvent.code` values (e.g. `'KeyW'`, `'NumpadAdd'`).

## Options

| Option | Type | Default | Notes |
|---|---|---|---|
| `id` | `string` | required | Behaviour id. |
| `enabled` | `boolean` | `false` | Pass `true` or call `enable()` after registration. |
| `panStep` | `number` | `40` | Pan distance per key press in **screen pixels** (camera converts to world units internally). |
| `zoomFactor` | `number` | `1.1` | Multiplier per zoom press. `1.1` = 10% in / out. |
| `keymap` | `Partial<KeyboardCameraKeymap>` | see above | Override individual key groups. Merged with defaults. |
| `shortcuts` | `string[]` | union of all configured keys | Override the gesture strings used for conflict warnings. |

## Lifecycle

| Method | Effect |
|---|---|
| `register(b)` | Stores `ctx`. Wiring is deferred to `enable()`. |
| `enable()` | Adds a `keydown` listener on `document`. |
| `disable()` | Removes the `keydown` listener. |

## Related

- [Engine → Behaviours](/guide/behaviours)
- [`DragPanBehaviour`](/behaviours/drag-pan-behaviour) — pointer equivalent for pan.
- [`WheelZoomBehaviour`](/behaviours/wheel-zoom-behaviour) — pointer equivalent for zoom.
