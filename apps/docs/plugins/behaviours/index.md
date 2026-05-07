# Behaviours

Camera-input behaviours that ship with `@invana/canvas`. Each one is opt-in — register *and* enable it explicitly. Nothing here auto-enables.

| Behaviour | Description |
|---|---|
| [`DragPanBehaviour`](./drag-pan) | Pointer-drag panning with optional modifier key (Space / Shift / Alt) and momentum |
| [`WheelZoomBehaviour`](./wheel-zoom) | Scroll-wheel zoom, with optional Ctrl-gating |
| [`PinchZoomBehaviour`](./pinch-zoom) | Two-finger pinch-to-zoom for touch and trackpad |
| [`KeyboardCameraInputBehaviour`](./keyboard-camera-input) | Arrow-key pan plus `+`/`-`/`0` zoom, with a configurable keymap |

## Registration pattern

```ts
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';

const canvas = new Canvas({ /* ... */ });

const drag = new DragPanBehaviour({ id: 'drag-pan' });
const wheel = new WheelZoomBehaviour({ id: 'wheel-zoom' });

canvas.behaviours.add(drag);
canvas.behaviours.add(wheel);

drag.enable();
wheel.enable();
```

A Behaviour's job is to translate input into state mutations. It does not render. It does not own data. See the [Behaviours concept guide](/guide/behaviours) for the architectural rationale.
