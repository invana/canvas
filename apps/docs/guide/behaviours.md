# Behaviours

A **Behaviour** subscribes to input and translates it into state mutations. That's the whole job — behaviours never render and never own data.

::: tip Opt-in by default
Every behaviour has `enabled: false` at construction. Register it on `canvas.behaviours`, then call `enable()` (or pass `enabled: true` to the constructor). There is no auto-activation of input behaviours anywhere in the engine.
:::

## Lifecycle

```
construct  →  canvas.behaviours.register(b)  →  enable() / disable()  →  ...  →  unregister()
```

| Method | What it does |
|---|---|
| `register(behaviour)` | Wires the behaviour up (calls `onRegister(ctx)`). If `enabled: true` at construction, also calls `onEnable()` and runs the conflict-warning check. |
| `setEnabled(id, true)` | Calls `onEnable()` — typically adds pixi-viewport plugins or DOM listeners. |
| `setEnabled(id, false)` | Calls `onDisable()` — drops the plugins / listeners. |
| `unregister(id)` | Calls `destroy()` — drops everything. |
| `get<T>(id)` | Typed lookup. |

## Built-in behaviours

Five ship today, all camera-input. Authoring custom behaviours (hover, select, drag-shape, lasso, brush) is the next layer up.

### `DragPanBehaviour`

Pointer-drag panning via the pixi-viewport `drag` plugin.

```ts
import { DragPanBehaviour } from '@invana/canvas';

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

| Option | Default | Description |
|---|---|---|
| `modifier` | `'none'` | Modifier required during drag. `'space'` matches Figma/Sketch; `'shift'` / `'alt'` are also available. |
| `mouseButtons` | `'left'` | Which buttons trigger drag. |
| `decelerate` | `true` | Add momentum deceleration. |

The advertised gesture string is `'drag'` or `'${modifier}+drag'` — used by the registry for conflict warnings.

### `WheelZoomBehaviour`

Scroll-wheel zoom via the `wheel` plugin. Trackpad pinch zooms instead of scrolling.

```ts
import { WheelZoomBehaviour } from '@invana/canvas';

canvas.behaviours.register(
  new WheelZoomBehaviour({
    id: 'wheel-zoom',
    enabled: true,
    requireCtrl: false,      // true → only ctrl+wheel zooms (good for inline embeds)
    percent: 0.1,            // 10% per tick
    smooth: false,           // false = snap; e.g. 8 = ease-out over 8 frames
  }),
);
```

### `PinchZoomBehaviour`

Two-finger pinch-to-zoom via the `pinch` plugin. Pair with `WheelZoomBehaviour` for touch + trackpad coverage.

```ts
import { PinchZoomBehaviour } from '@invana/canvas';

canvas.behaviours.register(
  new PinchZoomBehaviour({
    id: 'pinch-zoom',
    enabled: true,
    noDrag: false,           // true = pinch only zooms, doesn't centre
    percent: 0.1,
  }),
);
```

### `KeyboardCameraInputBehaviour`

Keyboard pan + zoom. Listens on `document`, so the canvas does not need keyboard focus. Input fields / textareas / selects are automatically excluded.

```ts
import { KeyboardCameraInputBehaviour } from '@invana/canvas';

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

Default keymap:

| Action | Keys |
|---|---|
| Pan | `ArrowUp` / `Down` / `Left` / `Right` |
| Zoom in | `+`, `=`, `NumpadAdd` |
| Zoom out | `-`, `NumpadSubtract` |
| Reset zoom to 1:1 | `0`, `Numpad0` |

### `DragShapeBehaviour`

Pointer-drag move for individual shapes managed by a `PrimitivesRenderer`. Layer-scoped — pass the renderer reference at construction.

```ts
import { DragShapeBehaviour } from '@invana/canvas';

canvas.behaviours.register(
  new DragShapeBehaviour({
    id: 'drag-shapes',
    layerId: 'demo',
    renderer: demo.renderer,    // the layer's PrimitivesRenderer
    enabled: true,
    reRouteConnectors: true,    // re-route every connector after each move
    filter: (id) => !id.endsWith(':badge'),
    dragCursor: 'grabbing',
  }),
);
```

What it does:

1. Subscribes to `shape:pointerdown` from the renderer.
2. Pauses the viewport's pan plugin so the camera doesn't pan while you move a shape.
3. Window-level `pointermove` updates the shape via `renderer.updateShape(id, { x, y })` so the click point stays under the cursor.
4. When `reRouteConnectors: true`, re-routes every connector after each move (needed for obstacle-aware routers like `manhattan`).
5. `pointerup` / `pointercancel` end the drag; viewport pan resumes.

Set `reRouteConnectors: false` when you have thousands of edges and per-move re-route cost matters, or when you re-route via a smarter graph-level signal.

## Gesture conflicts

Behaviours advertise their `shortcuts` so the registry can warn when two enabled behaviours claim the same gesture. The framework logs `console.warn` — it does **not** enforce. You decide whether two behaviours can coexist on the same gesture.

```ts
new DragPanBehaviour({ id: 'pan', enabled: true, modifier: 'shift' });   // claims 'shift+drag'
new LassoBehaviour ({ id: 'lasso', enabled: true });                     // also claims 'shift+drag'
// → console.warn: gesture conflict on 'shift+drag' between 'pan' and 'lasso'
```

The standard way to resolve: pick distinct modifiers. `DragPanBehaviour` supports `'none' | 'space' | 'shift' | 'alt'` for exactly this reason.

## Authoring a custom Behaviour

```ts
import { Behaviour, type BehaviourOptions, type CanvasContext } from '@invana/canvas';

interface ClickToFocusOptions extends BehaviourOptions {
  layerId: string;
}

class ClickToFocusBehaviour extends Behaviour {
  private off?: () => void;

  constructor(opts: ClickToFocusOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ['click'] });
  }

  protected onRegister(ctx: CanvasContext): void {
    // wire everything during enable so disable can cleanly drop it
  }

  protected onEnable(): void {
    const handler = (e: MouseEvent) => {
      if (!this.isEnabled) return;
      const { x, y } = this.ctx!.camera.toWorld(e.offsetX, e.offsetY);
      // ... lookup hit, mutate state on the target layer
    };
    document.addEventListener('click', handler);
    this.off = () => document.removeEventListener('click', handler);
  }

  protected onDisable(): void {
    this.off?.();
    this.off = undefined;
  }

  protected onDestroy(): void {
    this.onDisable();
  }
}
```

Rules of thumb:

- Mutate `layer.state` only — never reach into the renderer directly.
- Subscribe in `onEnable`, drop subscriptions in `onDisable` (and again in `onDestroy` for safety).
- Set `shortcuts` so the registry can detect conflicts.
- Default `enabled: false`. The developer opts in.

## Bus events you can rely on

| Event | When |
|---|---|
| `'behaviour:registered'` | After `register(b)` succeeds. |
| `'behaviour:enabled'` | After `enable()` (or `register` of an `enabled: true` behaviour). |
| `'behaviour:disabled'` | After `disable()`. |

All three flow through the tap channel.
