# Behaviours

A **Behaviour** subscribes to input and translates it into state mutations. Behaviours never render and never own data — that is what `Layer`s and `PrimitivesRenderer` are for.

This section catalogues the built-in behaviours that ship with `@invana/canvas`. For the conceptual deep-dive on the lifecycle, the registry, gesture-conflict warnings, and authoring custom behaviours see [Engine → Behaviours](/guide/behaviours).

## Opt-in policy

Every built-in behaviour has `enabled: false` at construction unless you pass `enabled: true`. There is no auto-activation. Register on `canvas.behaviours`, then call `enable()` (or pass `enabled: true` up front).

```ts
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';

const canvas = await Canvas.init({ parent: document.body });

canvas.behaviours.register(new DragPanBehaviour ({ id: 'pan',   enabled: true }));
canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));
```

## Built-in behaviours

The engine ships five opt-in behaviours covering camera input and per-shape dragging.

| Behaviour | Gesture | Purpose |
|---|---|---|
| [`DragPanBehaviour`](/behaviours/drag-pan-behaviour) | pointer drag (optional modifier) | Pan the camera with the mouse / pen / single touch. |
| [`WheelZoomBehaviour`](/behaviours/wheel-zoom-behaviour) | scroll wheel / trackpad pinch | Zoom the camera around the cursor. |
| [`PinchZoomBehaviour`](/behaviours/pinch-zoom-behaviour) | two-finger pinch | Native multi-touch pinch-to-zoom. |
| [`KeyboardCameraInputBehaviour`](/behaviours/keyboard-camera-input-behaviour) | arrow keys / `+` / `-` / `0` | Keyboard-driven pan, zoom, and reset. |
| [`DragShapeBehaviour`](/behaviours/drag-shape-behaviour) | pointer drag on a shape | Drag individual shapes managed by a `PrimitivesRenderer`. |

The first four are camera-input behaviours and operate on `canvas.camera.viewport`. `DragShapeBehaviour` is layer-scoped — pass the layer's `PrimitivesRenderer` at construction.

## Gesture conflicts

Behaviours advertise their `shortcuts` so the registry can warn when two enabled behaviours claim the same gesture. The framework logs `console.warn` — it does **not** enforce. Pick distinct modifiers to resolve (`DragPanBehaviour` accepts `'none' | 'space' | 'shift' | 'alt'` for exactly this reason).

## Authoring your own

Custom hover, select, lasso, brush, and other domain-specific behaviours are built on the same `Behaviour` base class. See [Engine → Behaviours → Authoring a custom Behaviour](/guide/behaviours#authoring-a-custom-behaviour).
