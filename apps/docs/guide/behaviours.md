# Behaviours

A **Behaviour** subscribes to input and translates it into state mutations. That's the whole job.

A Behaviour does **not** render. It does **not** own data. It does **not** keep its own source of truth. Hover detection? Behaviour. Click-to-select logic? Behaviour. Pan and zoom? Camera-scoped behaviour. The visual halo that appears on hover? Not the behaviour — that's the layer projecting `state.hoveredId` to a halo decoration.

This split is important. Once you internalise it, behaviours become small, composable, and easy to reason about.

## The shape

```ts
abstract class Behaviour {
  readonly id: string;
  readonly enabled: boolean;            // default FALSE — opt-in only
  readonly scope: 'layer' | 'canvas';   // inferred from layerId presence
  readonly layerId?: string;
  readonly shortcuts?: readonly string[]; // advisory metadata for conflict warnings

  register(ctx: CanvasContext): void;
  destroy(): void;
  enable(): void;
  disable(): void;

  // Subclass hooks:
  protected abstract onRegister(ctx: CanvasContext): void;
  protected onDestroy(ctx: CanvasContext): void;
  protected onEnable(): void;
  protected onDisable(): void;
}
```

`onRegister` always runs at registration. `onEnable` runs whenever the behaviour transitions from disabled to enabled — you typically wire input listeners here so disabled behaviours have zero subscriber overhead.

## Behaviours never auto-enable

This is **the** rule about behaviours. Every input behaviour — pan, zoom, hover, select, drag — is opt-in. The default is `enabled: false`.

```ts
canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));            // dormant
canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true })); // active
```

Why? Two reasons:

1. **Predictable composition.** A scene's input model is exactly what you wire up — no surprise listeners flowing into your data because you imported the wrong package. Two devs reading the same code see the same input semantics.
2. **Tool switching.** A graph editor with a "pan tool" and a "lasso tool" needs both behaviours registered but only one enabled at a time. Auto-enabling either would fight the other.

`canvas.behaviours.setEnabled(id, boolean)` flips a behaviour at runtime:

```ts
// User clicks the lasso tool button:
canvas.behaviours.setEnabled('pan', false);
canvas.behaviours.setEnabled('lasso', true);
```

## Two scopes: canvas vs layer

The `scope` field is inferred from whether you pass a `layerId`:

| Scope | When | Targets |
|---|---|---|
| **canvas** | no `layerId` | the canvas itself — camera, document-level input |
| **layer** | `layerId: 'graph'` | a single Layer's state and events |

Canvas-scoped behaviours include the built-in camera input — pan, zoom, keyboard navigation. They sit on the canvas, not on any specific layer.

Layer-scoped behaviours target a specific Layer:

```ts
canvas.behaviours.register(
  new HoverActivateBehaviour({ id: 'graph-hover', layerId: 'graph', enabled: true }),
);
canvas.behaviours.register(
  new ClickSelectBehaviour({ id: 'graph-select', layerId: 'graph', enabled: true }),
);
canvas.behaviours.register(
  new LassoSelectBehaviour({ id: 'graph-lasso', layerId: 'graph' }),  // dormant
);
```

Inside a layer-scoped behaviour, fetch the target layer once at register time:

```ts
class HoverActivateBehaviour extends Behaviour {
  protected onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.layerId!);
    if (!layer) {
      throw new Error(`Layer "${this.layerId}" not found — register it first`);
    }
    layer.events.on('node:hover', ({ id }) => {
      if (!this.isEnabled) return;
      layer.state.setState((s) => { s.hoveredId = id; });
    });
  }
}
```

The `isEnabled` guard inside the handler is a cheap `if (!enabled) return;` — it lets the behaviour leave its subscriptions wired up while disabled, dropping events on the floor.

## Behaviour-to-layer binding is always explicit

A layer-scoped behaviour requires a `layerId`. Always. There's no "find the only layer of type T" inference, because adding a second layer of that type would silently change which one you're driving.

If you want sugar for the single-layer case, register the behaviour against a known id — that's what the explicit `layerId` field gives you.

## Built-in behaviours

The canvas kernel ships four camera-input behaviours. All are canvas-scoped. All default to `enabled: false`.

| Behaviour | Gesture | Notes |
|---|---|---|
| `DragPanBehaviour` | drag (with optional modifier) | Modifier: `'none'` \| `'space'` \| `'shift'` \| `'alt'`. Decelerate on by default. |
| `WheelZoomBehaviour` | wheel | Zoom centred on the cursor. |
| `PinchZoomBehaviour` | two-finger pinch | Touch / trackpad. |
| `KeyboardCameraInputBehaviour` | arrow keys + `=`/`-` | Configurable keymap. |

Wire them up explicitly when building a scene:

```ts
import {
  DragPanBehaviour,
  WheelZoomBehaviour,
  PinchZoomBehaviour,
  KeyboardCameraInputBehaviour,
} from '@invana/canvas';

canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom-wheel', enabled: true }));
canvas.behaviours.register(new PinchZoomBehaviour({ id: 'zoom-pinch', enabled: true }));
canvas.behaviours.register(new KeyboardCameraInputBehaviour({ id: 'keyboard', enabled: true }));
```

::: tip Tool switching with modifier keys
Different camera-input gestures can coexist if you reach for modifier keys. `DragPanBehaviour({ modifier: 'space' })` means Space-drag pans; plain drag is free for a lasso behaviour. The same gesture string ends up in `shortcuts: ['space+drag']`, which the registry uses for conflict warnings.
:::

## Shortcut conflict detection

When two enabled behaviours claim the same gesture, the `BehaviourRegistry` logs a warning:

```
[canvas] Behaviour "lasso-select" claims gesture "shift+drag" already used by enabled behaviour "pan".
        Disable one before enabling the other.
```

The warning fires only when both are enabled simultaneously. Two behaviours sharing a gesture where one is disabled is the normal tool-switching case — that's fine.

```ts
new LassoSelectBehaviour({ id: 'lasso', shortcuts: ['shift+drag'] });
new DragPanBehaviour({ id: 'pan', modifier: 'shift' }); // also claims 'shift+drag'
```

`shortcuts` is **advisory**. The framework warns. It does not enforce mutual exclusion — that's the developer's call. Different apps want different rules.

## Where state mutations land

A behaviour doesn't keep its own state. It writes into the appropriate layer's state (or the camera, for canvas-scoped camera behaviours):

```ts
class ClickSelectBehaviour extends Behaviour {
  protected onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.layerId!);
    layer.events.on('node:click', ({ id, originalEvent }) => {
      if (!this.isEnabled) return;
      layer.state.setState((s) => {
        if (originalEvent.shiftKey) {
          // additive selection
          s.selectedIds = new Set([...s.selectedIds, id]);
        } else {
          s.selectedIds = new Set([id]);
        }
      });
    });
  }
}
```

Anything that wants to react to selection — an inspector pane, a halo decoration, a status bar — subscribes to `layer.state` or `layer.events('selection:changed')`. The behaviour and the consumers don't need to know about each other.

## A complete behaviour: drag to move a node

The pattern: subscribe to the layer's pointer events on register, mutate the layer's state on enabled, project to the renderer through the layer's flush loop.

```ts
import { Behaviour, type BehaviourOptions } from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';

export class DragMoveBehaviour extends Behaviour {
  private layer?: GraphLayer;

  constructor(opts: BehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ['drag'] });
  }

  protected onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.layerId!);
    if (!layer) throw new Error(`Layer "${this.layerId}" not found`);
    this.layer = layer;

    layer.events.on('node:pointerdown', ({ id }) => {
      if (!this.isEnabled) return;
      layer.state.setState((s) => { s.draggingId = id; });
    });

    layer.events.on('node:pointermove', ({ worldX, worldY }) => {
      if (!this.isEnabled) return;
      const dragging = layer.state.getState().draggingId;
      if (!dragging) return;
      layer.updateNodePosition(dragging, worldX, worldY);
    });

    layer.events.on('node:pointerup', () => {
      if (!this.isEnabled) return;
      layer.state.setState((s) => { s.draggingId = null; });
    });
  }
}
```

Three event subscriptions, three state mutations. The renderer sees `data.nodes.x/y` change (via the `'shape'` dirty bucket) and re-paints; the layer's `draggingId` state is observable for whatever else cares — a status bar, a "Dragging…" badge, telemetry.

## Lifecycle in full

```
new MyBehaviour({...})         ← constructed, dormant
canvas.behaviours.register(b)  ← onRegister(ctx) called
b.enable()                     ← onEnable() called
b.disable()                    ← onDisable() called
b.enable()                     ← onEnable() called again (idempotent flips ignored)
canvas.behaviours.unregister() ← b.destroy() → onDestroy(ctx) called
```

`canvas.destroy()` calls `unregister` on every behaviour. You don't usually destroy individual behaviours — register them once, toggle `enabled` over the lifetime of the canvas.

## What's next

- [Layers](/guide/layers) — where the state behaviours mutate actually lives
- [Events](/guide/events) — what behaviours subscribe to: layer events vs canvas events
- [Layouts](/guide/layouts) — the third concept; not a behaviour despite running over time
